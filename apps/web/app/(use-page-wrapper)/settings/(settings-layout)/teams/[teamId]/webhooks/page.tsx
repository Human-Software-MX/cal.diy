import { _generateMetadata } from "app/_utils";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";

import { buildLegacyRequest } from "@lib/buildLegacyCtx";

import TeamWebhooksView from "~/settings/teams/team-webhooks-view";

export const generateMetadata = async () =>
  await _generateMetadata(
    () => "Webhooks del equipo",
    () => "Notificaciones para todos los miembros del equipo",
    undefined,
    undefined,
    "/settings/teams"
  );

const Page = async ({ params }: { params: Promise<{ teamId: string }> }) => {
  const session = await getServerSession({ req: buildLegacyRequest(await headers(), await cookies()) });
  if (!session) {
    redirect("/auth/login?callbackUrl=/settings/teams");
  }
  const { teamId } = await params;
  const parsedTeamId = Number(teamId);
  if (!Number.isInteger(parsedTeamId) || parsedTeamId <= 0) {
    redirect("/settings/teams");
  }
  return <TeamWebhooksView teamId={parsedTeamId} />;
};

export default Page;
