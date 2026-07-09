import { z } from "zod";

export const ZCreateTeamInputSchema = z.object({
  name: z.string().trim().min(1),
  slug: z
    .string()
    .trim()
    .min(1)
    .optional(),
  bio: z.string().trim().optional(),
});

export type TCreateTeamInputSchema = z.infer<typeof ZCreateTeamInputSchema>;
