import { prisma } from "@calcom/prisma";
import type { TrpcSessionUser } from "@calcom/trpc/server/types";

type ListOptions = {
  ctx: { user: NonNullable<TrpcSessionUser> };
};

// Devuelve los equipos (no organizaciones) donde el usuario tiene membresía,
// con su rol y si la invitación ya fue aceptada.
export const listHandler = async ({ ctx }: ListOptions) => {
  const memberships = await prisma.membership.findMany({
    where: {
      userId: ctx.user.id,
      team: { isOrganization: false },
    },
    select: {
      role: true,
      accepted: true,
      team: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          bio: true,
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { team: { name: "asc" } },
  });

  return memberships.map((membership) => ({
    id: membership.team.id,
    name: membership.team.name,
    slug: membership.team.slug,
    logoUrl: membership.team.logoUrl,
    bio: membership.team.bio,
    role: membership.role,
    accepted: membership.accepted,
    memberCount: membership.team._count.members,
  }));
};
