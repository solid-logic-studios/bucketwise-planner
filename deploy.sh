#!/usr/bin/env bash
set -euo pipefail

# Usage: TARGET_HOST=192.168.1.50 TARGET_DIR=/home/casaos/budget_app ./deploy.sh
# Defaults (overridable via env)
TARGET_HOST=${TARGET_HOST:-192.168.68.81}
TARGET_DIR=${TARGET_DIR:-/DATA/docker-images/budget_app}
SSH_USER=${SSH_USER:-paul}
SSH_OPTS=${SSH_OPTS:-}
RSYNC_EXCLUDES=(".git" "node_modules" "dist" ".turbo")

# Rsync code to CasaOS host
RSYNC_ARGS=("-avz" "--delete")
for ex in "${RSYNC_EXCLUDES[@]}"; do
  RSYNC_ARGS+=("--exclude" "$ex")
done
rsync ${RSYNC_OPTS:-} "${RSYNC_ARGS[@]}" ./ "${SSH_USER}@${TARGET_HOST}:${TARGET_DIR}"

# Build and start remotely
ssh ${SSH_OPTS:-} "${SSH_USER}@${TARGET_HOST}" \
  "set -euo pipefail; cd '${TARGET_DIR}'; docker compose -f docker-compose-local.yml build; docker compose -f docker-compose-local.yml up -d --remove-orphans"
