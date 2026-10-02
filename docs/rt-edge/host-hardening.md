# Venue box host hardening

The checklist for the box host (Ubuntu Server 24.04 LTS minimal) and its kit router. Done at the office, on every
box, before [`install.md`](install.md) step 3. Tick every line; section O is the audit that proves it.

| | |
|---|---|
| Authority | `docs/rt-local-edge-spec.md` rev 3 (FE repo) §3.4 host hardening + kit router, §10 #3 #8 #16, §11 security model; plan D2 |
| Config snippets | `docker/edge/host/` |

## Two levels (D2)

v1 boxes are **pilot grade**. The **full chain** is a hard gate before any box goes to a venue we do not control,
or before more than 3 boxes exist (Phase 5).

| | Pilot grade (v1, this checklist) | Full chain (deferred, Phase 5 gate) |
|---|---|---|
| Disk and boot | LUKS2 with TPM auto-unlock (clevis), **no** Secure Boot/UKI chain; UEFI password; USB boot off; Thunderbolt DMA off; no console autologin | LUKS2 bound to TPM2 PCRs 7 and 11, signed UKI, Secure Boot; UEFI password; USB boot and Thunderbolt DMA off; no console login |
| Device key | Software key on the TPM-unlocked disk, enrolled `bTpmKey=false` | ECDSA P-256 generated inside the TPM, non-exportable, signing through `tpm2-tools` (`bTpmKey=true`) |
| Updates | Manual re-image at the office from a tagged release (D6), never with an unsealed session | Signed A/B updates with rollback (parser-version rule) and the update gate (spec §12.7) |

**What a stolen pilot box holds** (spec §11): its device key, its TLS key (its own opaque name only), the scrypt
hashes of its sessions' Eclipse logins, edge tokens seen in transit (its own cases, ≤ 12 h, never renewable past
24 h after sign-in), at most 24 h of its own cases' journals and transcripts after completion, held captures,
room-code hashes and today's operator-code hash. Never: passwords, password verifiers, full cloud tokens,
`JWT_SECRET`, `EDGE_TOKEN_KEY`, database credentials or any `.env` file. Pilot boxes are less theft-resistant
than the full chain; that is the accepted cost of D2.

## A. Firmware (UEFI)

- [ ] Latest vendor firmware, flashed at the office. Record the version.
- [ ] **UEFI administrator password** set (unique per box, office vault).
- [ ] **USB boot off**; network/PXE boot off; boot order = internal NVMe only; boot menu hotkey disabled where the
      firmware allows it.
- [ ] **Thunderbolt / USB4 DMA off**, or pre-boot DMA protection ("Kernel DMA protection") on.
- [ ] **TPM 2.0 on** (firmware TPM or discrete), cleared once before the OS install.
- [ ] Secure Boot: pilot boxes do not depend on it (no UKI chain). Leave the vendor default; record it.
- [ ] Wake-on-LAN off. "Restore on AC power loss" = **Power on** (the box comes back by itself after an outage).
- [ ] Tamper-evident seal over a case screw; asset label = `box.label`.

## B. Disk encryption (LUKS2 + TPM auto-unlock)

- [ ] Ubuntu Server 24.04 LTS, **minimal** install, "Use an entire disk" with **LVM + encryption (LUKS2)**: every
      file system except `/boot` and the EFI partition is encrypted, including `/var/lib/etabella-edge` and
      `/var/lib/docker`, and swap.
