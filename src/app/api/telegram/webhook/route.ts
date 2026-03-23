import { webhookCallback } from "grammy";
import { bot } from "~/lib/bot";

const handler = webhookCallback(bot, "std/http");

export const POST = handler;
