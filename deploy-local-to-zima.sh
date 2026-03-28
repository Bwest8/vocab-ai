#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="${IMAGE_NAME:-vocab-ai:local-deploy}"
REMOTE_IMAGE_NAME="${REMOTE_IMAGE_NAME:-vocabai-frontend-kpp21a:latest}"
REMOTE_HOST="${REMOTE_HOST:-zima-vocab}"
REMOTE_TMP_PATH="${REMOTE_TMP_PATH:-/tmp/vocab-ai-local-deploy.tar.gz}"
REMOTE_SERVICE_NAME="${REMOTE_SERVICE_NAME:-vocabai-frontend-kpp21a}"
ARCHIVE_PATH="${ARCHIVE_PATH:-/tmp/vocab-ai-local-deploy.tar.gz}"
SSH_OPTS="${SSH_OPTS:--o StrictHostKeyChecking=no}"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

log() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

require_cmd docker
require_cmd gzip
require_cmd scp
require_cmd ssh
require_cmd du

log "Building local image: $IMAGE_NAME"
docker build -t "$IMAGE_NAME" .

log "Saving compressed image archive to $ARCHIVE_PATH"
rm -f "$ARCHIVE_PATH"
docker save "$IMAGE_NAME" | gzip -1 > "$ARCHIVE_PATH"
du -sh "$ARCHIVE_PATH"

log "Copying archive to $REMOTE_HOST:$REMOTE_TMP_PATH"
scp $SSH_OPTS "$ARCHIVE_PATH" "$REMOTE_HOST:$REMOTE_TMP_PATH"

log "Loading image on remote host and updating service $REMOTE_SERVICE_NAME"
ssh $SSH_OPTS "$REMOTE_HOST" bash -lc "'
set -euo pipefail
docker load -i \"$REMOTE_TMP_PATH\"
docker tag \"$IMAGE_NAME\" \"$REMOTE_IMAGE_NAME\"
docker service update --image \"$REMOTE_IMAGE_NAME\" \"$REMOTE_SERVICE_NAME\"
docker service ps \"$REMOTE_SERVICE_NAME\"
'"

log "Deployment command completed. Check service logs if needed:"
printf '  ssh %s %q\n' "$REMOTE_HOST" "docker service logs --tail 100 $REMOTE_SERVICE_NAME"
