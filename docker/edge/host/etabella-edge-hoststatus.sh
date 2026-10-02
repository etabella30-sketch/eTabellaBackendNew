#!/bin/sh
# etabella-edge-hoststatus.sh: publish the host's clock and UPS state for the rt-edge container.
#
# The container cannot run chronyc or upsc. This writes their raw output into /run/etabella-edge/host, which
# docker-compose.yml mounts read-only at the same path. Installed as
# /usr/local/lib/etabella-edge/etabella-edge-hoststatus.sh; run by etabella-edge-hoststatus.service (--loop).
#
# Files (each replaced atomically by rename; a file older than 60 s is stale; a missing file = not measured):
#   chrony-tracking.csv  one line of `chronyc -c tracking`: reference id, reference name, stratum, reference time,
#                        system time (s; POSITIVE = the system clock is SLOW of NTP time, so box minus reference
#                        = -value), last offset (s; positive = local clock was ahead), rms offset, frequency,
#                        residual frequency, skew, root delay, root dispersion, update interval, leap status
#                        ("Normal" when synchronised, "Not synchronised" otherwise)
#   ups.txt              `upsc <ups>` key: value lines; ups.status holds OL (on mains), OB (on battery), LB (low)
set -eu

DIR=${ETABELLA_EDGE_HOST_STATUS_DIR:-/run/etabella-edge/host}
UPS=${ETABELLA_EDGE_UPS:-ups@localhost}
INTERVAL=${ETABELLA_EDGE_HOST_STATUS_INTERVAL:-10}

umask 022

# publish <file> <command...>: write the command's stdout to <file> atomically, or remove <file> if it fails.
publish() {
  name=$1
  shift
  tmp="$DIR/.$name.tmp"
  if "$@" >"$tmp" 2>/dev/null; then
    mv -f "$tmp" "$DIR/$name"
  else
    rm -f "$tmp" "$DIR/$name"
  fi
}

publish_all() {
  mkdir -p "$DIR"
  if command -v chronyc >/dev/null 2>&1; then
    publish chrony-tracking.csv chronyc -c tracking
  else
    rm -f "$DIR/chrony-tracking.csv"
  fi
  if command -v upsc >/dev/null 2>&1; then
    publish ups.txt upsc "$UPS"
  else
    rm -f "$DIR/ups.txt"
  fi
}

if [ "${1:-}" = "--loop" ]; then
  while :; do
    publish_all
    sleep "$INTERVAL"
  done
fi
publish_all
