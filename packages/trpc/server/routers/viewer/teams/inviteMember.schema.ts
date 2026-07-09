import { z } from "zod";

import { MembershipRole } from "@calcom/prisma/enums";

export const ZInviteMemberInputSchema = z.object({
  teamId: z.number().int().positive(),
  usernameOrEmail: z.string().trim().min(1),
  role: z.nativeEnum(MembershipRole).default(MembershipRole.MEMBER),
});

export type TInviteMemberInputSchema = z.infer<typeof ZInviteMemberInputSchema>;
