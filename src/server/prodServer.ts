import next from 'next';
import { createServer } from 'node:http';
import { parse } from 'node:url';
import type { Socket } from 'net';

import { WebSocketServer } from 'ws';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { appRouter } from './api/root';
import { createContext } from 'react';
import { env } from '~/env';
import { nodeHTTPRequestHandler } from '@trpc/server/adapters/node-http';
import logger from 'node_modules/next-auth/utils/logger';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';

const app = next({
    dev: env.NODE_ENV !== "production",
    hostname: process.env.HOSTNAME,
    port: process.env.PORT,
    customServer: true,
  });
  
  await app.prepare();
  
  const getHandler = app.getRequestHandler();
  const upgradeHandler = app.getUpgradeHandler();
  
  const server = createServer((req, res) => {
    // routes starting with /api/trpc are handled by trpc
    if (req.url?.startsWith("/api/trpc")) {
      const path = new URL(
        req.url.startsWith("/") ? `http://127.0.0.1${req.url}` : req.url,
      ).pathname.replace("/api/trpc/", "");
  
      return void nodeHTTPRequestHandler({
        path,
        req,
        res,
        router: appRouter,
        createContext: ({ req }) => {
          return createContext({
            req,
            res,
          });
        },
      });
    }
  
    getHandler(req, res).catch((error) => {
      logger.error(error);
      res.statusCode = 500;
      res.end("Internal Server Error");
    });
  });
  
  // create the websocket server
  const wss = new WebSocketServer({ noServer: true });
  const trpcHandler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext: ({ req }) => {
      return createContext({
        req,
      });
    },
  });
  
  process.on("SIGTERM", () => {
    logger.warn("SIGTERM received, shutting down...");
    trpcHandler.broadcastReconnectNotification();
    server.close(() => {
      process.exit(0);
    });
  });
  
  // handle the upgrade
  server.on("upgrade", (req, socket, head) => {
    // send trpc requests to the trpc server
    if (req.url?.startsWith("/api/trpc")) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    } else {
      void upgradeHandler(req, socket, head);
    }
  });
  
  server.listen(process.env.PORT, process.env.HOSTNAME, () => { ... });