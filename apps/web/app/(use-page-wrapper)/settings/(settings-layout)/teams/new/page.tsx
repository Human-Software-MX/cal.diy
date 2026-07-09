import { _generateMetadata } from "app/_utils";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";

import { buildLegacyRequest } from "@lib/buildLegacyCtx";

import CreateTeamView from "~/settings/teams/create-team-view";

export const generateMetadata = async () =>
  await _generateMetadata(
    (t) => t("create_team"),
    (t) => t("create_your_team"),
    undefined,
    undefined,
    "/settings/teams/new"
  );

const Page = async () => {
  const session = await getServerSession({ req: buildLegacyRequest(await headers(), await cookies()) });
  if (!session) {
    redirect("/auth/login?callbackUrl=/settings/teams/new");
  }
  return <CreateTeamView />;
};

export default Page;
