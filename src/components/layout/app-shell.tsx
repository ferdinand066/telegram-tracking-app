"use client";

import { usePathname } from "next/navigation";
import * as React from "react";

import { AppSidebar } from "~/components/layout/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";

type AppShellProps = {
  children: React.ReactNode;
  user: {
    firstName: string;
    username: string;
    image: string | null;
  };
};

export function AppShell({ children, user }: Readonly<AppShellProps>) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <AppSidebar user={user} currentPath={pathname} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="bg-background/90 sticky top-0 z-20 flex h-14 items-center gap-2 border-b px-4 backdrop-blur md:hidden">
          <SidebarTrigger />
          <p className="text-sm font-semibold">Fund Tracker</p>
        </header>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </SidebarProvider>
  );
}
