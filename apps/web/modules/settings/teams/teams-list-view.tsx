"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import SettingsHeader from "@calcom/features/settings/appDir/SettingsHeader";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Avatar } from "@calcom/ui/components/avatar";
import { Badge } from "@calcom/ui/components/badge";
import { Button } from "@calcom/ui/components/button";
import { EmptyScreen } from "@calcom/ui/components/empty-screen";

const TeamsListView = () => {
  const { t } = useLocale();
  const router = useRouter();
  const { data: teams, isPending } = trpc.viewer.teams.list.useQuery();

  return (
    <SettingsHeader
      title={t("teams")}
      description={t("create_manage_teams_collaborative")}
      CTA={
        <Button color="primary" href="/settings/teams/new" StartIcon="plus">
          {t("new")}
        </Button>
      }>
      {!isPending && (!teams || teams.length === 0) ? (
        <EmptyScreen
          Icon="users"
          headline={t("create_team_to_get_started")}
          description={t("create_manage_teams_collaborative")}
          buttonRaw={
            <Button color="secondary" href="/settings/teams/new" StartIcon="plus">
              {t("create_team")}
            </Button>
          }
        />
      ) : (
        <ul className="border-subtle divide-subtle bg-default divide-y rounded-md border">
          {teams?.map((team) => (
            <li key={team.id} className="flex items-center justify-between px-4 py-4">
              <Link
                href={`/settings/teams/${team.id}/members`}
                className="flex flex-1 items-center gap-3">
                <Avatar size="md" alt={team.name} imageSrc={team.logoUrl ?? undefined} />
                <div>
                  <p className="text-emphasis font-medium">{team.name}</p>
                  <p className="text-subtle text-sm">
                    {team.memberCount} {t("members").toLowerCase()}
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                {!team.accepted && <Badge variant="orange">{t("pending")}</Badge>}
                <Badge variant="gray">{t(team.role.toLowerCase())}</Badge>
                <Button
                  color="secondary"
                  onClick={() => router.push(`/settings/teams/${team.id}/members`)}>
                  {t("manage")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SettingsHeader>
  );
};

export default TeamsListView;
