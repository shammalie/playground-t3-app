import { createClient } from "redis";
import { env } from "~/env";

const globalForRedis = globalThis as unknown as {
  redis: ReturnType<typeof createClient> | undefined;
};

export const redis =
  globalForRedis.redis ??
  createClient({
    url: env.CACHE_URL,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
      connectTimeout: 5000,
    },
  })
    .on("error", (err) => console.error("Redis Client Error: ", err))
    .on("connect", () => console.info("Redis connected"))
    .on("reconnecting", () => console.info("Redis reconnecting"))
    .on("ready", () => {
      console.info("Redis ready!");
    });

if (env.NODE_ENV !== "production") globalForRedis.redis = redis;
