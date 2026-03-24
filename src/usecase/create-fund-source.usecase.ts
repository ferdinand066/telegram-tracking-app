import { fundSourceRepository } from "~/repository/fund-source.repository";

type CreateFundSourceInput = {
  userId: number;
  name: string;
  detail: string | null;
};

export const createFundSourceUseCase = async (
  input: CreateFundSourceInput,
): Promise<void> => {
  await fundSourceRepository.create({
    user_id: input.userId,
    name: input.name,
    detail: input.detail,
  });
};
