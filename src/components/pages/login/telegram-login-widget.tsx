"use client";

import { AlertCircleIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";

const alertStyles =
  "border-destructive/30 bg-destructive/10 text-foreground [&_[data-slot=alert-title]]:text-foreground [&_[data-slot=alert-description]]:text-muted-foreground [&_svg]:text-destructive";

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
        "bg-card ring-border w-full max-w-md border-0 p-0 shadow-none ring-1",
        "text-card-foreground",
      )}
    >
      <CardContent className="flex flex-col gap-4 p-0">
        {!botUsername ? (
          <Alert variant="destructive" className={alertStyles}>
            <AlertCircleIcon />
            <AlertTitle>Bot username not configured</AlertTitle>
            <AlertDescription>
              Set{" "}
              <code className="bg-muted text-muted-foreground ring-border rounded px-1 py-0.5 font-mono text-xs ring-1">
                TELEGRAM_BOT_USERNAME
              </code>{" "}
              on the server to your bot name (no @), then restart the app.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {error ? (
              <Alert variant="destructive" className={alertStyles}>
                <AlertCircleIcon />
                <AlertTitle>Sign-in failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <div
              className={cn(
                "bg-background/60 border-border flex min-h-[44px] items-center justify-center rounded-xl border border-dashed px-4 py-6 transition",
                "hover:border-ring/60 hover:bg-background/80",
                "[&_iframe]:max-w-full [&_iframe]:rounded-md",
              )}
              aria-busy={isSubmitting}
            >
              <div ref={containerRef} className="flex justify-center" />
            </div>
            {isSubmitting ? (
              <p className="text-muted-foreground text-center text-sm">
                Completing sign-in…
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
