# Venue box deploy files (`docker/edge`)

Everything that turns a hardened Ubuntu mini-PC into an eTabella RT venue box: the compose file, the systemd unit,
the box config template, the CLI wrapper, the start-up preflight and the host config snippets.

| | |
|---|---|
| Authority | `docs/rt-local-edge-spec.md` rev 3 (FE repo) §3.4, §8.3, §11, §12; plan ledger D2, D6, D9, D23; design review DR7, DR14, DR15; build defaults O-1…O-19 |
| App | `apps/rt-edge` (`main.ts`, `ports/box-config.ts`, `ports/cli.port.ts`); box API `apps/rt-edge/CONTRACTS.md` |
| Release | `tools/ci/release-edge.js` and its `README.md` (scripted release from a git tag, D6) |
| Install | [`docs/rt-edge/install.md`](../../docs/rt-edge/install.md) |
| Hardening | [`docs/rt-edge/host-hardening.md`](../../docs/rt-edge/host-hardening.md) |
| Hearing day | [`docs/rt-edge/runbook.md`](../../docs/rt-edge/runbook.md) |
| Specs | `npx jest -c docker/edge/jest.config.js` (runs `edge-preflight.sh` and `etabella-edge` under bash against stub commands; on Windows it uses Git for Windows' `usr/bin/bash.exe`, or `EDGE_DEPLOY_BASH`) |

## Files and where they go on the box

| Repo file | Box path | Mode | What it is |
|---|---|---|---|
| `docker-compose.yml` | `/opt/etabella-edge/docker-compose.yml` | 0644 | The one `rt-edge` container |
| `README.md` | `/opt/etabella-edge/README.md` | 0644 | This file (the unit's `Documentation=`) |
| `rt-edge.service` | `/etc/systemd/system/rt-edge.service` | 0644 | Starts and stops the box |
| `release.conf.example` | `/etc/systemd/system/rt-edge.service.d/release.conf` | 0644 | Names the released image (`RT_EDGE_IMAGE`) |
| `box-config.example.json` | `/etc/etabella-edge/box-config.json` | 0640 | The box config (JSON only) |
| `edge-preflight.sh` | `/usr/local/lib/etabella-edge/edge-preflight.sh` | 0755 | The unit's `ExecStart`: checks, then execs `docker compose up` |
| `preflight-check.js` | `/usr/local/lib/etabella-edge/preflight-check.js` | 0644 | The in-image half of the preflight |
| `etabella-edge` | `/usr/local/sbin/etabella-edge` | 0755 | CLI wrapper (`enroll`, `status`, `recover`, `capture`, `cert install`) |
| `host/etabella-edge-hoststatus.sh` | `/usr/local/lib/etabella-edge/etabella-edge-hoststatus.sh` | 0755 | Publishes chrony and UPS state for the container |
| `host/etabella-edge-hoststatus.service` | `/etc/systemd/system/etabella-edge-hoststatus.service` | 0644 | Runs it every 10 s |
| `host/daemon.json` | `/etc/docker/daemon.json` | 0644 | `live-restore`, log caps, no Docker iptables |
| `host/docker-etabella-edge.conf` | `/etc/systemd/system/docker.service.d/etabella-edge.conf` | 0644 | dockerd waits for the data mount |
| `host/journald-etabella-edge.conf` | `/etc/systemd/journald.conf.d/50-etabella-edge.conf` | 0644 | `SystemMaxUse=500M` |
| `host/chrony-etabella-edge.conf` | `/etc/chrony/conf.d/etabella-edge.conf` | 0644 | Pinned NTS servers |
| `host/apt-20auto-upgrades` | `/etc/apt/apt.conf.d/20auto-upgrades` | 0644 | No automatic package changes |
| `host/needrestart-etabella-edge.conf` | `/etc/needrestart/conf.d/50-etabella-edge.conf` | 0644 | needrestart lists, never restarts |

Copy them from a Linux checkout or the release bundle. `.gitattributes` here forces LF, but a file edited on
Windows and copied by hand can still pick up CRLF, which breaks the scripts and unit files
(`sed -i 's/\r$//' <file>` fixes it).

Host directories:

| Path | Owner, mode | Holds |
|---|---|---|
| `/var/lib/etabella-edge/` | root, 0700, on the LUKS2 disk | `edge.sqlite` (+ `-wal`, `-shm`), `journal/<nSesid>/seg-*.ej`, `capture/`, `certs/` (`fullchain.pem`, `privkey.pem`), `device-key.pem` |
| `/etc/etabella-edge/` | root, 0750 | `box-config.json` |
| `/opt/etabella-edge/` | root, 0755 | `docker-compose.yml`, `README.md`; never a `.env` |
| `/run/etabella-edge/host/` | root, 0755, tmpfs | `chrony-tracking.csv`, `ups.txt` |

## The image

The box runs **exactly one image**: `etabella/rt-edge:<tag>`, built by `tools/ci/release-edge.js` from an annotated
git tag (D6). Nothing is built or pulled on a box (`pull_policy: never`); the image is loaded at the office.

How release-edge makes it (read its README for the refusals and the manifest):

1. `node scripts/build-all-apps.js rt-edge` bundles the app to `docker/microservices/apps/rt-edge/main.js`.
2. `docker build -f docker/microservices/service.Dockerfile --build-arg APP_NAME=rt-edge` gives
   `etabella/rt-edge-app:<tag>` on top of `monorepo-base:latest` (all production `node_modules`).
3. A generated layer copies the FE `edge` build of the Angular repo (D23) to **`/usr/src/app/fe-edge/`** and adds
   the labels below, giving `etabella/rt-edge:<tag>`.
4. `--push` tags it `$REGISTRY/rt-edge:<tag>` and records the registry digest in the manifest.

Image labels (the preflight compares the first three with the box config's `release` section):

| Label | Value | Box config |
|---|---|---|
| `org.opencontainers.image.version` | the tag, e.g. `rt-edge-v1.0.0` | `release.version` = its semver, `1.0.0` |
| `org.opencontainers.image.revision` | backend commit (40 hex) | `release.backendCommit` (7+ hex prefix) |
| `com.etabella.fe-commit` | FE commit | `release.feCommit` (7+ hex prefix) |
| `com.etabella.feed-parse-version` | `FEED_PARSE_VERSION` | (none; `rt-deploy-check` uses the manifest) |
| `com.etabella.deps-sha256` | hash of the tag's `package.json` + `package-lock.json` | (none; inherited from the base) |

What the image inherits from `docker/microservices/service.Dockerfile` (not edited for the box), and what
`docker-compose.yml` does about it:

| Inherited | Effect on the box | Compose |
|---|---|---|
| `WORKDIR /usr/src/app`, `CMD ["node", "/usr/src/app/main.js"]` | `main.js` with no command = serve | `RT_EDGE_CONFIG` names the config; the CLI wrapper runs `node /usr/src/app/main.js <command>` |
| `HEALTHCHECK … healthcheck.cjs` | Maps `APP_NAME` to a `PORT_*` variable and probes `/swagger-json` over HTTP. rt-edge has neither: it would always be unhealthy | Replaced: HTTPS `GET /edge/ping` on `127.0.0.1:443` |
| `ENV NODE_ENV=docker`, `NODE_OPTIONS=--unhandled-rejections=warn` | Harmless; rt-edge reads no dotenv file | Kept |
| No `USER` (root) | Needed to bind 443 on the host network | `cap_drop: ALL` + `NET_BIND_SERVICE`, `SYS_TIME`; `no-new-privileges`; read-only root |
| From `monorepo-base`: `node:20-bullseye-slim`, `TZ=Asia/Kolkata`, build toolchain | See the two notes below | `TZ` kept on purpose (same as realtime-server, spec §3.4) |

### Node runtime: a blocker to settle before the first box image

`apps/rt-edge` keeps its state in `node:sqlite` (StatePort) and so does `libs/rt-ingest`'s `SqliteCheckpointStore`.
`node:sqlite` needs **Node 22.13 or newer** (22.5–22.12 only behind `--experimental-sqlite`). The base image is
`node:20-bullseye-slim`, which has no `node:sqlite`, so an image built today cannot hold any state.
`edge-preflight.sh` refuses such an image ("the image runs Node v20… without a working node:sqlite") rather than let
the box crash-loop at a venue.

Spec §3.4 wants the box image on **the same base-image digest as realtime-server**, so Node, ICU and tzdata match.
The two ways out, for the backend owner to decide (not done here, `docker/microservices/*` is not part of this
change):

1. Move `monorepo-base` (all services, realtime-server included) to a Node 22 or 24 LTS image, rebuild it with the
   `com.etabella.deps-sha256` label (`tools/ci/release-edge/README.md`), and re-run the golden replay gate and the
   realtime-server suites under it. Keeps the "same base" rule. Recommended.
2. A separate base for rt-edge only. Breaks the "same base" rule, so the golden replay gate (D13) would have to run
   under both runtimes.

### Other image notes

- **FE location.** release-edge puts the edge bundle at `/usr/src/app/fe-edge/` (its `FE_IMAGE_DIR`). The box
  config parser's default `paths.publicDir` is `/app/public`, which does not exist in the image, so
  `box-config.example.json` sets `publicDir` explicitly and the preflight refuses an image with no `index.html`
  there. Aligning the two defaults is a one-line change in either `box-config.ts` or `components.js`.
- **Size and surface.** `monorepo-base` carries a compiler toolchain, Python, cairo, poppler and every service's
  dependencies (~700 MB). Acceptable for pilot boxes (D2: re-imaged at the office, no remote shell); a slim
  rt-edge-only runtime stage is a candidate for the Phase 5 full chain.
- **No dotenv.** The bundled `healthcheck.cjs` calls `dotenv` with `.env.docker`; it is not used on the box (the
  compose healthcheck replaces it), and no `.env*` file exists in the image or beside the compose file.
- **TPM.** Pilot boxes keep the device key as a file on the TPM-unlocked LUKS2 disk (`bTpmKey=false`, D2). The full
  chain (Phase 5) needs the TPM device in the container (`devices: [/dev/tpmrm0]`) for a TPM-resident key.

### Moving an image to a box

At the office, from the release machine:

```sh
docker save etabella/rt-edge:rt-edge-v1.0.0 | gzip > rt-edge-v1.0.0.tar.gz
sha256sum rt-edge-v1.0.0.tar.gz > rt-edge-v1.0.0.tar.gz.sha256
```

On the box (`docs/rt-edge/install.md` step 6):

```sh
sha256sum -c rt-edge-v1.0.0.tar.gz.sha256
gunzip -c rt-edge-v1.0.0.tar.gz | docker load
docker image inspect --format '{{.Id}}' etabella/rt-edge:rt-edge-v1.0.0   # = manifest components[rt-edge].imageId
```

Keep the current and the previous image on the box (rollback), remove older ones with `docker image rm`.

## The container (docker-compose.yml)

- **One container, host network.** 443/tcp for the room (HTTPS, Nest serves TLS itself, the certificate hot-reloads,
  no sidecar) and 2500/tcp for Eclipse in listen mode, bound by the app to `transmitter.bindAddress` on the CAT
  network. ufw decides who reaches which port; `ports:` has no meaning on the host network.
- **One data mount**, `/var/lib/etabella-edge` at the same path inside. The directory is mounted, not the SQLite
  file, because WAL keeps `edge.sqlite-wal` and `-shm` beside it. `create_host_path: false`: a missing encrypted
  volume stops the container instead of recording into an empty directory.
- **Config** from `RT_EDGE_CONFIG=/etc/etabella-edge/box-config.json`, mounted read-only. No `env_file`. The only
  other variable is `UV_THREADPOOL_SIZE=16` (not configuration: libuv's threadpool, default 4, serves both the
  journal's writes/fdatasyncs and every DNS `getaddrinfo`; with the WAN down a black-holed resolver must not hold the
  journal back). The box also resolves the cloud host through c-ares with a 3 s deadline for its own HTTPS calls.
- **Read-only root**, `/tmp` on tmpfs. Every path the box writes is under the data mount (the preflight checks).
- **Capabilities:** all dropped except `NET_BIND_SERVICE` (443) and `SYS_TIME` (the spec's cloud-time fallback:
  ops steps the clock from the cloud when chrony has been unsynced for over 1 h or is off by more than 60 s).
- **Stopping** takes up to 100 s (five shutdown steps of `shutdownTimeoutMs`, journal flush included);
  `stop_grace_period: 120s`, and the unit waits 150 s.
- **Restarts:** `restart: unless-stopped` covers crashes; `live-restore` keeps the container (and the CAT socket)
  through a dockerd restart, because `rt-edge.service` only `Wants=` docker.service (a `Requires=` would pass the
  docker restart on to the unit, whose `ExecStop` stops the container). A clean shutdown stops it, so only the
  unit starts it again, after the preflight.
- **Health:** `GET /edge/ping` over HTTPS on loopback. `unhealthy` = the room cannot load the box (no certificate yet,
  port taken, process stuck). Recording does not depend on it and nothing restarts on it.
- **Logs:** json-file 50 MB × 3 (and journald 500 MB on the host).

## The unit (rt-edge.service)

`Type=oneshot` + `RemainAfterExit`: `ExecStart` = `edge-preflight.sh /usr/bin/docker compose … up --detach`
(the preflight checks, then `exec`s compose), `ExecStop` = `docker compose stop` (never `down`). Ordered after
Docker, the data mount and `network-online.target` (the netplan interfaces are `optional`, so a missing cable never
hangs the boot), never after the internet.

- **Retries.** `Restart=on-failure` every 15 s for transient failures (exit 1: Docker not answering, or `compose
  up` failing). A preflight refusal (exit 78) is **not** retried: the unit shows `failed` with `status=78` and
  `journalctl -u rt-edge` lists every `REFUSED` line. This works only because the preflight is the unit's main
  process: systemd tests `RestartPreventExitStatus=` against the main process's status, never an `ExecStartPre=`
  one, so a refusing `ExecStartPre=` would loop every 15 s forever.
- **Docker is `Wants=` + `After=`, never `Requires=`/`BindsTo=`/`PartOf=`.** `Requires=` passes an explicit
  `systemctl restart docker` (or a docker-ce package restart) on to this unit, which would stop the container and
  drop the CAT socket. With `Wants=`, dockerd restarts alone and `live-restore` keeps the container running
  (spec §10 #16). `After=` still stops the box before dockerd at shutdown.

## Preflight (edge-preflight.sh + preflight-check.js)

Runs on every start, as the unit's main process, before it `exec`s `docker compose up`. Run it by hand with
`RT_EDGE_IMAGE=<image> /usr/local/lib/etabella-edge/edge-preflight.sh` (no command: check only). Exit 78 (refused,
not retried) when:

| Check | Why |
|---|---|
| `/opt/etabella-edge/.env` or `.env.*` exists | compose would read it; the backend's env files can point at the production database |
| `box-config.json` missing or writable by others | the only config input |
| `/var/lib/etabella-edge` missing, or not on dm-crypt | D2: every byte at rest is encrypted (lab override: `ETABELLA_EDGE_LAB=1`) |
| `RT_EDGE_IMAGE` unset, or the image not loaded | a venue box never pulls |
| the image's node has no working `node:sqlite` | the box could not keep state (see "Node runtime") |
| a writable path in the config resolves outside the data mount | it would fail on the read-only root |
| no `index.html` at `paths.publicDir` in the image | the room could not load the box page (lab override) |
| `mode: "dev"` or `http.tls: null` | HTTPS with HSTS is mandatory (spec §8.3; lab override) |
| `shutdownTimeoutMs` not an integer 1–20000 | the five shutdown steps plus a 20 s reserve must end inside `stop_grace_period: 120s`, or Docker kills the box mid-flush (the same rule and words as the app's config check, `box-config.ts`) |
| `release.version` / `backendCommit` / `feCommit` disagree with the image labels | D6: the box must report what it runs |

Warnings only: data directory not `root 700`, less than 10 GB free, `http.host`/`http.port` not what the
healthcheck probes, image without release labels, a clock earlier than the image build.

The in-image half runs in a throw-away container (`--network none --read-only --cap-drop ALL`) with the image's own
node, so it checks the runtime the box will really use.

## Host status for the container (etabella-edge-hoststatus)

The container cannot run `chronyc` or `upsc`. The host service writes their raw output every 10 s into
`/run/etabella-edge/host/` (`chrony-tracking.csv`, `ups.txt`; formats in the script's header), mounted read-only
at the same path. A missing file means "not measured" (`EdgeDeviceHealth` fields `null`). NUT's `upsd` also
listens on `127.0.0.1:3493`, which the container reaches directly over the host network. **Coordination item:** the
ops module (`apps/rt-edge/src/ops`) must read these files (or upsd) for `chronySynced`, `clockOffsetMs` and
`upsOnBattery`; until it does, those stay `null` and the clock check falls back to the cloud's time.

## CLI (etabella-edge)

`etabella-edge <command>` runs `node /usr/src/app/main.js <command>` in the running container (`docker compose
exec`), or in a one-off container with the same mounts when the box is stopped (`docker compose run --rm`).
`enroll` refuses while the box runs (stop it first, only with no live or unsealed session). Paths for
`recover --journal/--out` and `cert install --key/--chain` must be under `/var/lib/etabella-edge` (the only host
directory the container sees). `cert install` is the v1 way to give a box its LAN certificate (the cloud issuer is
Phase 3): docs/rt-edge/install.md step 11. Exit codes: rt-edge's `EDGE_EXIT` (0 ok, 1 failed, 64 usage, 70 software,
78 config) plus 75 (box running), 77 (not root), 78 (no image named).
