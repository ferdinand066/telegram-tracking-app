import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { TelegramLoginWidget } from "~/components/auth/telegram-login-widget";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { env } from "~/env";
import { auth } from "~/server/auth";
import HomeLink from "./components/home-link";

export const metadata: Metadata = {
  title: "Sign in · Fund Tracker",
  description: "Sign in with Telegram",
};

function LoginLoading() {
  return (
    <Card className="w-full max-w-md animate-pulse border-0 bg-gray-900 shadow-none ring-1 ring-gray-800">
      <CardHeader className="gap-3">
        <div className="h-7 w-40 rounded-md bg-gray-800" />
        <div className="h-10 w-full rounded-md bg-gray-800/80" />
      </CardHeader>
      <CardContent className="min-h-32 rounded-lg bg-gray-950/50 ring-1 ring-gray-800" />
    </Card>
  );
}

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  const botUsername = env.TELEGRAM_BOT_USERNAME ?? "";

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-white">Sign in</h1>
          <p className="mt-1 text-sm text-gray-400">
            Use Telegram to access your fund tracker. Same bot you chat with for
            receipts and balances.
          </p>
        </div>

        <Suspense fallback={<LoginLoading />}>
          <TelegramLoginWidget botUsername={botUsername} />
        </Suspense>

        <div className="mt-8 flex justify-center sm:justify-start">
          <HomeLink />
        </div>
      </div>
    </main>
  );
}
