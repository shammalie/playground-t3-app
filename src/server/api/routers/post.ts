import { observable } from "@trpc/server/observable";
import { emit } from "process";
import { z } from "zod";

import {
  createTRPCRouter,
  ee,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // simulate a slow db call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await ctx.db.post.create({
        data: {
          name: input.name,
          createdBy: { connect: { id: ctx.session.user.id } },
        },
      });

      ee.emit("add", response.name);
      return response;
    }),

  getLatest: protectedProcedure.query(({ ctx }) => {
    return ctx.db.post.findFirst({
      orderBy: { createdAt: "desc" },
      where: { createdBy: { id: ctx.session.user.id } },
    });
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  getFromCache: publicProcedure
    .input(
      z.object({
        key: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await ctx.redis.connect();
      const value = await ctx.redis.get(input.key);
      await ctx.redis.quit();
      return value;
    }),

  setCacheItem: publicProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.redis.connect();
      await ctx.redis.setEx(input.key, 5, input.value)
      const value = await ctx.redis.get(input.key);
      await ctx.redis.quit();
      return value;
    }),

  onAdd: publicProcedure.subscription(() => {
    return observable<string>((emit) => {
      const onAdd = (data: string) => {
        emit.next(data);
      };

      ee.on("add", onAdd);

      return () => {
        ee.off("add", onAdd);
      };
    });
  }),
});
