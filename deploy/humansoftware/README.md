# Deploy de cal.diy — Humansoftware

Fork de [cal.diy](https://github.com/Human-Software-MX/cal.diy) (MIT) para agendamiento integrado con AGORA. Tracking: **TSK-45** en agoracore.

## Entornos

| Entorno | Dónde | URL |
|---------|-------|-----|
| Dev | VM GCP `agora` (35.188.238.30, us-east4-a), repo en `~/cal.diy` | Web: http://35.188.238.30:3050 · API v2: http://35.188.238.30:3053/api/v2 |
| Local (Mac) | `~/cal.diy` con `docker-compose.yml` raíz | http://localhost:3000 |

## Easypanel (deploy oficial, 2026-07-06)

cal.diy corre como servicios del proyecto **`agora`** en el panel de Easypanel de la VM (no fue posible un proyecto propio: la licencia limita a 3 proyectos):

| Servicio | Tipo | Detalle |
|----------|------|---------|
| `caldiy-web` | app | source git → `Dockerfile` raíz, puerto host 3050→3000 |
| `caldiy-api` | app | source git → `apps/api/v2/Dockerfile`, puerto host 3053→80 |
| `caldiy-db` | postgres:17 | db `calendso`, user `postgres` |
| `caldiy-redis` | redis:alpine | password generado por el panel (`redis://default:<pw>@agora_caldiy-redis:6379`) |

Para re-deployar: botón Deploy en el panel (clona `main` de GitHub y reconstruye). Gotchas aprendidos:
- El source **github** (tarball) falla con este repo por tamaño — usar source **git** (clone).
- `updateSourceGit` vía API **resetea el build config** — re-aplicar el Dockerfile después.
- `zeroDowntime` debe ir en `false`: con puertos en modo host la tarea nueva nunca puede tomar el puerto (deadlock en Pending).
- La API v2 exige `STRIPE_API_KEY`/`STRIPE_WEBHOOK_SECRET` (placeholders) y `REDIS_URL` con el password del panel.

## Stack compose manual (alternativa/fallback, detenido)

```bash
cd ~/cal.diy
# Build (tarda 30-60 min):
docker compose -f deploy/humansoftware/docker-compose.vm.yml --env-file deploy/humansoftware/.env build caldiy-web
# Levantar web + db + redis:
docker compose -f deploy/humansoftware/docker-compose.vm.yml --env-file deploy/humansoftware/.env up -d caldiy-db caldiy-redis caldiy-web
# API v2 (perfil aparte):
docker compose -f deploy/humansoftware/docker-compose.vm.yml --env-file deploy/humansoftware/.env --profile api up -d caldiy-api
```

- El `start.sh` de la imagen corre `prisma migrate deploy` y el seed del app store automáticamente al arrancar.
- Secretos en `deploy/humansoftware/.env` (NO se commitea; template en `.env.example` de este directorio).
- Puertos: firewall GCP `allow-caldiy-dev` (tcp:3050,3053).
- Los contenedores usan red/volúmenes propios (`caldiy*`) — no tocan los servicios de Easypanel/AGORA.

## Integración con AGORA

**Fase 1 (Humansoftware):** webhooks de cal.diy → AGORA.
1. En cal.diy: Settings → Developer → Webhooks → apuntar a `https://agoracore.humansoftware.mx/webhooks/calcom` con eventos `BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`.
2. En AGORA (repo `~/AGORA`, branch `agoracore`): falta el receiver `post 'webhooks/calcom'` + `Calcom::ProcessBookingService` (gemelo de `Meetings::IngestionService`). Ver CONTEXT.md de `~/proyectos/calcom-agora-integration/`.

**Fase 2 (CEA):** AGORA consume slots/bookings vía API v2 (`caldiy-api`, puerto 3053) con API key generada en cal.diy (prefijo `cal_`). El ciudadano nunca ve cal.diy.

## Auditoría rápida del fork (2026-07-06)

| Feature | Estado en el fork |
|---------|-------------------|
| Webhooks (BOOKING_*) | SÍ — schema, `packages/features/webhooks` y router tRPC `viewer/webhook` completos |
| Seats (`seatsPerTimeSlot`) | SÍ — schema + `packages/features/bookings/lib/handleSeats/` completo (crítico CEA: presente) |
| Teams (COLLECTIVE / ROUND_ROBIN / MANAGED) | PARCIAL — enum en schema y motor `getLuckyUser.ts` sobreviven, pero NO hay router tRPC de teams ni UI (sin rutas de settings ni módulos web). Re-implementar capa API/UI desde cero |
| Routing forms | NO — solo quedan migraciones de DB, el código de app fue removido |
| `packages/features/ee` | NO existe (removido) — algunas referencias en CLAUDE.md del repo están obsoletas |
| API v2 | SÍ — `apps/api/v2` con Dockerfile propio |

**REGLA DURA de licencias:** al re-implementar features faltantes NO copiar código del repo viejo de cal.com (AGPL) ni de directorios `/ee/` (comercial). Re-implementar desde cero; inspirarse en comportamiento/UX está bien.
