import { MembershipRepository } from "@calcom/features/membership/repositories/MembershipRepository";
import { WEBAPP_URL } from "@calcom/lib/constants";
import { serverConfig } from "@calcom/lib/serverConfig";
import { prisma } from "@calcom/prisma";
import { MembershipRole } from "@calcom/prisma/enums";
import type { TrpcSessionUser } from "@calcom/trpc/server/types";
import { TRPCError } from "@trpc/server";

import type { TInviteMemberInputSchema } from "./inviteMember.schema";

type InviteMemberOptions = {
  ctx: { user: NonNullable<TrpcSessionUser> };
  input: TInviteMemberInputSchema;
};

// Envía un correo de invitación simple (texto propio, sin plantillas de cal.com).
// Best-effort: si el correo falla, la membresía pendiente igual queda creada.
async function sendInviteEmail(to: string, teamName: string, inviterName: string) {
  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport(serverConfig.transport);
    const acceptUrl = `${WEBAPP_URL}/settings/teams`;
    await transporter.sendMail({
      from: serverConfig.from,
      to,
      subject: `Te invitaron al equipo "${teamName}"`,
      text:
        `${inviterName} te invitó a unirte al equipo "${teamName}".\n\n` +
        `Ingresa a tu cuenta y acepta la invitación aquí: ${acceptUrl}\n\n` +
        `Si no tienes cuenta, créala primero con este correo y la invitación aparecerá al iniciar sesión.`,
    });
  } catch (err) {
    console.error("[teams.inviteMember] no se pudo enviar el correo de invitación:", err);
  }
}

// Invita a un usuario existente (por email o username) a un equipo, con membresía
// pendiente de aceptación. Requiere ser ADMIN u OWNER del equipo.
export const inviteMemberHandler = async ({ ctx, input }: InviteMemberOptions) => {
  const membership = await MembershipRepository.getAdminOrOwnerMembership(ctx.user.id, input.teamId);
  if (!membership) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Solo los administradores pueden invitar" });
  }

  const identifier = input.usernameOrEmail.toLowerCase();
  const invitee = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: input.usernameOrEmail }],
    },
    select: { id: true, email: true, name: true },
  });

  if (!invitee) {
    throw new TRPCError({ code: "NOT_FOUND", message: "El invitado debe crear una cuenta con ese correo primero" });
  }

  const existing = await prisma.membership.findUnique({
    where: { userId_teamId: { userId: invitee.id, teamId: input.teamId } },
    select: { id: true },
  });
  if (existing) {
    throw new TRPCError({ code: "CONFLICT", message: "Ese usuario ya es miembro o tiene una invitación pendiente" });
  }

  await MembershipRepository.create({
    teamId: input.teamId,
    userId: invitee.id,
    role: input.role ?? MembershipRole.MEMBER,
    accepted: false,
  });

  const team = await prisma.team.findUnique({
    where: { id: input.teamId },
    select: { name: true },
  });

  await sendInviteEmail(invitee.email, team?.name ?? "equipo", ctx.user.name ?? ctx.user.email);

  return { invited: invitee.email };
};
