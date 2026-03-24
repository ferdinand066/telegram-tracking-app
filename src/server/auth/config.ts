import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";

import { env } from "~/env.js";
import { userRepository } from "~/repository/user.repository";
import { getDevLoginUserUseCase } from "~/usecase/auth/get-dev-login-user.usecase";

import {
  isTelegramAuthDateValid,
  verifyTelegramWidgetAuth,
} from "./verify-telegram-widget";

function credentialString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      username?: string | null;
    } & DefaultSession["user"];
  }
}

function extractUsername(candidate: unknown): string | null {
  if (typeof candidate !== "object" || candidate == null) {
    return null;
  }

  const username = (candidate as { username?: unknown }).username;
  return typeof username === "string" && username.length > 0 ? username : null;
}

export const authConfig = {
  providers: [
    Credentials({
      id: "telegram",
      name: "Telegram",
      credentials: {
        id: { label: "id", type: "text" },
        first_name: { label: "First name", type: "text" },
        last_name: { label: "Last name", type: "text" },
        username: { label: "Username", type: "text" },
        photo_url: { label: "Photo URL", type: "text" },
        auth_date: { label: "Auth date", type: "text" },
        hash: { label: "Hash", type: "text" },
      },
      async authorize(credentials) {
        const id = credentialString(credentials?.id);
        const first_name = credentialString(credentials?.first_name);
        const auth_date = credentialString(credentials?.auth_date);
        const hash = credentialString(credentials?.hash);
        if (!id || !first_name || !auth_date || !hash) {
          return null;
        }

        const data: Record<string, string> = {
          id,
          first_name,
          auth_date,
          hash,
        };
        const last_name = credentialString(credentials?.last_name);
        const username = credentialString(credentials?.username);
        const photo_url = credentialString(credentials?.photo_url);
        if (last_name) data.last_name = last_name;
        if (username) data.username = username;
        if (photo_url) data.photo_url = photo_url;

        if (!verifyTelegramWidgetAuth(data, env.TELEGRAM_BOT_TOKEN)) {
          return null;
        }

        const authDateSec = Number(auth_date);
        if (!isTelegramAuthDateValid(authDateSec)) {
          return null;
        }

        const telegramId = Number(id);
        if (!Number.isInteger(telegramId) || telegramId <= 0) {
          return null;
        }

        const appUser = await userRepository.upsert(
          telegramId,
          username ?? undefined,
          first_name,
        );
        if (!appUser) {
          return null;
        }

        const joined = [first_name, last_name ?? ""].filter(Boolean).join(" ");
        const name =
          joined !== ""
            ? joined
            : username !== null && username !== ""
              ? username
              : `Telegram ${id}`;

        return {
          id: `telegram:${appUser.id}`,
          name,
          image: photo_url ?? undefined,
          username: username ?? null,
        };
      },
    }),
    Credentials({
      id: "dev-username",
      name: "Development Username",
      credentials: {
        username: { label: "Username", type: "text" },
      },
      async authorize(credentials) {
        if (env.NODE_ENV === "production") {
          return null;
        }

        const username = credentialString(credentials?.username)?.trim();
        if (!username) {
          return null;
        }

        const user = await getDevLoginUserUseCase(username);
        if (!user) {
          return null;
        }

        return {
          id: `dev:${user.id}`,
          name: user.username ?? user.first_name ?? username,
          username: user.username ?? null,
        };
      },
    }),
    DiscordProvider,
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      const username = extractUsername(user);
      if (username !== null) {
        token.username = username;
      }
      return token;
    },
    session({ session, token }) {
      const id =
        typeof token.id === "string" && token.id.length > 0
          ? token.id
          : (token.sub ?? "");
      return {
        ...session,
        user: {
          ...session.user,
          id,
          username: token.username ?? null,
        },
      };
    },
  },
} satisfies NextAuthConfig;
