import { prisma } from "@calcom/prisma";
import { TRPCError } from "@trpc/server";
import type { TrpcSessionUser } from "@calcom/trpc/server/types";
import type { TAcceptInviteInputSchema } from "./acceptInvite.schema";

type AcceptInviteOptions = {
  ctx: { user: NonNullable<TrpcSessionUser> };
  input: TAcceptInviteInputSchema;
};

export const acceptInviteHandler = async ({ ctx, input }: AcceptInviteOptions) => {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_teamId: {
        userId: ctx.user.id,
        teamId: input.teamId,
      },
    },
  });

  if (!membership) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Invitación no encontrada" });
  }

  if (membership.accepted) {
    return membership;
  }

  return prisma.membership.update({
    where: {
      userId_teamId: {
        userId: ctx.user.id,
        teamId: input.teamId,
      },
    },
    data: { accepted: true },
  });
};
