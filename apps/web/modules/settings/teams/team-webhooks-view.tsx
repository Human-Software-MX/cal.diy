"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import SettingsHeader from "@calcom/features/settings/appDir/SettingsHeader";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { MembershipRole } from "@calcom/prisma/enums";
import { trpc } from "@calcom/trpc/react";
import { Badge } from "@calcom/ui/components/badge";
import { Button } from "@calcom/ui/components/button";
import { CheckboxField, TextField } from "@calcom/ui/components/form";
import { showToast } from "@calcom/ui/components/toast";

const BOOKING_EVENTS = [
  { value: "BOOKING_CREATED", label: "Booking creado" },
  { value: "BOOKING_RESCHEDULED", label: "Booking reagendado" },
  { value: "BOOKING_CANCELLED", label: "Booking cancelado" },
  { value: "MEETING_ENDED", label: "Reunión terminada" },
  { value: "MEETING_STARTED", label: "Reunión iniciada" },
] as const;

type TriggerEvent = (typeof BOOKING_EVENTS)[number]["value"];

const TeamWebhooksView = ({ teamId }: { teamId: number }) => {
  const { t } = useLocale();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: team } = trpc.viewer.teams.get.useQuery({ teamId });
  const { data: webhooks, isPending } = trpc.viewer.webhook.list.useQuery({ teamId });

  const canManage =
    team?.membership.role === MembershipRole.OWNER || team?.membership.role === MembershipRole.ADMIN;

  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<TriggerEvent[]>(["BOOKING_CREATED"]);
  const [showForm, setShowForm] = useState(false);

  const createMutation = trpc.viewer.webhook.create.useMutation({
    onSuccess: async () => {
      showToast("Webhook creado", "success");
      setUrl("");
      setSecret("");
      setSelectedEvents(["BOOKING_CREATED"]);
      setShowForm(false);
      await utils.viewer.webhooks.list.invalidate({ teamId });
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const deleteMutation = trpc.viewer.webhook.delete.useMutation({
    onSuccess: async () => {
      showToast("Webhook eliminado", "success");
      await utils.viewer.webhooks.list.invalidate({ teamId });
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const toggleEvent = (event: TriggerEvent) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  return (
    <SettingsHeader
      title={`Webhooks — ${team?.name ?? ""}`}
      description="Los webhooks de equipo se disparan para cualquier miembro, independientemente de quién configuró la integración."
      backButton
      onBackButtonClick={() => router.push(`/settings/teams/${teamId}/members`)}
      CTA={
        canManage ? (
          <Button color="primary" StartIcon="plus" onClick={() => setShowForm((v) => !v)}>
            Nuevo webhook
          </Button>
        ) : undefined
      }>
      {canManage && showForm && (
        <div className="border-subtle bg-default mb-6 flex flex-col gap-4 rounded-md border p-4">
          <TextField
            label="URL del endpoint"
            name="url"
            placeholder="https://agoracore.humansoftware.mx/webhooks/calcom"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <TextField
            label="Secret (opcional)"
            name="secret"
            placeholder="clave secreta para validar el payload"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
          <div>
            <p className="text-default mb-2 text-sm font-medium">Eventos a escuchar</p>
            <div className="flex flex-wrap gap-3">
              {BOOKING_EVENTS.map((ev) => (
                <CheckboxField
                  key={ev.value}
                  id={ev.value}
                  label={ev.label}
                  checked={selectedEvents.includes(ev.value)}
                  onChange={() => toggleEvent(ev.value)}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              color="primary"
              loading={createMutation.isPending}
              disabled={!url || selectedEvents.length === 0}
              onClick={() =>
                createMutation.mutate({
                  subscriberUrl: url,
                  eventTriggers: selectedEvents,
                  active: true,
                  payloadTemplate: null,
                  secret: secret || null,
                  teamId,
                })
              }>
              Crear webhook
            </Button>
            <Button color="secondary" onClick={() => setShowForm(false)}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}

      {!isPending && webhooks?.length === 0 ? (
        <div className="border-subtle bg-default rounded-md border p-8 text-center">
          <p className="text-subtle text-sm">No hay webhooks configurados para este equipo.</p>
          {canManage && (
            <Button color="secondary" className="mt-3" onClick={() => setShowForm(true)}>
              Crear el primero
            </Button>
          )}
        </div>
      ) : (
        <ul className="border-subtle divide-subtle bg-default divide-y rounded-md border">
          {webhooks?.map((wh) => (
            <li key={wh.id} className="flex items-start justify-between px-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-emphasis truncate font-medium">{wh.subscriberUrl}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {wh.eventTriggers.map((ev) => (
                    <Badge key={ev} variant="gray">
                      {ev}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="ml-4 flex items-center gap-2">
                <Badge variant={wh.active ? "green" : "gray"}>{wh.active ? "Activo" : "Inactivo"}</Badge>
                {canManage && (
                  <Button
                    color="destructive"
                    variant="icon"
                    StartIcon="trash"
                    loading={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate({ id: wh.id, teamId })}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SettingsHeader>
  );
};

export default TeamWebhooksView;
