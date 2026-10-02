# Venue box: office install and enrolment

How a venue box is built, enrolled and accepted **at the office**, before it ever goes to a venue. Boxes are never
installed, updated or enrolled at a venue (D2: pilot boxes are re-imaged at the office from a tagged release).

| | |
|---|---|
| Authority | `docs/rt-local-edge-spec.md` rev 3 (FE repo) §3.4 install, §8.3 TLS/DNS, §11 enrolment, §12 runbook steps 1–2; plan D2, D6, D23; DR14 |
| Deploy files | [`docker/edge/`](../../docker/edge/README.md) |
| Hardening | [`host-hardening.md`](host-hardening.md) (do it first) |
| Hearing day | [`runbook.md`](runbook.md) |

**Security level.** v1 boxes are **pilot grade** (D2). The full chain (Secure Boot/UKI-bound disk encryption,
TPM-resident key, signed A/B updates) is a hard gate before any box goes to a venue we do not control or more than
3 boxes exist. See host-hardening.md.

## What you need

| Item | Notes |
|---|---|
| Box | Fanless N100-class mini-PC, 16 GB RAM, NVMe, TPM 2.0, two Ethernet ports (S-D1) |
| Kit router | GL.iNet / OpenWrt class, hearing Wi-Fi + CAT network + 4G/5G WAN (S-D2, S-D14) |
| UPS | USB-connected, NUT-supported; box and router both on it |
| Release | `dist/release/<tag>/manifest.json` and the image tarball `rt-edge-<tag>.tar.gz` (+ `.sha256`), from `tools/ci/release-edge.js` on a clean tag (D6). See "Node runtime" in `docker/edge/README.md`: an image on the current Node 20 base is refused by the preflight |
| Deploy files | `docker/edge/**` from a Linux checkout of the same backend tag (LF line endings) |
| People | A **super-admin** on etabella.net (Venue boxes: add, confirm the key, assign cases); the engineer at the console |
| Office vault | Per box: UEFI password, LUKS recovery passphrase, console admin password, router admin password |

## Steps

### 1. Hardware and OS

1. Record the box's asset label (e.g. `VB-014`); it becomes `box.label`.
2. Firmware and BIOS settings, then **Ubuntu Server 24.04 LTS minimal** with full-disk **LUKS2** and TPM
   auto-unlock: [`host-hardening.md`](host-hardening.md) sections A–D. Do not continue until the box reboots to a
   login prompt without a passphrase, and the recovery passphrase is in the vault.

### 2. Networks (netplan)

