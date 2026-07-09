"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import SettingsHeader from "@calcom/features/settings/appDir/SettingsHeader";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { MembershipRole } from "@calcom/prisma/enums";
import { trpc } from "@calcom/trpc/react";
import { Avatar } from "@calcom/ui/components/avatar";
import { Badge } from "@calcom/ui/components/badge";
import { Button } from "@calcom/ui/components/button";
import { TextField, Select } from "@calcom/ui/components/form";
import { showToast } from "@calcom/ui/components/toast";

const TeamMembersView = ({ teamId }: { teamId: number }) => {
  const { t } = useLocale();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: team } = trpc.viewer.teams.get.useQuery({ teamId });
  const { data: members, isPending } = trpc.viewer.teams.listMembers.useQuery({ teamId });

  const canManage =
    team?.membership.role === MembershipRole.OWNER || team?.membership.role === MembershipRole.ADMIN;

  const [inviteValue, setInviteValue] = useState("");
  const [inviteRole, setInviteRole] = useState<MembershipRole>(MembershipRole.MEMBER);

  const inviteMutation = trpc.viewer.teams.inviteMember.useMutation({
    onSuccess: async () => {
      showToast(t("invitation_sent"), "success");
      setInviteValue("");
      await utils.viewer.teams.listMembers.invalidate({ teamId });
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const removeMutation = trpc.viewer.teams.removeMember.useMutation({
    onSuccess: async () => {
      showToast(t("member_removed"), "success");
      await utils.viewer.teams.listMembers.invalidate({ teamId });
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const roleOptions = [
    { value: MembershipRole.MEMBER, label: t("member") },
    { value: MembershipRole.ADMIN, label: t("admin") },
  ];

  return (
    <SettingsHeader
      title={team?.name ?? t("team_members")}
      description={t("team_members_description")}
      backButton
      onBackButtonClick={() => router.push("/settings/teams")}>
      {canManage && (
        <div className="border-subtle bg-default mb-6 flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <TextField
              label={t("invite_team_member")}
              name="invite"
              placeholder="correo@humansoftware.mx"
              value={inviteValue}
              onChange={(e) => setInviteValue(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              options={roleOptions}
              value={roleOptions.find((o) => o.value === inviteRole)}
              onChange={(opt) => opt && setInviteRole(opt.value)}
            />
          </div>
          <Button
            color="primary"
            loading={inviteMutation.isPending}
            onClick={() => {
              if (!inviteValue.trim()) return;
              inviteMutation.mutate({ teamId, usernameOrEmail: inviteValue.trim(), role: inviteRole });
            }}>
            {t("invite")}
          </Button>
        </div>
      )}

      <ul className="border-subtle divide-subtle bg-default divide-y rounded-md border">
        {!isPending &&
          members?.map((m) => (
            <li key={m.userId} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar size="sm" alt={m.name ?? m.email} imageSrc={m.avatarUrl ?? undefined} />
                <div>
                  <p className="text-emphasis font-medium">{m.name ?? m.email}</p>
                  <p className="text-subtle text-sm">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!m.accepted && <Badge variant="orange">{t("pending")}</Badge>}
                <Badge variant="gray">{t(m.role.toLowerCase())}</Badge>
                {canManage && m.role !== MembershipRole.OWNER && (
                  <Button
                    color="destructive"
                    variant="icon"
                    StartIcon="trash"
                    loading={removeMutation.isPending}
                    onClick={() => removeMutation.mutate({ teamId, userId: m.userId })}
                  />
                )}
              </div>
            </li>
          ))}
      </ul>
    </SettingsHeader>
  );
};

export default TeamMembersView;
