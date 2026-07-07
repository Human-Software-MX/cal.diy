#!/bin/bash
# Levanta el stack cal.diy en la VM dev (correr desde la raíz del repo en la VM):
#   bash deploy/humansoftware/up.sh          -> db + redis + web
#   bash deploy/humansoftware/up.sh api      -> también API v2 (requiere build previo)
set -euo pipefail
cd "$(dirname "$0")/../.."

COMPOSE="docker compose -f deploy/humansoftware/docker-compose.vm.yml --env-file deploy/humansoftware/.env"

$COMPOSE up -d caldiy-db caldiy-redis caldiy-web
if [ "${1:-}" = "api" ]; then
  $COMPOSE --profile api up -d caldiy-api
fi

echo "Esperando a que la web responda (migraciones Prisma corren al arrancar)..."
for i in $(seq 1 60); do
  code=$(curl -sL -o /dev/null -w '%{http_code}' http://localhost:3050/auth/login || true)
  if [ "$code" = "200" ]; then echo "OK: http://35.188.238.30:3050 responde 200"; exit 0; fi
  sleep 10
done
echo "La web no respondió 200 tras 10 min; revisa: $COMPOSE logs caldiy-web | tail -50"
exit 1
