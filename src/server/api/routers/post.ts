import { z } from "zod";

import {
  createTRPCRouter,
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
    .mutation(async ({ input }) => {
      // Prisma removed for now; keep the endpoint shape so the UI compiles.
      return { name: input.name };
    }),

  getLatest: protectedProcedure.query(async () => {
    // No DB-backed implementation yet (Prisma removed). Returning `null` keeps the UI consistent.
    return null as { name: string } | null;
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
