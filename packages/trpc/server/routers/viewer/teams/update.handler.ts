import { MembershipRepository } from "@calcom/features/membership/repositories/MembershipRepository";
import slugify from "@calcom/lib/slugify";
import { prisma } from "@calcom/prisma";
import type { TrpcSessionUser } from "@calcom/trpc/server/types";
import { TRPCError } from "@trpc/server";

import type { TUpdateTeamInputSchema } from "./update.schema";

type UpdateOptions = {
  ctx: { user: NonNullable<TrpcSessionUser> };
  input: TUpdateTeamInputSchema;
};

// Actualiza datos del equipo. Requiere ser ADMIN u OWNER del equipo.
export const updateHandler = async ({ ctx, input }: UpdateOptions) => {
  const membership = await MembershipRepository.getAdminOrOwnerMembership(ctx.user.id, input.teamId);
  if (!membership) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Solo los administradores del equipo pueden editar" });
  }

  const data: { name?: string; slug?: string; bio?: string } = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.bio !== undefined) data.bio = input.bio;

  if (input.slug !== undefined) {
    const newSlug = slugify(input.slug);
    if (!newSlug) throw new TRPCError({ code: "BAD_REQUEST", message: "URL de equipo inválida" });
    const clash = await prisma.team.findFirst({
      where: { slug: newSlug, parentId: null, id: { not: input.teamId } },
      select: { id: true },
    });
    if (clash) throw new TRPCError({ code: "CONFLICT", message: "Esa URL de equipo ya está en uso" });
    data.slug = newSlug;
  }

  const team = await prisma.team.update({
    where: { id: input.teamId },
    data,
    select: { id: true, name: true, slug: true, bio: true },
  });

  return team;
};
