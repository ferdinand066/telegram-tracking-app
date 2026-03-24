import { webhookCallback } from "grammy";
import { bot } from "~/lib/bot";

export const maxDuration = 120;

/** grammy defaults to 10_000 ms — OCR needs longer than that to finish. */
const handler = webhookCallback(bot, "std/http", {
  timeoutMilliseconds: maxDuration * 1000,
});

export const POST = handler;
