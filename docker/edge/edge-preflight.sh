#!/usr/bin/env bash
# edge-preflight.sh: refuse to start the venue box when its deploy is unsafe.
#
# Installed as /usr/local/lib/etabella-edge/edge-preflight.sh (root:root 0755), beside preflight-check.js.
# Read docker/edge/README.md ("Preflight") for the why of each check.
#
#   edge-preflight.sh                  check only (an engineer at the console; set RT_EDGE_IMAGE first)
#   edge-preflight.sh <command> [args] check, then exec the command only when every check passed
#
# rt-edge.service runs it as its ExecStart, with `docker compose ... up` as the command. The preflight must be the
# unit's MAIN process: systemd tests RestartPreventExitStatus= against the main process's exit status only, so a
# refusal from an ExecStartPre= would be retried every RestartSec, forever.
#
# Exit codes (rt-edge.service: Restart=on-failure, RestartPreventExitStatus=78):
#   78  refused: a deploy problem a person must fix at the office; the unit fails and systemd does not retry
#   1   transient: Docker did not answer; systemd retries every 15 s
#   0   go (check only); with a command, the command's own exit status (compose up failing = retried)
#
# Environment (systemd sets RT_EDGE_IMAGE from the drop-in rt-edge.service.d/release.conf):
#   RT_EDGE_IMAGE        the released image reference (required)
#   ETABELLA_EDGE_LAB    1 on a lab box only: an unencrypted data directory and dev mode become warnings
#   EDGE_PREFLIGHT_ROOT  spec harness only (docker/edge/edge-deploy.spec.ts): a fake box root that prefixes every
#                        host path below, with stub commands on PATH. Never set on a box; logged when set.
set -euo pipefail

R=${EDGE_PREFLIGHT_ROOT:-}
COMPOSE_DIR=$R/opt/etabella-edge
CONFIG=$R/etc/etabella-edge/box-config.json
# Where the compose file mounts the config inside the container (its RT_EDGE_CONFIG). Relative config paths
# resolve against this directory, so preflight-check.js resolves them the same way.
CONTAINER_CONFIG_DIR=/etc/etabella-edge
DATA_DIR=$R/var/lib/etabella-edge
# The compose file mounts the data directory at the same path inside the container.
CONTAINER_DATA_DIR=/var/lib/etabella-edge
HOST_STATUS_DIR=$R/run/etabella-edge/host
CHECK_JS=$R/usr/local/lib/etabella-edge/preflight-check.js
DOCKER=$R/usr/bin/docker
# Sessions are refused below 10 GB free (spec §10 #3); the morning checklist wants 20 GB.
MIN_FREE_KB=$((10 * 1024 * 1024))

IMAGE=${RT_EDGE_IMAGE:-}
LAB=${ETABELLA_EDGE_LAB:-0}

problems=()
refuse() { problems+=("$1"); }
warn() { echo "edge-preflight: warning: $1" >&2; }
refuse_unless_lab() {
  if [ "$LAB" = "1" ]; then warn "$1 (allowed on a lab box)"; else refuse "$1"; fi
}

if [ -n "$R" ]; then warn "EDGE_PREFLIGHT_ROOT=$R: checking a fake box (spec harness only, never on a box)"; fi

# The data directory must sit on a dm-crypt (LUKS) device: findmnt gives the device under the path, and lsblk -s
# walks its parents (LVM -> crypt -> partition -> disk). lsblk fails on a source that is not a block device
# (tmpfs, overlay, a ZFS dataset), which counts as "not encrypted".
on_dm_crypt() {
  local src types
  src=$(findmnt -n -o SOURCE --target "$1" 2>/dev/null) || return 1
  src=${src%%\[*}   # btrfs prints /dev/mapper/x[/subvol]
  [ -n "$src" ] || return 1
  # Captured first: `lsblk | grep -q` under pipefail can fail with SIGPIPE after a match.
  types=$(lsblk -s -l -n -o TYPE "$src" 2>/dev/null) || return 1
  grep -qw crypt <<<"$types"
}

label() {
  "$DOCKER" image inspect --format "{{ index .Config.Labels \"$1\" }}" "$IMAGE" 2>/dev/null || true
}

# 1. No .env beside the compose file: compose reads one automatically, and the backend's env files can point at
#    the production database. The box config is JSON only.
for f in "$COMPOSE_DIR/.env" "$COMPOSE_DIR"/.env.*; do
  if [ -e "$f" ]; then refuse "$f exists: remove it (compose would read it; the box takes no .env files)"; fi
done
[ -f "$COMPOSE_DIR/docker-compose.yml" ] || refuse "$COMPOSE_DIR/docker-compose.yml is missing"

# 2. The box config: present, a .json file, not writable by other users.
if [ ! -f "$CONFIG" ]; then
  refuse "$CONFIG is missing (copy docker/edge/box-config.example.json and fill it in)"
else
  case "$(stat -c '%a' "$CONFIG")" in
    *[2367]) refuse "$CONFIG is writable by other users (want root:root 0640)" ;;
  esac
