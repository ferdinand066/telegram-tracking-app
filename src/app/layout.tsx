import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { AuthSessionProvider } from "~/components/auth/session-provider";
import { ThemeProvider } from "~/components/theme/theme-provider";
import { ThemeToggle } from "~/components/theme/theme-toggle";
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

const themeInitScript = `
(() => {
  const key = "fund-tracker-theme";
  const root = document.documentElement;
  const stored = window.localStorage.getItem(key);
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const useDark = stored ? stored === "dark" : systemDark;
  root.classList.toggle("dark", useDark);
})();
`;

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
    <head>
      <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
    </head>
    <body>
      <ThemeProvider>
        <AuthSessionProvider>
          <TRPCReactProvider>
            <div className="fixed top-4 right-4 z-50">
              <ThemeToggle />
            </div>
            {children}
          </TRPCReactProvider>
        </AuthSessionProvider>
      </ThemeProvider>
    </body>
  </html>
);

export default RootLayout;
