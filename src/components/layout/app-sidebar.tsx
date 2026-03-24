"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { ChevronDown, Home, Landmark, LogOut, ReceiptText } from "lucide-react";
import * as React from "react";

import { Button } from "~/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "~/components/ui/sidebar";
import { cn } from "~/lib/utils";

type AppSidebarProps = {
  user: {
    firstName: string;
    username: string;
    image: string | null;
  };
  currentPath: string;
};

export function AppSidebar({ user, currentPath }: Readonly<AppSidebarProps>) {
  const [isManageOpen, setIsManageOpen] = React.useState(
    currentPath.startsWith("/manage"),
  );

  const isHomeActive = currentPath === "/";
  const isFundSourceActive = currentPath === "/manage/fund-source";
  const isTransactionsActive = currentPath === "/manage/transaction";

  return (
    <Sidebar>
      <SidebarHeader>
        <p className="text-sm font-semibold">Fund Tracker</p>
      </SidebarHeader>

      <SidebarContent>
        <nav className="space-y-1">
          <Link
            href="/"
            className={cn(
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              isHomeActive &&
                "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
          >
            <Home className="size-4" />
            <span>Home</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsManageOpen((previous) => !previous)}
            className={cn(
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              (isFundSourceActive || isTransactionsActive) &&
                "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
            aria-expanded={isManageOpen}
          >
            <Landmark className="size-4" />
            <span>Manage</span>
            <ChevronDown
              className={cn(
                "ml-auto size-4 transition-transform",
                isManageOpen && "rotate-180",
              )}
            />
          </button>

          {isManageOpen && (
            <div className="border-sidebar-border ml-3 space-y-1 border-l pl-3">
              <Link
                href="/manage/fund-source"
                className={cn(
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  isFundSourceActive &&
                    "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                <Landmark className="size-4" />
                <span>Fund Source</span>
              </Link>
              <Link
                href="/manage/transaction"
                className={cn(
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  isTransactionsActive &&
                    "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                <ReceiptText className="size-4" />
                <span>Transactions</span>
              </Link>
            </div>
          )}
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {user.image ? (
              <Image
                src={user.image}
                alt={`${user.firstName} profile`}
                className="size-10 rounded-full object-cover"
                width={40}
                height={40}
              />
            ) : (
              <div className="bg-sidebar-accent text-sidebar-accent-foreground flex size-10 items-center justify-center rounded-full text-sm font-semibold">
                {user.firstName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.firstName}</p>
              <p className="text-muted-foreground truncate text-xs">
                {user.username}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="destructive"
            className="w-full justify-start"
            onClick={() => void signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="size-4" />
            <span>Sign out</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
