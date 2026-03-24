import { redirect } from "next/navigation";

import { FundSourcePageClient } from "~/components/pages/manage/fund-source/fund-source-page-client";
import { parseUserId } from "~/lib/auth/parse-user-id";
import { auth } from "~/server/auth";
import { getFundSourceWithBalanceUseCase } from "~/usecase/manage/fund-source.usecase";

export default async function ManageFundSourcePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = parseUserId(session.user.id);
  if (!userId) {
    redirect("/");
  }

  const fundSources = await getFundSourceWithBalanceUseCase(userId);
  return <FundSourcePageClient userId={userId} fundSources={fundSources} />;
}
