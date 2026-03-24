"use server";

import { revalidatePath } from "next/cache";

import {
  createFundSourceSchema,
  updateFundSourceSchema,
  type CreateFundSourceFormValues,
  type UpdateFundSourceFormValues,
} from "~/schema/manage/fund-source.schema";
import {
  createManageFundSourceUseCase,
  renameFundSourceUseCase,
} from "~/usecase/manage/fund-source.usecase";

export async function createFundSourceAction(
  userId: number,
  values: CreateFundSourceFormValues,
): Promise<void> {
  const parsed = createFundSourceSchema.safeParse(values);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  await createManageFundSourceUseCase({
    userId,
    name: parsed.data.name,
    description: parsed.data.description,
  });
  revalidatePath("/manage/fund-source");
}

export async function renameFundSourceAction(
  userId: number,
  values: UpdateFundSourceFormValues,
): Promise<void> {
  const parsed = updateFundSourceSchema.safeParse(values);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  await renameFundSourceUseCase({
    userId,
    fundSourceId: parsed.data.fundSourceId,
    name: parsed.data.name,
    description: parsed.data.description,
  });
  revalidatePath("/manage/fund-source");
}
