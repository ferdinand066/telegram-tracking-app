import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "~/components/layout/app-shell";
import { getSidebarUser } from "~/lib/auth/sidebar-user";
import { auth } from "~/server/auth";

type SidebarLayoutProps = {
  children: ReactNode;
};

export default async function SidebarLayout({
  children,
}: Readonly<SidebarLayoutProps>) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const sidebarUser = getSidebarUser(session.user);

  return (
    <AppShell user={sidebarUser}>
      <main className="bg-background text-foreground min-h-screen">
        {children}
      </main>
    </AppShell>
  );
}
