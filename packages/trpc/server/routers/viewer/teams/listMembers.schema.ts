import { z } from "zod";

export const ZListMembersInputSchema = z.object({
  teamId: z.number().int().positive(),
});

export type TListMembersInputSchema = z.infer<typeof ZListMembersInputSchema>;
