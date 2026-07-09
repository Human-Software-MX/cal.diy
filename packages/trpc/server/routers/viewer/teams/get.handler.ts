import { prisma } from "@calcom/prisma";
import type { TrpcSessionUser } from "@calcom/trpc/server/types";
import { TRPCError } from "@trpc/server";

import type { TGetTeamInputSchema } from "./get.schema";

type GetOptions = {
  ctx: { user: NonNullable<TrpcSessionUser> };
  input: TGetTeamInputSchema;
};

// Detalle de un equipo; solo accesible para miembros del equipo. Incluye el rol
// del usuario actual para que la UI decida qué acciones habilitar.
export const getHandler = async ({ ctx, input }: GetOptions) => {
  const membership = await prisma.membership.findUnique({
    where: { userId_teamId: { userId: ctx.user.id, teamId: input.teamId } },
    select: { role: true, accepted: true },
  });

  if (!membership) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Equipo no encontrado" });
  }

  const team = await prisma.team.findUnique({
    where: { id: input.teamId },
    select: { id: true, name: true, slug: true, bio: true, logoUrl: true },
  });

  if (!team) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Equipo no encontrado" });
  }

  return { ...team, membership: { role: membership.role, accepted: membership.accepted } };
};