fi
[ -f "$CHECK_JS" ] || refuse "$CHECK_JS is missing (install docker/edge/preflight-check.js)"

# 3. The data directory: present, owned by root, private, on LUKS.
if [ ! -d "$DATA_DIR" ]; then
  refuse "$DATA_DIR is missing (install -d -m 0700 $DATA_DIR on the encrypted disk)"
else
  owner_mode=$(stat -c '%U %a' "$DATA_DIR")
  [ "$owner_mode" = "root 700" ] || warn "$DATA_DIR is '$owner_mode', want 'root 700'"
  on_dm_crypt "$DATA_DIR" || refuse_unless_lab "$DATA_DIR is not on a LUKS (dm-crypt) volume: pilot boxes encrypt every byte at rest (D2)"
  free_kb=$(df -Pk "$DATA_DIR" 2>/dev/null | awk 'NR==2 {print $4}' || true)
  if [ -n "$free_kb" ] && [ "$free_kb" -lt "$MIN_FREE_KB" ]; then
    warn "only $((free_kb / 1024)) MB free under $DATA_DIR: sessions will not arm below 10 GB"
  fi
fi

# 4. The host status directory the container mounts read-only (written by etabella-edge-hoststatus.service).
install -d -m 0755 "$HOST_STATUS_DIR"

# 5. The image: named, already loaded (a venue box never pulls), and Docker answering.
if ! "$DOCKER" info >/dev/null 2>&1; then
  echo "edge-preflight: Docker is not answering; will retry" >&2
  exit 1
fi
if [ -z "$IMAGE" ]; then
  refuse "RT_EDGE_IMAGE is not set (create /etc/systemd/system/rt-edge.service.d/release.conf from docker/edge/release.conf.example)"
elif ! "$DOCKER" image inspect "$IMAGE" >/dev/null 2>&1; then
  refuse "image $IMAGE is not loaded on this box (load the release at the office: docker load -i <tarball>)"
elif [ -f "$CONFIG" ] && [ -f "$CHECK_JS" ]; then
  # 6. In-image checks with the image's own node: node:sqlite, writable paths on the data mount, the FE bundle,
  #    and the config's release fields against the image labels (preflight-check.js).
  rc=0
  out=$("$DOCKER" run --rm --pull never --network none --read-only --cap-drop ALL \
    --security-opt no-new-privileges:true --entrypoint node \
    --volume "$CONFIG:/preflight/box-config.json:ro" \
    --volume "$CHECK_JS:/preflight/check.js:ro" \
    --env PREFLIGHT_CONFIG=/preflight/box-config.json \
    --env "PREFLIGHT_CONFIG_DIR=$CONTAINER_CONFIG_DIR" \
    --env "PREFLIGHT_DATA_MOUNT=$CONTAINER_DATA_DIR" \
    --env "PREFLIGHT_LAB=$LAB" \
    --env "LABEL_VERSION=$(label org.opencontainers.image.version)" \
    --env "LABEL_REVISION=$(label org.opencontainers.image.revision)" \
    --env "LABEL_FE_COMMIT=$(label com.etabella.fe-commit)" \
    "$IMAGE" --no-warnings /preflight/check.js 2>&1) || rc=$?
  if [ "$rc" -ne 0 ]; then
    refuse "the in-image check failed (exit $rc): $out"
  else
    while IFS= read -r line; do
      case "$line" in
        "REFUSE "*) refuse "${line#REFUSE }" ;;
        "WARN "*) warn "${line#WARN }" ;;
        "") ;;
        *) warn "$line" ;;
      esac
    done <<<"$out"
  fi
fi

# 7. Clock sanity (informative): a clock before the image was built blocks arming CaseView sessions (spec §3.4).
if [ -n "$IMAGE" ]; then
  created=$("$DOCKER" image inspect --format '{{.Created}}' "$IMAGE" 2>/dev/null || true)
  if [ -n "$created" ]; then
    created_s=$(date -d "$created" +%s 2>/dev/null || echo 0)
    if [ "$(date +%s)" -lt "$created_s" ]; then
      warn "the clock ($(date -u +%FT%TZ)) is earlier than the image build ($created): check chrony and the RTC"
    fi
  fi
fi

if [ "${#problems[@]}" -gt 0 ]; then
  for p in "${problems[@]}"; do echo "edge-preflight: REFUSED: $p" >&2; done
  echo "edge-preflight: the box will not start until these are fixed (docs/rt-edge/install.md, Troubleshooting)" >&2
  exit 78
fi
echo "edge-preflight: ok ($IMAGE)"
# 8. Start: replace this process with the command, so the unit's main-process status is the command's own.
if [ "$#" -gt 0 ]; then exec "$@"; fi
exit 0
