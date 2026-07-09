import { z } from "zod";

export const ZRemoveMemberInputSchema = z.object({
  teamId: z.number().int().positive(),
  userId: z.number().int().positive(),
});

export type TRemoveMemberInputSchema = z.infer<typeof ZRemoveMemberInputSchema>;
