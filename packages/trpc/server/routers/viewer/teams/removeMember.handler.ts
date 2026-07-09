import { MembershipRepository } from "@calcom/features/membership/repositories/MembershipRepository";
import { prisma } from "@calcom/prisma";
import { MembershipRole } from "@calcom/prisma/enums";
import type { TrpcSessionUser } from "@calcom/trpc/server/types";
import { TRPCError } from "@trpc/server";

import type { TRemoveMemberInputSchema } from "./removeMember.schema";

type RemoveMemberOptions = {
  ctx: { user: NonNullable<TrpcSessionUser> };
  input: TRemoveMemberInputSchema;
};

// Quita a un miembro del equipo. Requiere ADMIN/OWNER. Reglas de seguridad:
// no permite quitar al último OWNER (el equipo quedaría sin dueño).
export const removeMemberHandler = async ({ ctx, input }: RemoveMemberOptions) => {
  const requesterMembership = await MembershipRepository.getAdminOrOwnerMembership(ctx.user.id, input.teamId);
  if (!requesterMembership) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Solo los administradores pueden quitar miembros" });
  }

  const target = await prisma.membership.findUnique({
    where: { userId_teamId: { userId: input.userId, teamId: input.teamId } },
    select: { role: true },
  });
  if (!target) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Miembro no encontrado" });
  }

  if (target.role === MembershipRole.OWNER) {
    const ownerCount = await prisma.membership.count({
      where: { teamId: input.teamId, role: MembershipRole.OWNER },
    });
    if (ownerCount <= 1) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No puedes quitar al último dueño del equipo" });
    }
  }

  await prisma.membership.delete({
    where: { userId_teamId: { userId: input.userId, teamId: input.teamId } },
  });

  return { removed: true };
};
