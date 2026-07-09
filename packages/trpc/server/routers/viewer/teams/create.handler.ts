import { MembershipRepository } from "@calcom/features/membership/repositories/MembershipRepository";
import slugify from "@calcom/lib/slugify";
import { prisma } from "@calcom/prisma";
import { MembershipRole } from "@calcom/prisma/enums";
import type { TrpcSessionUser } from "@calcom/trpc/server/types";
import { TRPCError } from "@trpc/server";

import type { TCreateTeamInputSchema } from "./create.schema";

type CreateOptions = {
  ctx: { user: NonNullable<TrpcSessionUser> };
  input: TCreateTeamInputSchema;
};

// Crea un equipo y hace al usuario actual OWNER (membresía aceptada).
// El slug se normaliza; si choca con otro equipo raíz, se rechaza con mensaje claro.
export const createHandler = async ({ ctx, input }: CreateOptions) => {
  const desiredSlug = slugify(input.slug?.length ? input.slug : input.name);

  if (!desiredSlug) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "URL de equipo inválida" });
  }

  // Unicidad de slug entre equipos sin organización padre (parentId null).
  const slugTaken = await prisma.team.findFirst({
    where: { slug: desiredSlug, parentId: null },
    select: { id: true },
  });
  if (slugTaken) {
    throw new TRPCError({ code: "CONFLICT", message: "Esa URL de equipo ya está en uso" });
  }

  const team = await prisma.team.create({
    data: {
      name: input.name,
      slug: desiredSlug,
      bio: input.bio,
    },
    select: { id: true, name: true, slug: true },
  });

  await MembershipRepository.create({
    teamId: team.id,
    userId: ctx.user.id,
    role: MembershipRole.OWNER,
    accepted: true,
  });

  return team;
};
