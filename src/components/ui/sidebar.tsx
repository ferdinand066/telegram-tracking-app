"use client";

import * as React from "react";
import { PanelLeftIcon } from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";

type SidebarContextValue = {
  openMobile: boolean;
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used inside SidebarProvider");
  }

  return context;
}

function SidebarProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [openMobile, setOpenMobile] = React.useState(false);

  const toggleSidebar = React.useCallback(() => {
    setOpenMobile((previous) => !previous);
  }, []);

  return (
    <SidebarContext.Provider
      value={{ openMobile, setOpenMobile, toggleSidebar }}
    >
      <div className="relative flex min-h-screen">{children}</div>
    </SidebarContext.Provider>
  );
}

function Sidebar({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  const { openMobile, setOpenMobile } = useSidebar();

  return (
    <>
      <div
        className={cn(
          "bg-sidebar/80 fixed inset-0 z-40 md:hidden",
          openMobile ? "block" : "hidden",
        )}
        onClick={() => setOpenMobile(false)}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground border-sidebar-border fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r transition-transform md:sticky md:z-30 md:w-64 md:translate-x-0",
          openMobile ? "translate-x-0" : "-translate-x-full",
          className,
        )}
        aria-label="Sidebar navigation"
      >
        {children}
      </aside>
    </>
  );
}

function SidebarTrigger({ className }: Readonly<{ className?: string }>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("md:hidden", className)}
      onClick={toggleSidebar}
    >
      <PanelLeftIcon className="rtl:rotate-180" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

function SidebarContent({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <div className={cn("flex-1 overflow-y-auto p-3", className)}>
      {children}
    </div>
  );
}

function SidebarHeader({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <div className={cn("border-sidebar-border border-b p-3", className)}>
      {children}
    </div>
  );
}

function SidebarFooter({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <div className={cn("border-sidebar-border border-t p-3", className)}>
      {children}
    </div>
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
};
