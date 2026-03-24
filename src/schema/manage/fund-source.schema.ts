import { z } from "zod";

export const createFundSourceSchema = z.object({
  name: z.string().trim().min(1, "Fund source name is required."),
  description: z
    .string()
    .trim()
    .max(255, "Description is too long.")
    .optional(),
});

export const updateFundSourceSchema = z.object({
  fundSourceId: z.string().min(1, "Fund source id is required."),
  name: z.string().trim().min(1, "Fund source name is required."),
  description: z
    .string()
    .trim()
    .max(255, "Description is too long.")
    .optional(),
});

export type CreateFundSourceFormValues = z.infer<typeof createFundSourceSchema>;
export type UpdateFundSourceFormValues = z.infer<typeof updateFundSourceSchema>;
