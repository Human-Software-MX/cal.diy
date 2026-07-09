import { prisma } from "@calcom/prisma";
import type { TrpcSessionUser } from "@calcom/trpc/server/types";
import { TRPCError } from "@trpc/server";

import type { TListMembersInputSchema } from "./listMembers.schema";

type ListMembersOptions = {
  ctx: { user: NonNullable<TrpcSessionUser> };
  input: TListMembersInputSchema;
};

// Lista los miembros de un equipo. Solo miembros del equipo pueden verlos.
export const listMembersHandler = async ({ ctx, input }: ListMembersOptions) => {
  const requester = await prisma.membership.findUnique({
    where: { userId_teamId: { userId: ctx.user.id, teamId: input.teamId } },
    select: { id: true },
  });
  if (!requester) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "No eres miembro de este equipo" });
  }

  const memberships = await prisma.membership.findMany({
    where: { teamId: input.teamId },
    select: {
      role: true,
      accepted: true,
      user: { select: { id: true, name: true, email: true, username: true, avatarUrl: true } },
    },
    orderBy: [{ role: "asc" }, { user: { name: "asc" } }],
  });

  return memberships.map((m) => ({
    userId: m.user.id,
    name: m.user.name,
    email: m.user.email,
    username: m.user.username,
    avatarUrl: m.user.avatarUrl,
    role: m.role,
    accepted: m.accepted,
  }));
};
