# Deploy de cal.diy — Humansoftware

Fork de [cal.diy](https://github.com/Human-Software-MX/cal.diy) (MIT) para agendamiento integrado con AGORA. Tracking: **TSK-45** en agoracore.

## Entornos

| Entorno | Dónde | URL |
|---------|-------|-----|
| Dev | VM GCP `agora` (35.188.238.30, us-east4-a), repo en `~/cal.diy` | Web: http://35.188.238.30:3050 · API v2: http://35.188.238.30:3053/api/v2 |
| Local (Mac) | `~/cal.diy` con `docker-compose.yml` raíz | http://localhost:3000 |

Regla de empresa: deploy SIEMPRE Docker (+ Easypanel). Este stack corre como compose independiente en la VM dev; la adopción al panel de Easypanel queda pendiente (requiere acceso al panel — el stack ya sigue el mismo patrón contenedor + traefik-ready).

## Stack en la VM dev

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
| Webhooks (BOOKING_*) | SÍ — schema, `packages/features/webhooks` completo |
| Teams (COLLECTIVE / ROUND_ROBIN / MANAGED) | SÍ — enum en schema, `getLuckyUser.ts` presente; falta validar UI end-to-end |
| Seats (`seatsPerTimeSlot`) | SÍ en schema — falta validar flujo de booking con capacidad |
| Routing forms | NO — solo quedan migraciones de DB, el código de app fue removido |
| `packages/features/ee` | NO existe (removido) — algunas referencias en CLAUDE.md del repo están obsoletas |
| API v2 | SÍ — `apps/api/v2` con Dockerfile propio |

**REGLA DURA de licencias:** al re-implementar features faltantes NO copiar código del repo viejo de cal.com (AGPL) ni de directorios `/ee/` (comercial). Re-implementar desde cero; inspirarse en comportamiento/UX está bien.
