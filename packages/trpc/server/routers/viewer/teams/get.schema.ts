import { z } from "zod";

export const ZGetTeamInputSchema = z.object({
  teamId: z.number().int().positive(),
});

export type TGetTeamInputSchema = z.infer<typeof ZGetTeamInputSchema>;
