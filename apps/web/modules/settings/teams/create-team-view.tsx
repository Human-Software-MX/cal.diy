"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import SettingsHeader from "@calcom/features/settings/appDir/SettingsHeader";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import slugify from "@calcom/lib/slugify";
import { trpc } from "@calcom/trpc/react";
import { Button } from "@calcom/ui/components/button";
import { TextField, TextAreaField } from "@calcom/ui/components/form";
import { showToast } from "@calcom/ui/components/toast";

const CreateTeamView = () => {
  const { t } = useLocale();
  const router = useRouter();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [bio, setBio] = useState("");

  const createMutation = trpc.viewer.teams.create.useMutation({
    onSuccess: async (team) => {
      showToast(t("team_created_successfully"), "success");
      await utils.viewer.teams.list.invalidate();
      router.push(`/settings/teams/${team.id}/members`);
    },
    onError: (err) => {
      showToast(err.message, "error");
    },
  });

  const effectiveSlug = slugTouched ? slug : slugify(name);

  const handleSubmit = () => {
    if (!name.trim()) {
      showToast(t("team_name_required"), "error");
      return;
    }
    createMutation.mutate({ name: name.trim(), slug: effectiveSlug || undefined, bio: bio.trim() || undefined });
  };

  return (
    <SettingsHeader
      title={t("create_team")}
      description={t("create_your_team")}
      backButton
      onBackButtonClick={() => router.push("/settings/teams")}>
      <div className="border-subtle bg-default flex flex-col gap-4 rounded-md border p-6">
        <TextField
          label={t("team_name")}
          name="team-name"
          placeholder={t("your_team_name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextField
          label={t("team_url")}
          name="team-slug"
          addOnLeading="calendar.humansoftware.mx/team/"
          value={effectiveSlug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
        />
        <TextAreaField
          label={t("about")}
          name="team-bio"
          placeholder={t("team_description")}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button color="secondary" onClick={() => router.push("/settings/teams")}>
            {t("cancel")}
          </Button>
          <Button color="primary" loading={createMutation.isPending} onClick={handleSubmit}>
            {t("create_team")}
          </Button>
        </div>
      </div>
    </SettingsHeader>
  );
};

export default CreateTeamView;
