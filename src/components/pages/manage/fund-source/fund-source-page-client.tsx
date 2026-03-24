"use client";

import { Card, CardContent } from "~/components/ui/card";
import type { FundSourceWithBalance } from "~/usecase/manage/fund-source.usecase";
import CreateFundSourceForm from "./create-fund-source-form";
import FundSourceRow from "./fund-source-row";

type FundSourcePageClientProps = {
  userId: number;
  fundSources: FundSourceWithBalance[];
};

export const FundSourcePageClient = ({
  userId,
  fundSources,
}: Readonly<FundSourcePageClientProps>) => {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">
          Manage Fund Source
        </h1>
        <p className="text-muted-foreground text-sm">
          Track balance per fund source, create new source, and edit source
          details.
        </p>
      </div>

      <CreateFundSourceForm userId={userId} />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase">Fund Source List</h2>
        {fundSources.length === 0 ? (
          <Card size="sm">
            <CardContent>
              <p className="text-muted-foreground text-sm">
                No fund source found.
              </p>
            </CardContent>
          </Card>
        ) : (
          fundSources.map((fundSource) => (
            <FundSourceRow
              key={fundSource.id}
              userId={userId}
              fundSource={fundSource}
            />
          ))
        )}
      </section>
    </div>
  );
};
