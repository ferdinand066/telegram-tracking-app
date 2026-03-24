import { webhookCallback } from "grammy";
import { bot } from "~/lib/bot";

export const maxDuration = 120;

const handler = webhookCallback(bot, "std/http");

export const POST = handler;
