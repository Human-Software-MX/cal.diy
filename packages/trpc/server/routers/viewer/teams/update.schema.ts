import { z } from "zod";

export const ZUpdateTeamInputSchema = z.object({
  teamId: z.number().int().positive(),
  name: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional(),
  bio: z.string().trim().optional(),
});

export type TUpdateTeamInputSchema = z.infer<typeof ZUpdateTeamInputSchema>;
