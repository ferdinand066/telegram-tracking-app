"use client";

import { AlertCircleIcon, Send } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { cn } from "~/lib/utils";

const alertDark =
  "border-red-800/80 bg-red-950/40 text-red-200 [&_[data-slot=alert-title]]:text-red-100 [&_[data-slot=alert-description]]:text-red-300/95 [&_svg]:text-red-400";

/** Matches Telegram’s login widget embed (e.g. `telegram-widget.js?23`). */
const TELEGRAM_WIDGET_SCRIPT_SRC =
  "https://telegram.org/js/telegram-widget.js?23";

type TelegramWidgetUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

function buildCredentials(user: TelegramWidgetUser): Record<string, string> {
  const creds: Record<string, string> = {
    id: String(user.id),
    first_name: user.first_name,
    auth_date: String(user.auth_date),
    hash: user.hash,
  };
  if (user.last_name) creds.last_name = user.last_name;
  if (user.username) creds.username = user.username;
  if (user.photo_url) creds.photo_url = user.photo_url;
  return creds;
}

export function TelegramLoginWidget({
  botUsername,
}: Readonly<{ botUsername: string }>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onTelegramAuth = useCallback(
    async (user: TelegramWidgetUser) => {
      setError(null);
      setIsSubmitting(true);
      try {
        const result = await signIn("telegram", {
          ...buildCredentials(user),
          redirect: false,
        });
        if (result?.error) {
          setError("Could not sign in with Telegram. Try again.");
          return;
        }
        router.push(callbackUrl);
        router.refresh();
      } finally {
        setIsSubmitting(false);
      }
    },
    [callbackUrl, router],
  );

  useEffect(() => {
    const w = window as unknown as {
      onTelegramAuth?: (user: TelegramWidgetUser) => void;
    };
    w.onTelegramAuth = (user) => {
      void onTelegramAuth(user);
    };
    return () => {
      delete w.onTelegramAuth;
    };
  }, [onTelegramAuth]);

  useEffect(() => {
    if (!botUsername || !containerRef.current) return;

    const el = containerRef.current;
    el.innerHTML = "";

    const script = document.createElement("script");
    script.src = TELEGRAM_WIDGET_SCRIPT_SRC;
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");

    el.appendChild(script);
    return () => {
      if (script.parentNode === el) {
        el.removeChild(script);
      }
    };
  }, [botUsername]);

  return (
    <Card
      className={cn(
        "w-full max-w-md border-0 bg-gray-900 shadow-none ring-1 ring-gray-800",
        "text-gray-100",
      )}
    >
      <CardHeader className="gap-2 pb-2">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/25">
            <Send className="size-4" aria-hidden />
          </span>
          <div>
            <CardTitle className="font-heading text-lg font-semibold text-white">
              Telegram
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Official login widget
            </CardDescription>
          </div>
        </div>
        <p className="pt-1 text-sm leading-relaxed text-gray-400">
          Tap the button below to authorize in Telegram. Your domain must match
          what you set with{" "}
          <code className="rounded bg-gray-950 px-1.5 py-0.5 font-mono text-[0.7rem] text-indigo-300 ring-1 ring-gray-800">
            /setdomain
          </code>{" "}
          in BotFather.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-2">
        {!botUsername ? (
          <Alert variant="destructive" className={alertDark}>
            <AlertCircleIcon />
            <AlertTitle>Bot username not configured</AlertTitle>
            <AlertDescription>
              Set{" "}
              <code className="rounded bg-gray-950/80 px-1 py-0.5 font-mono text-xs text-gray-200 ring-1 ring-gray-800">
                TELEGRAM_BOT_USERNAME
              </code>{" "}
              on the server to your bot name (no @), then restart the app.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {error ? (
              <Alert variant="destructive" className={alertDark}>
                <AlertCircleIcon />
                <AlertTitle>Sign-in failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <div
              className={cn(
                "flex min-h-[44px] items-center justify-center rounded-xl border border-dashed border-gray-700 bg-gray-950/60 px-4 py-6 transition",
                "hover:border-indigo-500/50 hover:bg-gray-950/80",
                "[&_iframe]:max-w-full [&_iframe]:rounded-md",
              )}
              aria-busy={isSubmitting}
            >
              <div ref={containerRef} className="flex justify-center" />
            </div>
            {isSubmitting ? (
              <p className="text-center text-sm text-gray-500">
                Completing sign-in…
              </p>
            ) : null}
          </>
        )}
      </CardContent>
      <CardFooter className="border-t border-gray-800 bg-gray-950/40 px-4 py-3 sm:px-6">
        <p className="text-center text-xs leading-relaxed text-gray-500 sm:text-left">
          If you see &quot;Bot domain invalid&quot;, open BotFather → your bot →
          Bot Settings → Domain and add this site&apos;s origin (e.g.{" "}
          <code className="rounded bg-gray-900 px-1 py-px font-mono text-[0.65rem] text-gray-400">
            localhost
          </code>{" "}
          for local dev).
        </p>
      </CardFooter>
    </Card>
  );
}
