#!/usr/bin/env bash
set -euo pipefail

SYM_HOME=/opt/symmetric-server
ENGINES_DIR=${SYM_HOME}/engines
UUID_FILE=${ENGINES_DIR}/node-id.txt

mkdir -p "${ENGINES_DIR}"

# ── 1) Determine LOCAL_ID ─────────────────────────────────────
if [[ -z "${LOCAL_ID:-}" ]]; then
  if [[ -f "${UUID_FILE}" ]]; then
    LOCAL_ID=$(<"${UUID_FILE}")
  else
    LOCAL_ID=$(uuidgen)
    echo "${LOCAL_ID}" > "${UUID_FILE}"
  fi
fi

ENGINE_NAME="local-${LOCAL_ID}"

# ── 2) Generate engine properties ────────────────────────────
cat > "${ENGINES_DIR}/${ENGINE_NAME}.properties" <<EOF
engine.name=${ENGINE_NAME}
group.id=local_group
external.id=${LOCAL_ID}

db.driver=org.postgresql.Driver
db.url=${DB_URL}
db.user=${DB_USER}
db.password=${DB_PASS}

http.port=${HTTP_PORT}
sync.url=http://host.docker.internal:${HTTP_PORT}/sync/${ENGINE_NAME}
registration.url=${REG_URL}

auto.registration=true
auto.reload=true
auto.create.sym.tables=true

start.route.job=true
start.push.job=true
start.pull.job=true
push.job.period.time.ms=10000
pull.job.period.time.ms=10000

trigger.update.capture.changed.data.only.enabled=true
dataloader.apply.changes.only=true
db.delimited.identifier.mode=true
db.metadata.ignore.case=true
dataloader.create.table.alter.to.match.db.case=true
log4j.logger.org.jumpmind.symmetric=INFO
EOF

# ── 3) Launch SymmetricDS ──────────────────────────────────────
exec "${SYM_HOME}/bin/sym" --engine "${ENGINE_NAME}"
