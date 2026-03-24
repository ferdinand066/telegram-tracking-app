import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DevUsernameLoginWidget } from "~/components/pages/login/dev-username-login-widget";
import { TelegramLoginWidget } from "~/components/pages/login/telegram-login-widget";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { env } from "~/env";
import { auth } from "~/server/auth";
import HomeLink from "../../components/pages/login/home-link";

export const metadata: Metadata = {
  title: "Sign in · Fund Tracker",
  description: "Sign in with Telegram",
};

function LoginLoading() {
  return (
    <Card className="bg-card ring-border w-full max-w-md animate-pulse border-0 shadow-none ring-1">
      <CardHeader className="gap-3">
        <div className="bg-muted h-7 w-40 rounded-md" />
        <div className="bg-muted/80 h-10 w-full rounded-md" />
      </CardHeader>
      <CardContent className="bg-background/60 ring-border min-h-32 rounded-lg ring-1" />
    </Card>
  );
}

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  const isDevelopmentMode = env.NODE_ENV !== "production";
  const botUsername = env.TELEGRAM_BOT_USERNAME ?? "";

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-foreground text-2xl font-bold">Sign in</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isDevelopmentMode
              ? "Development mode: sign in with username only."
              : "Use Telegram to access your fund tracker. Same bot you chat with for receipts and balances."}
          </p>
        </div>

        {isDevelopmentMode ? (
          <DevUsernameLoginWidget />
        ) : (
          <Suspense fallback={<LoginLoading />}>
            <TelegramLoginWidget botUsername={botUsername} />
          </Suspense>
        )}

        <div className="mt-8 flex justify-center sm:justify-start">
          <HomeLink />
        </div>
      </div>
    </main>
  );
}
