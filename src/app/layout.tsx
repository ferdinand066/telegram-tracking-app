import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { AuthSessionProvider } from "~/components/auth/session-provider";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Fund Tracker",
  description: "Track your funds with ease",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <html lang="en" className={`${geist.variable}`}>
    <body>
      <AuthSessionProvider>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </AuthSessionProvider>
    </body>
  </html>
);

export default RootLayout;
