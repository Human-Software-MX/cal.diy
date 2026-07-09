import { z } from "zod";

export const ZAcceptInviteInputSchema = z.object({
  teamId: z.number().int().positive(),
});

export type TAcceptInviteInputSchema = z.infer<typeof ZAcceptInviteInputSchema>;
