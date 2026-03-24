import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "~/components/layout/app-shell";
import { getSidebarUser } from "~/lib/auth/sidebar-user";
import { auth } from "~/server/auth";

type ManageLayoutProps = {
  children: ReactNode;
};

export default async function ManageLayout({
  children,
}: Readonly<ManageLayoutProps>) {
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