- [ ] The installer passphrase becomes the **recovery passphrase**: long and random, stored in the office vault
      per box. It is the only way to open the disk outside this box (e.g. to recover a dead box's journals).
- [ ] Bind the LUKS volume to the TPM without a PCR policy (pilot: no Secure Boot chain to measure):
      ```sh
      apt install clevis clevis-luks clevis-tpm2 clevis-initramfs
      lsblk -o NAME,TYPE,FSTYPE            # find the crypto_LUKS partition, e.g. /dev/nvme0n1p3
      clevis luks bind -d /dev/nvme0n1p3 tpm2 '{"pcr_bank":"sha256"}'
      update-initramfs -u -k all
      ```
- [ ] Reboot: the box reaches the login prompt **without** a passphrase.
- [ ] `clevis luks list -d /dev/nvme0n1p3` shows exactly one `tpm2` binding; `cryptsetup luksDump` shows exactly
      two key slots (recovery passphrase + clevis).
- [ ] TRIM: the box purges finished sessions with delete + `fstrim` (spec §10 #19). Add `discard` to the volume's
      options in `/etc/crypttab` and keep `fstrim.timer` enabled (`systemctl enable fstrim.timer`). Trade-off,
      accepted for pilot boxes: TRIM reveals which blocks are free, not their content.

## C. Device key and secrets

- [ ] The device key is `/var/lib/etabella-edge/device-key.pem` (P-256, mode 0600, root), generated at enrolment
      (install.md step 9). On a pilot box it is a software key protected by the
      TPM-unlocked LUKS volume, enrolled with `bTpmKey=false`.
- [ ] Never copy it off the box, never back it up, never put it in an image. A box with a suspected key leak is
      revoked in Venue boxes and re-enrolled with `--rekey` (alerted, confirmed again).
- [ ] The box's other secrets (room-code HMAC key, box-token signing key) live in `edge.sqlite`, created on first
      use; they die with a re-image.
- [ ] Nothing secret in `/etc/etabella-edge/box-config.json`; no `.env` anywhere on the box.

## D. Accounts and console

- [ ] One local admin account (unique password, office vault), in `sudo`. `passwd -l root`.
- [ ] **No console autologin** (no getty override). Lock the console after 5 minutes idle (`TMOUT=300` in
      `/etc/profile.d/tmout.sh`, readonly).
- [ ] **No SSH**: `openssh-server` not installed (or `systemctl mask ssh.service ssh.socket`). The box is managed at
      the office on its console; there is no remote shell in v1 (O-2: no `c.cmd`).
- [ ] `systemctl mask ctrl-alt-del.target` (a keyboard in the room cannot reboot the box mid-hearing).
- [ ] Disable what the box does not need: `cloud-init` (`touch /etc/cloud/cloud-init.disabled`), `snapd`
      (`apt purge snapd`: snaps refresh themselves), `ModemManager`, `multipathd`, `avahi-daemon`, `cups` if present.
- [ ] Sysctl hardening in `/etc/sysctl.d/60-etabella-edge.conf`:
      ```
      net.ipv4.ip_forward = 0
      net.ipv4.conf.all.accept_redirects = 0
      net.ipv4.conf.all.send_redirects = 0
      net.ipv4.conf.all.rp_filter = 1
      net.ipv6.conf.cat0.disable_ipv6 = 1
      kernel.kptr_restrict = 2
      kernel.dmesg_restrict = 1
      kernel.unprivileged_bpf_disabled = 1
      ```
      Docker's `iptables: false` (section H) means Docker does not switch forwarding back on.

## E. Firewall (ufw)

Inbound: 443 from the hearing network only; 2500 from the CAT network only; nothing else, no SSH. Outbound:
443/tcp (cloud, ACME is done by the cloud), DNS to the kit router, NTS/NTP to the pinned servers, and in dial mode
the transmitter on the CAT network only (D34).

Names and addresses as in install.md step 2 (hearing `hearing0` 192.168.10.2/24, router 192.168.10.1; CAT `cat0`
192.168.20.2/24):

```sh
ufw --force reset
ufw default deny incoming
ufw default deny outgoing
ufw default deny routed
# room browsers -> box HTTPS
ufw allow in on hearing0 from 192.168.10.0/24 to 192.168.10.2 port 443 proto tcp
# Eclipse "Connect to server" (listen mode) -> box :2500, CAT network only
ufw allow in on cat0 from 192.168.20.0/24 to 192.168.20.2 port 2500 proto tcp
# box -> etabella.net (uplink, PKCE token endpoints are called by browsers, certificate, reachability probe)
ufw allow out on hearing0 to any port 443 proto tcp
# DNS only to the kit router
ufw allow out on hearing0 to 192.168.10.1 port 53 proto udp
ufw allow out on hearing0 to 192.168.10.1 port 53 proto tcp
# NTS key exchange + NTP (chrony, pinned NTS servers)
ufw allow out on hearing0 to any port 4460 proto tcp
ufw allow out on hearing0 to any port 123 proto udp
# dial mode ("Wait for connection" in Eclipse): box -> transmitter, CAT network only
ufw allow out on cat0 to 192.168.20.0/24 proto tcp
ufw logging low
ufw enable
```

- The dial rule allows any TCP port inside the CAT network because the transmitter's address is set at runtime in
  Box settings (DR13). The CAT network is VLAN-isolated (S-D14) and the box refuses a transmitter outside
  `transmitter.networkCidr`. If the transmitter address is fixed and known at the office, narrow it to
  `to <ip> port <port>`.
- Static addresses: the box does not need DHCP. If a site insists on DHCP, add `ufw allow out on hearing0 to any
  port 67 proto udp`.
- Docker does not touch iptables on the box (`"iptables": false`) and the container publishes no ports, so ufw is
  the only filter.
- NUT `upsd` listens on 127.0.0.1 only (section J); loopback is allowed by ufw's defaults.

## F. Time

- [ ] `apt install chrony` (it replaces `systemd-timesyncd`).
- [ ] `install -m 0644 docker/edge/host/chrony-etabella-edge.conf /etc/chrony/conf.d/etabella-edge.conf`
- [ ] Comment out every `pool` and `server` line in `/etc/chrony/chrony.conf` (the pinned NTS servers are the only
      sources); `systemctl restart chrony`.
- [ ] `chronyc -N authdata` shows `NTS` for every source; `chronyc tracking` shows `Leap status : Normal` and a
      system time offset under 1 s.
- [ ] RTC in UTC (`timedatectl` "RTC in local TZ: no").
- What the box adds (spec §3.4, §10 #8): with chrony unsynced for more than 1 h, or the offset above 60 s, the box
  steps the clock from the cloud's `serverNowMs` (the container has `SYS_TIME` for this). A clock earlier than the
  image build date blocks arming CaseView sessions and raises a CRITICAL alert. Offset alerts at 5 s and 60 s.
- `nocerttimecheck 1` in the chrony snippet lets a box whose RTC battery died sync at all: NTS checks the servers'
  certificate dates, which a clock in the year 2000 would fail.

## G. Packages and updates

- [ ] `apt purge unattended-upgrades`, then
      `install -m 0644 docker/edge/host/apt-20auto-upgrades /etc/apt/apt.conf.d/20auto-upgrades` and
      `systemctl disable --now apt-daily.timer apt-daily-upgrade.timer`.
- [ ] `install -m 0644 docker/edge/host/needrestart-etabella-edge.conf /etc/needrestart/conf.d/50-etabella-edge.conf`
      (needrestart lists, never restarts).
- [ ] `apt-mark hold docker-ce docker-ce-cli containerd.io docker-compose-plugin`.
- [ ] Fully patched at imaging time; after that, OS packages change **only by re-imaging** at the office (pilot).
- [ ] `snapd` purged (section D): snaps update themselves.

## H. Docker

- [ ] `/etc/docker/daemon.json` from `docker/edge/host/daemon.json`:
      - `live-restore: true`: a dockerd restart (or package update) does not stop the container or drop the CAT
        socket (spec §10 #16). This holds only because `rt-edge.service` has `Wants=docker.service`, not
        `Requires=`/`BindsTo=`/`PartOf=`: those pass a docker restart on to the unit, whose `ExecStop` stops the
        container. Check: `systemctl show -p Requires,BindsTo,PartOf rt-edge` names no `docker.service`. Even so,
        never restart or update Docker during a hearing (packages are held, section G);
      - json-file logs capped at `max-size 50m`, `max-file 3` (spec §3.4);
      - `iptables: false`, `ip6tables: false`: the box uses the host network only, so Docker needs no firewall
        rules and cannot open any behind ufw's back;
      - `no-new-privileges: true` for every container.
- [ ] `/etc/systemd/system/docker.service.d/etabella-edge.conf` from `docker/edge/host/docker-etabella-edge.conf`:
      dockerd waits for the data mount.
- [ ] Image prune: keep the current and the rollback image only (`docker image ls`, `docker image rm <old>`); never
      `docker system prune -a` on a box that holds an unsealed session.
- [ ] The container itself (docker/edge/README.md): read-only root, all capabilities dropped except
      `NET_BIND_SERVICE` and `SYS_TIME`, `no-new-privileges`, one data mount, no `.env`.

## I. Logs

- [ ] `/etc/systemd/journald.conf.d/50-etabella-edge.conf` from `docker/edge/host/journald-etabella-edge.conf`
      (`SystemMaxUse=500M`, persistent); `systemctl restart systemd-journald`.
- [ ] No log shipping off the box; support gets logs through "Download diagnostics" (runbook.md).

## J. UPS (NUT)

The box and the kit router are both on the UPS. NUT shuts the box down cleanly on low battery, so the journal is
flushed (rt-edge's graceful stop) instead of cut.

- [ ] `apt install nut` (standalone mode).
- [ ] `/etc/nut/nut.conf`: `MODE=standalone`.
- [ ] `/etc/nut/ups.conf`:
      ```
      [ups]
        driver = usbhid-ups
        port = auto
        desc = "venue box UPS"
      ```
- [ ] `/etc/nut/upsd.conf`: `LISTEN 127.0.0.1 3493` (loopback only).
- [ ] `/etc/nut/upsd.users`: one `upsmon primary` user with a random password; `/etc/nut/upsmon.conf`:
      `MONITOR ups@localhost 1 upsmon <password> primary`, `SHUTDOWNCMD "/sbin/shutdown -h +0"`.
- [ ] `upsc ups@localhost ups.status` prints `OL`. Pull the mains plug: `OB`, and at low battery the host shuts
      down; `journalctl -b -1 -u rt-edge` shows a graceful stop (install.md acceptance test 6).
- [ ] `etabella-edge-hoststatus.service` enabled: `/run/etabella-edge/host/ups.txt` refreshes every 10 s. The box
      raises a P2 alert while the UPS is on battery (spec §12).

## K. Network interfaces

- [ ] Two interfaces (install.md step 2): hearing and CAT. Static addresses matching the router's DHCP reservations.
- [ ] Both `optional: true` and `ignore-carrier: true`: no boot delay without a cable, and the CAT address exists
      before Eclipse is plugged in.
- [ ] The CAT interface has no default route, no DNS, no IPv6 router advertisements and no link-local IPv6.
- [ ] Wi-Fi and Bluetooth disabled in firmware or blacklisted (`/etc/modprobe.d/`), unless the box uses Wi-Fi for
      the CAT network (not recommended: the wired port is preferred, S-D14).

## L. Physical

- [ ] Fanless box, vents clear, on the UPS; kept in a lockable rack or cable-locked at the venue.
- [ ] No keyboard or screen left attached at the venue.
- [ ] Tamper seal and asset label checked on return.

## M. Box service

- [ ] `rt-edge.service` and `etabella-edge-hoststatus.service` enabled (install.md steps 8 and 11).
- [ ] `systemctl is-enabled rt-edge` = `enabled`; boot test passed (install.md acceptance test 5).

## N. Kit router (a trust boundary, spec §3.4, §11)

The router controls DHCP, DNS and ARP for both networks, so it is hardened like the box.

- [ ] **Firmware pinned** to the release-tested version; updated only through the release process.
- [ ] **Admin UI only on the wired management port**; unique admin password per kit (office vault); remote and
      cloud management off; no UPnP.
- [ ] **Hearing SSID**: WPA2/WPA3 transition mode, a passphrase per kit (printed only on the table card's Wi-Fi QR),
      **client isolation on**. The box sits on the wired side and stays reachable from every client.
- [ ] **CAT network** (S-D14): the wired CAT port preferred; otherwise a CAT-only SSID with its own passphrase,
      never the hearing SSID. **VLAN-isolated**: no internet, no route to the hearing network, and only
      CAT → box:2500 (listen mode) and box → transmitter (dial mode, D34) allowed. Dial mode has no login, so this
      isolation is what keeps a stranger's feed out.
- [ ] **DNS**: `dnsmasq` answers `<slug>.etabella-edge.net` with the box's **hearing** address
      (`address=/<slug>.etabella-edge.net/192.168.10.2`), so the name resolves offline. **No public A record**
      for the slug (S-D2). Check that DNS rebind protection does not drop the local answer
      (`nslookup <slug>.etabella-edge.net 192.168.10.1` from a client).
- [ ] **DHCP reservations** for both box addresses (matching the box's static addresses).
- [ ] **WAN**: venue uplink plus 4G/5G failover. The WAN health check is an **HTTPS GET to etabella.net with
      certificate validation** (mwan3 track script, e.g. `curl -fsS --max-time 5 -o /dev/null https://etabella.net/`),
      so a captive portal or a TLS-intercepting proxy fails over to 4G/5G (spec §10 #2).
- [ ] The CAT laptop has **auto-join of other Wi-Fi turned off** (it must stay on the CAT network).

## O. Audit (record the output with the box's install record)

| Command | Expect |
|---|---|
| `lsblk -o NAME,TYPE,FSTYPE,MOUNTPOINTS` | `/`, `/var/lib/etabella-edge`, `/var/lib/docker` and swap under a `crypt` device |
| `clevis luks list -d <luks partition>` | one `tpm2` binding, no PCR policy (pilot) |
| `cryptsetup luksDump <luks partition>` | LUKS2, two key slots |
| `ufw status verbose` | default deny (incoming), deny (outgoing), deny (routed); exactly the rules of section E |
| `ss -tlnp` | TCP listeners: `0.0.0.0:443` and `192.168.20.2:2500` (node), `127.0.0.1:3493` (upsd); **no** `:22` |
| `ss -ulnp` | UDP: chronyd's command port `127.0.0.1:323` (and `[::1]:323`) only |
| `systemctl is-enabled unattended-upgrades apt-daily-upgrade.timer ssh.service` | not found / disabled / masked |
| `dpkg -l snapd openssh-server 2>/dev/null` | not installed |
| `docker info --format '{{.LiveRestoreEnabled}}'` | `true` |
| `systemctl show -p Wants,Requires,BindsTo,PartOf rt-edge` | `docker.service` under `Wants=` only (never `Requires=`, `BindsTo=` or `PartOf=`) |
| `docker inspect --format '{{.HostConfig.ReadonlyRootfs}} {{.HostConfig.CapAdd}} {{.HostConfig.NetworkMode}}' rt-edge` | `true [NET_BIND_SERVICE SYS_TIME] host` (order may vary) |
| `chronyc -N authdata` | NTS on every source |
| `upsc ups@localhost ups.status` | `OL` |
| `journalctl --disk-usage` | ≤ 500 MB |
| `stat -c '%U %a' /var/lib/etabella-edge /etc/etabella-edge/box-config.json` | `root 700`, `root 640` |
| `ls -a /opt/etabella-edge` | no `.env` |

## Deferred: the full chain (Phase 5, D2 gate)

Required before **any box goes to a venue we do not control, or more than 3 boxes exist**. Not built in v1:

1. **Secure Boot with our keys** and a **signed UKI** (kernel + initrd + command line in one signed EFI binary,
   `systemd-ukify`), so a changed boot chain does not boot.
2. **LUKS2 bound to TPM2 PCRs 7 and 11** (`systemd-cryptenroll --tpm2-device=auto --tpm2-pcrs=7+11`, with a signed
   PCR policy so kernel updates do not need re-binding): a changed boot chain, or the disk in another machine, does
   not unlock.
3. **TPM-resident device key**: ECDSA P-256 generated in the TPM, non-exportable, signing through `tpm2-tools`
   (`bTpmKey=true`); the container gets `/dev/tpmrm0`.
4. **Signed A/B updates** with rollback, cosign-verified images, and the update gate: never while a session is
   armed, receiving or draining, a window is open, or a session is scheduled within 12 h; a `FEED_PARSE_VERSION`
   bump refused while any session is unsealed; auto-rollback only to an image with the same `FEED_PARSE_VERSION`
   as every unsealed session; OS packages only through the gate (spec §10 #16, §12.7).
5. **No console login at all**; restricted, signed support commands (`c.cmd`) if O-2 lands them.
6. Cloud side (already in the design): a box connecting from a new egress ASN outside a scheduled hearing window
   is quarantined until an admin re-approves it.
