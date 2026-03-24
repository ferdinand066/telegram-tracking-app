import { z } from "zod";

export const devUsernameLoginSchema = z.object({
  username: z.string().trim().min(1, "Username is required."),
});

export type DevUsernameLoginFormValues = z.infer<typeof devUsernameLoginSchema>;