Two interfaces: the **hearing network** (to the kit router's LAN, internet through the router) and the **CAT
network** (the transmitter network: wired port or CAT-only SSID, VLAN-isolated, no internet). Static addresses that
match the router's DHCP reservations. Both `optional` + `ignore-carrier`, so a missing cable never delays the boot
and the CAT address exists before Eclipse plugs in (the listener binds to it).

`/etc/netplan/50-etabella-edge.yaml` (root 0600; adjust names and addresses), then `netplan apply`:

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    hearing0:
      match: { macaddress: "aa:bb:cc:00:00:01" }
      set-name: hearing0
      addresses: [192.168.10.2/24]
      routes: [{ to: default, via: 192.168.10.1 }]
      nameservers: { addresses: [192.168.10.1] }
      optional: true
      ignore-carrier: true
    cat0:
      match: { macaddress: "aa:bb:cc:00:00:02" }
      set-name: cat0
      addresses: [192.168.20.2/24]
      # no default route and no DNS: the CAT network has no internet
      accept-ra: false
      link-local: []
      optional: true
      ignore-carrier: true
```

The CAT address (`192.168.20.2`) and network (`192.168.20.0/24`) go into the box config (`transmitter.bindAddress`,
`transmitter.networkCidr`). Firewall: host-hardening.md section E.

### 3. Docker

1. Install Docker Engine and the compose plugin from Docker's apt repository (`docker-ce`, `docker-ce-cli`,
   `containerd.io`, `docker-compose-plugin`), at the versions pinned for this release. Then
   `apt-mark hold docker-ce docker-ce-cli containerd.io docker-compose-plugin`.
2. Host config (sources in `docker/edge/host/`):
   ```sh
   install -m 0644 docker/edge/host/daemon.json /etc/docker/daemon.json
   install -d /etc/systemd/system/docker.service.d
   install -m 0644 docker/edge/host/docker-etabella-edge.conf /etc/systemd/system/docker.service.d/etabella-edge.conf
   systemctl daemon-reload
   systemctl restart docker
   docker info --format '{{.LiveRestoreEnabled}} {{.LoggingDriver}}'   # true json-file
   ```

### 4. Box files

From the backend checkout at the release tag:

```sh
install -d -m 0755 /opt/etabella-edge /usr/local/lib/etabella-edge
install -d -m 0750 /etc/etabella-edge
install -d -m 0700 /var/lib/etabella-edge
install -m 0644 docker/edge/docker-compose.yml docker/edge/README.md /opt/etabella-edge/
install -m 0644 docker/edge/rt-edge.service /etc/systemd/system/rt-edge.service
install -m 0755 docker/edge/edge-preflight.sh /usr/local/lib/etabella-edge/edge-preflight.sh
install -m 0644 docker/edge/preflight-check.js /usr/local/lib/etabella-edge/preflight-check.js
install -m 0755 docker/edge/etabella-edge /usr/local/sbin/etabella-edge
install -m 0755 docker/edge/host/etabella-edge-hoststatus.sh /usr/local/lib/etabella-edge/
install -m 0644 docker/edge/host/etabella-edge-hoststatus.service /etc/systemd/system/
```

Never put a `.env` file in `/opt/etabella-edge` (compose would read it; the preflight refuses to start).

### 5. Box config

```sh
install -m 0640 docker/edge/box-config.example.json /etc/etabella-edge/box-config.json
```

Edit `/etc/etabella-edge/box-config.json` (field notes are in its `$comment`):

| Field | Value |
|---|---|
| `box.name` | Room name used in sentences ("Court 3") |
| `box.label` | The asset label on the case ("VB-014") |
| `box.venueLabel` | Login brand-panel line (default "Live transcript · <name>") |
| `box.roomWifiSsid` | The hearing SSID printed on the table card |
| `box.timeZone` | The venue's IANA zone (`Europe/London`) |
| `cloud.origin` | `https://etabella.net` (a staging origin only for a staging box) |
| `transmitter.bindAddress` / `networkCidr` | The box's CAT address and the CAT network from step 2 |
| `paths.*` | Leave as in the example (all under `/var/lib/etabella-edge`; `publicDir` `/usr/src/app/fe-edge`) |
| `release.version` | The tag's semver from the manifest (`rt-edge-v1.0.0` → `1.0.0`) |
| `release.backendCommit`, `release.feCommit` | `backendCommit` and `feCommit` from the manifest |
| `features` | Leave the v1 values |

The file holds no secret. The box identity is written by `enroll` (step 9), never typed here.

### 6. Load and verify the image

```sh
sha256sum -c rt-edge-v1.0.0.tar.gz.sha256
gunzip -c rt-edge-v1.0.0.tar.gz | docker load
docker image inspect --format '{{.Id}}' etabella/rt-edge:rt-edge-v1.0.0
docker image inspect --format '{{json .Config.Labels}}' etabella/rt-edge:rt-edge-v1.0.0
```

- The id must equal the manifest's `components[name=rt-edge].imageId`.
- The labels must match the manifest: `org.opencontainers.image.version` = `tag`,
  `org.opencontainers.image.revision` = `backendCommit`, `com.etabella.fe-commit` = `feCommit`,
  `com.etabella.feed-parse-version` = `FEED_PARSE_VERSION`.
- Pulled from the registry instead (`docker pull <registry>/rt-edge:<tag>`)? Check the repo digest against the
  manifest's `push.images[].repoDigest`.

### 7. Name the image for systemd

```sh
install -d /etc/systemd/system/rt-edge.service.d
install -m 0644 docker/edge/release.conf.example /etc/systemd/system/rt-edge.service.d/release.conf
# edit RT_EDGE_IMAGE to the exact reference loaded in step 6
systemctl daemon-reload
```

### 8. Host status service

```sh
systemctl enable --now etabella-edge-hoststatus.service
ls -l /run/etabella-edge/host/        # chrony-tracking.csv (and ups.txt once NUT is set up), refreshed every 10 s
```

### 9. Enrol (spec §3.4 install steps 1–2)

1. **Cloud (super-admin):** etabella.net → Venue boxes → **Add**. Enter the box name. It shows a one-time 128-bit
   enrolment code (and QR), valid **15 minutes**, tied to this box record and to you.
2. **Box console** (the box service is not running yet):
   ```sh
   etabella-edge enroll --cloud https://etabella.net --code <code>
   ```
   It generates the device key (`/var/lib/etabella-edge/device-key.pem`, 0600; pilot: a software key on the
   TPM-unlocked disk, enrolled with `bTpmKey=false`), sends the public key with the code, stores the identity as
   `pending-confirm`, and prints the **key fingerprint** (colon-separated hex). The code is single-use; a second
   attempt with it fails.

   | Exit | Meaning | Do |
   |---|---|---|
   | 0 | Enrolled, fingerprint printed | Step 10 |
   | 1 | Refused (code unknown, expired or used: `cloud_refused`) or no internet (`offline`) | New code in Venue boxes; check the hearing-network uplink |
   | 64 | Usage error | Check the command |
   | 70 | Internal error, or a command not in this build | Download the logs (`journalctl`, `docker logs`), call the backend owner |
   | 75 | The box service is running | `systemctl stop rt-edge`, retry |
   | 78 | Box config invalid (every problem listed), or no image named | Fix `/etc/etabella-edge/box-config.json` or `release.conf` |

   `--cloud` must match `cloud.origin` in the box config; the box refuses to talk to another cloud afterwards.

### 10. Confirm the key (super-admin)

In Venue boxes, compare the fingerprint shown for the box with the one the console printed, **character by
character**, then **Confirm**. The status goes from 'C' to 'A'. A mismatch is refused and alerted: do not confirm,
re-enrol (step 9) and investigate.

### 11. Start the box and install its LAN certificate

```sh
systemctl enable --now rt-edge.service
journalctl -u rt-edge -b --no-pager      # "edge-preflight: ok (...)" then compose up
docker logs -f rt-edge                   # Ctrl-C to stop following
```

The unit's `ExecStart` is the preflight, which starts compose only when every check passes. A refusal leaves
`rt-edge.service` **failed** with `status=78` and is not retried: `journalctl -u rt-edge` lists each `REFUSED`
line (see Troubleshooting); fix them, then `systemctl start rt-edge`. Exit 1 (Docker not answering) is retried
every 15 s.

**The LAN certificate is installed by hand in v1.** The room reaches the box only over HTTPS for
`<slug>.etabella-edge.net`. The cloud's certificate issuer (`edge/v1/cert`, ACME DNS-01) is **not in this build**: it
answers `501`, the box raises `CERTIFICATE_RENEWAL_FAILED` (P2; P1 under 7 days left), which also goes to the cloud,
at most once an hour, and keeps recording. Until a certificate is installed the container is `unhealthy` and the log
says the listener is waiting for a certificate (`CERTIFICATE_UNAVAILABLE`).

1. **At the office**, issue a certificate for `<slug>.etabella-edge.net` (the host `etabella-edge status` shows) from
   the office ACME account (DNS-01 on `etabella-edge.net`), with a **new key for this box only**: never the device key
   (`device-key.pem`), never a key shared with another box. You need the private key (unencrypted PEM) and the full
   chain (the box's certificate first, then the intermediates). Keep the key off shared drives and e-mail.
2. **On the box console**, copy both under `/var/lib/etabella-edge` (the only host directory the container sees),
   install, then delete the copies:
   ```sh
   install -d -m 0700 /var/lib/etabella-edge/incoming
   install -m 0600 privkey.pem fullchain.pem /var/lib/etabella-edge/incoming/
   etabella-edge cert install --key /var/lib/etabella-edge/incoming/privkey.pem --chain /var/lib/etabella-edge/incoming/fullchain.pem
   rm -f /var/lib/etabella-edge/incoming/privkey.pem /var/lib/etabella-edge/incoming/fullchain.pem
   ```
   The command checks the pair before it writes anything: the key loads and matches the certificate, the certificate
   names `<slug>.etabella-edge.net`, it is valid now, and the key is not the device key. It then installs it
   atomically into `certs/` (`privkey.pem` 0600, `fullchain.pem` 0644; a power cut in the middle is finished at the
   next start, never left half-installed) and prints the host, the fingerprint and the expiry. The running box binds
   HTTPS within `http.tls.reloadPollMs`: nothing needs a restart. It works the same while the box is stopped. The
   install takes the lock file `certs/.cert-install.lock`, which the running box's own installs take too, so the two
   never interleave; every attempt is in the box's audit (`cert-install`).

   | Exit | Meaning | Do |
   |---|---|---|
   | 0 | Installed | `etabella-edge status`: certificate `ok`, covers host `true`, days left more than 30 |
   | 1 | Refused, nothing changed: another host, expired or not yet valid, key does not match, encrypted key, the device key, a file not readable (not under `/var/lib/etabella-edge`), or the box not enrolled | Fix the pair (or enrol first, step 9) and run it again |
   | 1 | "another LAN certificate install is in progress", nothing changed: the box is installing or finishing one right now | Run it again in a minute (a lock left by a power cut is taken over after 60 s) |
   | 64 | Usage error (`--key` and `--chain` are both required) | Check the command |
3. **Renewal** is the same command with a new pair, before 30 days are left (the box alerts at 21 days, P2, and at 7
   days before a scheduled hearing, P1). Boxes are renewed at the office (or on site with the console).

```sh
etabella-edge status
docker inspect --format '{{.State.Health.Status}}' rt-edge   # healthy
```

`status` shows the identity (`active`), the slug, the cloud link, disk and the certificate (state `ok`, covers the
host, days left: must be more than 30 before shipping).

### 12. Assign cases (super-admin)

Venue boxes → the box → Cases: add the cases this box will serve (`RtEdgeCase`). The box pulls them on its next
hello ("Run checks again" in Box settings pulls at once). The box dashboard and every room sign-in are limited to
these cases (D22, DR19).

### 13. Kit router

Apply the router template and check it against host-hardening.md section N: hearing SSID with client isolation,
CAT network isolated, `dnsmasq` record `<slug>.etabella-edge.net → 192.168.10.2` (the hearing address), DHCP
reservations for both box addresses, WAN health check by HTTPS to etabella.net with 4G/5G failover. There is no
public DNS record for the slug (S-D2).

### 14. Table card (DR14)

One printed card per box, for every table in the room:

- QR 1, **"Join room Wi-Fi"**: `WIFI:T:WPA;S:<hearing SSID>;P:<hearing passphrase>;;`
- QR 2, **"Open the transcript"**: `https://<slug>.etabella-edge.net/`
- The address `<slug>.etabella-edge.net` in large type.

```sh
qrencode -o wifi.png 'WIFI:T:WPA;S:Court3-Transcript;P:<passphrase>;;'
qrencode -o transcript.png 'https://k7q2m9x4.etabella-edge.net/'
```

Generate on the office machine, not on the box. Never print the operator code, a room code or the CAT network
details on the card. Whether a third "etabella.net" fallback QR is added is open (O-16); the v1 card has two.

### 15. Acceptance tests (all must pass before the box ships)

| # | Test | Pass |
|---|---|---|
| 1 | `etabella-edge status` | identity `active`, cloud linked, certificate `ok` (installed with `cert install`, step 11), covers the host, > 30 days left, version = manifest |
| 2 | Laptop on the hearing Wi-Fi opens `https://<slug>.etabella-edge.net/` | Box login page, trusted certificate (the one from step 11), no warning; `/edge/ping` answers `"msg":1` with the box's `nEdgeid` |
| 3 | Sign in on the box link (email, password on etabella.net) as a case admin | Dashboard shows the box's cases; Box settings → Status & troubleshooting opens on "Ready for today" |
| 4 | Test feed: a throwaway session created in RT Production for this box (D27); a 2-minute Bridge capture replayed into box `:2500` from a laptop on the CAT network with the session login | Lines appear on the box page and on etabella.net; the operator chip shows "Synced"; LAN root = cloud root; end it, wait for "Venue upload complete", then delete the session |
| 5 | Reboot (`systemctl reboot`) | Comes back without a passphrase; `rt-edge` starts by itself; healthy within ~3 min |
| 6 | Pull the UPS mains plug until the low-battery shutdown | Host shuts down cleanly: `journalctl -b -1 -u rt-edge` shows the graceful stop, no SIGKILL |
| 7 | From a laptop on the CAT network: `curl -k --max-time 5 https://192.168.20.2/` | No connection (ufw drops it: 443 is hearing-network only) |
| 8 | From a laptop on the hearing network: `nc -vz -w 5 192.168.10.2 2500` | No connection (2500 is CAT-network only, and bound to the CAT address) |
| 9 | Unplug the router's WAN during the test feed | Room keeps reading; marking paused banner; after replugging, catch-up and "Synced" |
| 10 | `ufw status verbose`, `clevis luks list -d <dev>`, `systemctl is-enabled unattended-upgrades` | As host-hardening.md section O |
| 11 | During a test feed, `systemctl restart docker` (the dockerd package-update case, spec §10 #16) | `docker inspect --format '{{.State.StartedAt}}' rt-edge` unchanged; `systemctl is-active rt-edge` stays `active`; the transmitter never shows disconnected and lines keep arriving |
| 12 | `RT_EDGE_IMAGE=<image> /usr/local/lib/etabella-edge/edge-preflight.sh` | `edge-preflight: ok (<image>)`, exit 0 (check only: it starts nothing) |

Lines replayed in test 4 never come from a real hearing. Delete the test session afterwards.

### 16. Before shipping (spec §12 runbook step 2)

- Power the box on, online, **no more than 24 h before shipping**; certificate more than 30 days left.
- The image matches the **current** release manifest (`etabella-edge status`, version).
- No unsealed session on the box (`etabella-edge status`).
- The operator envelope for the venue: printed table cards, the "Show to reporter" note (the reporter's Eclipse
  password comes from RT Production, not the box, O-12). Only for a box with the operator code turned on (off in
  v1, DR23): the operator-code card left blank (DR7: it is issued on the hearing morning or the day before,
  runbook.md).
- The test-feed kit: the replay laptop with the bundled 2-minute Bridge capture. The test feed is required every
  hearing morning (runbook.md section 2, spec §12.3); acceptance test 4 does not replace it.

## Re-enrol or change the key

Any re-enrol or key change raises an alert and needs the same fingerprint confirmation (spec §3.4 step 4).

```sh
etabella-edge status                 # no live or unsealed session
systemctl stop rt-edge
etabella-edge enroll --cloud https://etabella.net --code <new code> --rekey
systemctl start rt-edge
```

Without `--rekey`, enrol refuses to overwrite an existing device key.

## Update a pilot box (re-image, D2, spec §12 runbook step 7)

No in-field updates. At the office only, and **never while the box holds an unsealed session**:

1. `etabella-edge status`: every session sealed (or the box has none).
2. `systemctl stop rt-edge`.
3. Load and verify the new image (step 6). OS package changes mean a full re-image (host-hardening.md).
4. Update `RT_EDGE_IMAGE` in `release.conf` and the config's `release` fields from the new manifest;
   `systemctl daemon-reload`.
5. `systemctl start rt-edge`; acceptance tests 1–4.
6. Keep the previous image for rollback, remove older ones. Rolling back to an image with a different
   `FEED_PARSE_VERSION` is never done while a session is unsealed (spec §10 #16).

Before any **cloud** deploy of realtime-server, run `tools/ci/rt-deploy-check.js` (its README): it refuses a parser
version that differs from any live box session.

## Replace or revoke a box (spec §12 runbook step 8)

- Revoke in Venue boxes: the device key dies at once, the live socket drops and the slug is retired. The LAN
  certificate was issued at the office in v1 (step 11): revoke it there, with the ACME account that issued it.
  Open sessions on a revoked box are split to direct cloud (runbook.md); re-binding them to another box is Phase 4.
- The spare is installed and enrolled here like a new box and gets its own slug, so new table cards.
- A dead box's disk opens only with its LUKS recovery passphrase (its TPM is in the dead box); see runbook.md,
  "A box that never comes back".

## Troubleshooting the install

| Symptom | Cause | Fix |
|---|---|---|
| `edge-preflight: REFUSED: … .env exists` | A `.env` in `/opt/etabella-edge` | Delete it; the box takes JSON config only |
| `REFUSED: … not on a LUKS (dm-crypt) volume` | Data directory on an unencrypted disk | Re-image with full-disk LUKS (host-hardening.md B) |
| `REFUSED: image … is not loaded` | `RT_EDGE_IMAGE` names an image not on the box | Step 6, or fix `release.conf` |
| `REFUSED: the image runs Node v20… without a working node:sqlite` | Release built on the Node 20 base | Rebuild the base on Node ≥ 22.13 (docker/edge/README.md, "Node runtime") and cut a new release |
| `REFUSED: no FE edge bundle at paths.publicDir` | `publicDir` not `/usr/src/app/fe-edge`, or a release made with `--allow-missing` | Fix the config, or use a full release |
| `REFUSED: release.… does not match the image` | Config `release` fields from another release | Copy them from this release's manifest |
| Container restarts, log ends with `box config … is invalid: …` (exit 78) | A config value the app refuses; every problem is listed | Fix the listed fields |
| Container `unhealthy`, log "not bound … waiting for a certificate" | No LAN certificate installed yet: in v1 the cloud issues none (`CERTIFICATE_RENEWAL_FAILED`, "501 NOT_IMPLEMENTED") | Install one with `cert install` (step 11); `etabella-edge status` shows the certificate state |
| `cert install` exit 1 "does not cover …" / "expired" / "does not match" | The pair is for another box, out of date, or the key and chain are from different issuances | Issue a pair for this box's host (step 11.1) |
| `enroll` exit 1 `cloud_refused` | Code expired (15 min), used, or for another box | New code |
| `etabella-edge: … exit 75` | Enrol while the box runs | Stop it first |
