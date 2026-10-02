# Venue box runbook

What to do on a hearing day with a venue box, and when something goes wrong. Written for the people in the room
(box admins and operators), the hearing operator and the on-call super-admin.

| | |
|---|---|
| Authority | `docs/rt-local-edge-spec.md` rev 3 (FE repo) §4.2–§4.5, §5.1, §5.5, §8.4, §10, §12; plan D1, D7, D9, D25, D27, D28, D33, D34; design review DR6–DR16, DR23; build defaults O-3, O-4, O-5, O-9, O-10, O-12, O-14 |
| Box API and screen states | `apps/rt-edge/CONTRACTS.md` |
| Install, update, replace | [`install.md`](install.md) |
| Host | [`host-hardening.md`](host-hardening.md) |

> **v1 is email sign-in only (DR23, 2026-10-01).** Room codes (section 4) and the daily operator code (section 3)
> are built but **off** (`features.roomCodes` / `features.operatorCode` = false; their routes answer 404
> `feature_disabled`, CONTRACTS.md §3). With them off, offline access belongs only to devices that signed in with
> email this morning, and "Ready for today" has **seven** checks. Sections 3 and 4 apply only if a box has them
> turned on.

## 0. Who and where

| Role | Who | Can |
|---|---|---|
| **Box admin** | A case admin of at least one case assigned to the box, or a super-admin, signed in on the box; or, only when the operator code is turned on, anyone holding **today's operator code** (that day only) | Box settings: Status & troubleshooting, Transmitter, Room codes when turned on (O-11) |
| **Case admin** | Case admin of the hearing's case | Acknowledge warnings; issue room codes for that case's sessions when room codes are turned on |
| **Hearing operator** | The case admin named on the session in RT Production | Split to direct cloud, acknowledge warnings (D7) |
| **On-call super-admin** | The rota for hearing hours; receives the pager | Everything above, force close, orphan dismissal |
| **Reporter** | The court reporter on Eclipse 12 | Connects Eclipse to the box (or lets the box connect to Eclipse) |

Where to look:

- **Room chip** (everyone): Live in this room · Waiting for reporter · No new lines since HH:MM · Feed stopped ·
  Offline · marking paused · Session ended.
- **Operator chip** (box admins), three segments: device → box, transmitter → box, box → cloud. "Synced" only
  after the cloud confirms. Its popover, or the dashboard gear, opens **Box settings**.
- **Box settings → Status & troubleshooting**: "Ready for today" until the first session goes live, then the
  **verdict** (problems ranked worst first), tiles (transmitter, cloud, network, this box) and the **Connectivity
  Log**. "Download diagnostics" is here.
- **RT Production** on etabella.net: the session's lane chips, Split to direct cloud, Stop, Acknowledge, Publish.
  **Venue boxes**: last seen, version, certificate, cases. (Remote commands to a box, such as unlocking an Eclipse
  lockout or choosing a held connection, are not in v1: build default O-2.)
- **Pager**: P1 pages, P2 notifies (section 9).

Rules that never change:

- Sessions are **created in RT Production**, never on the box (D27). Create them **the day before**.
- The box never shows or stores a password. Passwords are typed on etabella.net only (D33).
- Never restart, unplug or re-image a box that holds a live or unsealed session unless this runbook says so.
- The reporter's Eclipse file is the authority for any reconciliation (D25).

## 1. The day before

1. **Create every session** for tomorrow in RT Production with **Feed path: Venue box: <name>** and a **hearing
   operator** (D27). Save the generated Eclipse password where the reporter will get it: it is shown **once**, and
   the box cannot show it (O-12).
2. Wait for **"Venue box ready"** on each session (the box received it). "Venue box has not received this session"
   means the box is offline or not assigned the case: fix that today. **Use direct cloud instead** is allowed only
   before the box has received any bytes for that session (O-8).
3. **Operator code** (DR7), **only if the box has it turned on** (off in v1, DR23): where the box is marked ready,
   RT Production shows **today's operator code** once. It is valid only for the box-local day it was issued, so a
   code shown the day before expires at midnight: issue it again on the hearing morning while the internet is up.
   Section 3.
4. Box power-on check at the office or venue: `etabella-edge status` / Venue boxes → certificate ≥ 14 days
   (the "Venue box ready" gate refuses less), version current.
5. **Test-feed session** for the morning test feed (section 2, required): create one more session for the box,
   named e.g. "Test feed <date>", with its own generated Eclipse login, so the box receives it while online
   (D27). It is thrown away after the test. Pack the replay laptop with the bundled 2-minute Bridge capture.

If the venue will be offline and a session was never created, the box cannot run that hearing. The reporter's
Eclipse file keeps every word; import it afterwards through RT Production (D27).

## 2. Hearing-day morning checklist (DR15)

**Set up, in this order:**

1. UPS on mains; box and kit router plugged into the UPS outlets.
2. Kit router on: hearing Wi-Fi up, WAN (venue or 4G/5G) up.
3. Box on: it unlocks its disk and starts by itself (about 2–3 minutes). Nothing to type.
4. Reporter's laptop on the **transmitter (CAT) network**: the CAT cable, or the CAT-only SSID. Never the hearing
   Wi-Fi. **Auto-join of other Wi-Fi off** on that laptop.
5. A box admin signs in on the box link (`https://<slug>.etabella-edge.net`): email, password on etabella.net.
   This needs the internet: if it is already down, only a box admin who signed in on this device in the last
   12 hours gets in (with the operator code turned on: "Operator? Use today's operator code").
6. Box settings → **Status & troubleshooting** opens on **"Ready for today"**. "N of 7 need attention" until all
   seven are ticked. **Run checks again** re-runs them (and pulls assignments when online).

**The seven checks** (an eighth, `operator-code-issued`, "Today's operator code issued", appears only when the
operator code is turned on; its fix-it is **Issue operator code** by an online case admin, section 3):

| # | Check (key) | Green when | If not green: fix-it |
|---|---|---|---|
| 1 | Box linked (`box-linked`) | The box has a confirmed cloud identity and reached the cloud today | **Run checks again**; check the router's WAN. Revoked or quarantined: **Download diagnostics** and call on-call (section 13) |
| 2 | Today's sessions on the box (`sessions-today`) | At least one session today | **Open RT Production**: create the session (D27) or check its feed path is this box; then Run checks again. Lawyers see "Session details aren't on this box yet · ask the operator", never a false "No hearings today" |
| 3 | Case team lists stored (`team-lists`) | Rosters for every box case synced today | **Run checks again** while online. Offline sign-in checks need these lists |
| 4 | Transmitter connected (`transmitter-connected`) | Connected (no session yet), live, or quiet | **Set up transmitter** (section 5) or ask the reporter to start Eclipse output |
| 5 | eTabella reachable (`etabella-reachable`) | The box reaches etabella.net | **Open network checks**: "Internet unavailable" (router WAN, 4G) vs "Can't reach eTabella" (DNS, captive portal, proxy) |
| 6 | Disk free (`disk-free`) | 20 GB or more | Under 20 GB: warn; under 10 GB sessions will not arm. **Download diagnostics**, call on-call. Never delete files by hand |
| 7 | Clock in sync (`clock-in-sync`) | chrony synced, offset under 1 s | **Run checks again** once the internet is up (NTS needs it). Over 60 s off, or unsynced for over 1 h, the box steps its clock from the cloud. A clock earlier than the image build blocks CaseView sessions |

**Also check (not on the box's list). Spec §12.3: every item below must be green too, the test feed included,
before the hearing starts:**

- [ ] Each session shows **Venue box ready** in RT Production.
- [ ] Certificate ≥ 14 days (Box settings → This box, or Venue boxes); UPS on mains (This box); version = the
      current release.
- [ ] Operator chip: transmitter connected, no held second connection, no Eclipse lockout.
- [ ] **Table cards** on the tables: "Join room Wi-Fi" and "Open the transcript" QR codes, address in large type (DR14).
- [ ] **Every room device signs in on the box link this morning** while the internet is up (D28): a room sign-in
      lasts 12 hours and keeps working offline; anyone who missed it cannot read on the box if the internet drops
      (v1 has no room codes, DR23), so make sure every device has signed in.
- [ ] macOS users on Chrome, Edge or Firefox allowed "Local Network" when asked.
- [ ] The CAT laptop's auto-join of other Wi-Fi is off.
- [ ] **Test feed passed (required every hearing morning; office acceptance does not replace it).** Who: the
      engineer, or a box admin trained on the replay laptop. When: after the seven box checks above, before the
      reporter connects (the test session going live ends the "Ready for today" view; the live verdict takes over).
      1. The replay laptop joins the **transmitter (CAT) network**.
      2. Replay the bundled 2-minute Bridge capture into the **test-feed session** made the day before (section 1,
         step 5), never into the hearing's session:
         - **Listen-mode box:** the replay connects to the box's transmitter-network address, port 2500, with the
           test session's Eclipse login.
         - **Dial-mode box:** the replay waits for a connection; a box admin points Box settings → Transmitter at
           the replay laptop with **Receiving session** = the test session and presses **Connect**.
      3. Pass: the lines appear on the box page **and** on etabella.net, the operator chip shows **Synced**, and no
         root mismatch is reported (LAN root = cloud root).
      4. **Stop** the test session in RT Production, wait for "Venue upload complete", then delete it.
      5. Dial-mode box: point Box settings → Transmitter back at the reporter's laptop with Receiving session
         **automatic**. If the guard dialog appears, check it names the **test** session before confirming.

      The replay tool is `tools/feed-replay/cat-dialer.ts` (Phase 1); until it exists, an Eclipse laptop replays
      the capture. **If the test feed fails**, the box is not ready: work through the failing part (sections 6,
      7, 13) and call on-call. Do not run the hearing on the box until the test feed passes, unless on-call
      switches the hearing's session to **Use direct cloud instead** (allowed only before the box has received
      any bytes for it, O-8).

**Telling the reporter how to connect** (Box settings → Transmitter; the mode question is asked in Eclipse's own
setting names, DR16):

| Box mode | Eclipse realtime output | What the reporter enters |
|---|---|---|
| Listen ("Transmitter connects to box") | **Connect to server** | Server address = the box's transmitter-network address, port **2500**, the session's username and password. **Show to reporter** opens a full-screen card with the address, port and username; the password is the one shown in RT Production when the session was created (O-12). Opening the card is logged |
| Dial ("Box connects to transmitter") | **Wait for connection** | Nothing on Eclipse but the port. A box admin enters the laptop's IP, the port and the protocol (Bridge or CaseView) in Box settings → Transmitter and presses **Connect** |

## 3. Operator code (DR7)

> **Off in v1 (DR23).** This section applies only to a box with `features.operatorCode` turned on.

What it is: one code per box per day (shown `OPR-6Z3K-91`), minted online when the box is marked ready, **shown
once**. Offline, it is the only way into Box settings and room-code issuing for someone who has no valid room
sign-in. It works until 23:59 box-local time that day. The box keeps only a hash that expires with the day.

- **Issue:** RT Production → "Venue box ready" shows it once; or Box settings → Status → "Issue operator code" by
  a case admin signed in **online** (the box relays it to the cloud). Re-issuing online replaces the earlier code
  for that day.
- **Keep it like a key:** write it on the operator card in the sealed operator envelope, or print it. Never on the
  table card, never in chat, e-mail or a photo, never to lawyers or the gallery. It is needed only if the internet
  drops.
- **Use:** box login → "Operator? Use today's operator code". Opens Box settings for today only. Every use is
  audited on the box. Repeated wrong tries lock entry for a short time, with a countdown; another day's code is
  refused as expired.
- **Room codes issued under it** ask for the operator's name and are attributed to the case admin who minted the
  code and to that name (O-10; whether this delegation satisfies D33 is still open with the product owner).
- **Leaked?** Online: re-issue (the old code stops working). Offline: it cannot be replaced; it dies at 23:59.
  Tell on-call; the box's audit lists every use.
- **Not issued and the internet is down:** only people with a valid room sign-in who are case admins (box admins)
  can open Box settings. Issue it every hearing morning.

## 4. Room codes (D33, DR10)

> **Off in v1 (DR23).** This section applies only to a box with `features.roomCodes` turned on.

For people who need to read in the room while the internet is down and have no valid room sign-in.

- **Issue:** Box settings → Room codes: pick the session and the person (or "Issue for several people"). Only a
  case admin of **that session's case** can (or an operator-code session, with the operator's name). A read-out
  card shows the full name, role and code (`K7Q-4M2`) **once**; read it to the person. The card clears when the
  picker changes.
- **One person, one session, one use.** The first device that redeems the code keeps access to that session until
  it ends. The same device can sign in again with the same code; another device gets "Used on another device at
  HH:MM · ask the operator".
- **Wrong tries:** 5 per device and per network address, then a 60-second lock with a countdown.
- **Revoke unused code** (not used yet), **End <name>'s room access** (used: that device is signed out at once,
  with a confirm), **Re-issue** (a new code; an unused old one is revoked). "N unused codes" counts what is out.
- Codes end with their session. **Code users can read, not mark** in v1: box-signed tokens are never forwarded to
  the cloud.

## 5. During the hearing

Watch the operator chip and the verdict. The verdict lists every problem, **worst first** (DR12):

| Rank | Problem | Section |
|---|---|---|
| 0 | Recording to disk failed (critical) | 10.1 |
| 1 | Box not linked | 7 / 13 |
| 2 | Disk low | 10.2 |
| 3 | Recovering after restart | 10.3 |
| 4 | Cloud refused the history (D19) | 10.4 |
| 5 | Feed stopped | 6 |
| 6 | Internet unavailable | 7 |
| 7 | Clock | 10.5 |

- Quiet is normal: no lines for a few minutes during a recess shows "No new lines since HH:MM" (neutral up to
  10 minutes). Do nothing.
- **Never** change Transmitter settings during a live session unless this runbook says so. Every interrupting
  change (address, port, protocol, mode, receiving session, auto-reconnect off) goes through one guard dialog that
  shows the session, the current connection, the change and the last line received. It is re-checked on confirm;
  "The connection changed while you were editing. Review again." means someone else changed it: re-read and retry.
  Edits are a draft until applied.
- **Eclipse lockout** (chip): 5 wrong passwords in a minute for a live session's username from one address block
  that address and username for 5 minutes; the lock clears by itself. Meanwhile check the password with the
  reporter (the one shown in RT Production when the session was created): a wrong one locks again. Unlocking
  early from RT Production is not in v1 (O-2).
- **Held connection** (P1): a second device connected with the session's login. Its bytes are kept aside, never
  in the transcript. Find out who it is. If it is the reporter's new laptop: stop realtime output on the old
  laptop, wait 30 seconds, then stop and start realtime output on the new laptop. Once the old feed has sent nothing
  for 30 s the new connection takes over (P2 "took over the feed"); ask the reporter to resend from the verdict's
  minute (the held bytes stay aside as an orphan). Choosing the held connection from RT Production ("make it the
  active feed") is not in v1 (O-2).

## 6. Feed stopped

**What you see.** Room chip "Feed stopped"; banner "No new lines since HH:MM · the operator has been told". Verdict:
"Feed stopped 4 min 12 s ago", "Last line 10:31:05 · page 41, line 18", "Possible gap 10:31:05 → now. Ask the
reporter to resend from 10:31", "Support alerted 10:33". The room keeps everything it already has.

**Feed stopped vs quiet.** Quiet = the link is up and no lines are coming (recess). Stopped = lines came, the
session has not ended, and the transmitter link is down.

**Listen mode** (Eclipse "Connect to server"):

1. Ask the reporter: is Eclipse realtime output still **started**? Restart the output if not.
2. Is the laptop still on the **transmitter network** (cable in, CAT SSID joined, not the hearing Wi-Fi)?
3. Is the server address the box's transmitter-network address, port 2500, with **this session's** login?
   Show to reporter (section 2).
4. Connectivity Log (Problems filter): a refused login means a wrong username or password, or a lockout
   (section 5: it clears by itself after 5 minutes). "Held" means another device used the login (section 5).

**Dial mode** (Eclipse "Wait for connection"):

1. The verdict shows **Reconnect** while the link is down: press it. The box also retries every 3 s by itself.
2. Ask the reporter to check Eclipse output is started and waiting. The laptop's IP may have changed (new cable,
   DHCP): check it against Box settings → Transmitter. Changing the address goes through the guard dialog.
3. **Test only** is offered only while nothing is connected or retrying; it never takes over a live socket.
4. Connectivity Log: retries collapse into one row ("Reporter network 192.168.20.31:8080 · refused · retrying since
   10:31:08 · 63 tries"); "Show tries" lists them.

**When it reconnects.** A green "Reconnected · gap 10:31:05–10:36:40" stays in the verdict until dismissed. Ask
the reporter to **resend from the minute shown** if Eclipse did not resend by itself, then press **Done**.

**After 5 minutes** the verdict offers the split-to-cloud information. Split **only if the box is the problem**:
if Eclipse or the reporter's laptop has stopped sending, the cloud would not receive anything either.

## 7. Internet down

**What you see.** Room chip "Offline · marking paused"; banner "Internet unavailable since HH:MM. The transcript
in this room keeps running. Marking is paused until the internet is back." Operator chip box → cloud: "Internet
unavailable" (no internet) or "Can't reach eTabella" (internet, but etabella.net not reachable). The cloud pages
on-call after 60 s of box silence during a live session.

**What keeps working:** the transmitter → box feed, recording, and reading in the room. Room devices with a valid
room sign-in keep reading **for up to 12 h from their last online sign-in** (D28). Everything reaches the cloud
later, in order, with nothing lost or doubled.

**What does not:** new online sign-ins on devices without their own internet, marking (Quick Marks, QFacts, facts,
doc links, issues), documents and comments. Remote viewers on etabella.net see "Venue box offline since HH:MM";
their view catches up by itself.

**In the room:**

1. **Do not restart** the box or the router. Do not split: splitting needs the internet and fixes nothing here.
2. Check the kit router's WAN status (admin UI on the **wired management port** only): it should fail over to
   4G/5G within a minute. If both are down, wait.
3. People who cannot read (no valid sign-in on that device): in v1 they can only read on etabella.net from a
   device with its own internet (mobile data), or wait for the link to return. With room codes turned on, issue
   **room codes** (section 4); no admin signed in, **today's operator code** (section 3).
4. Sign-ins end 12 h after the morning sign-in; the box warns 30 min before. In v1 nothing renews a sign-in
   offline, so for a hearing that runs past 12 h, have everyone sign in again while the internet is up.

**When it comes back:** one catch-up round, then "Back online · marking available" for 5 seconds; the operator chip
shows "Synced" once the cloud confirms (not before). Check the Connectivity Log `cloud` rows.

**On-call:** Venue boxes shows the box's last seen and egress. Call the operator. If the room is reading and the
transmitter is live, no action: the box catches up when the link returns.

**Ending while offline:** End is a cloud action (O-14). The hearing operator presses Stop in RT Production from any
device with internet; the box applies it when it reconnects, drains, seals and uploads. Lines that arrived in the
meantime are kept. Publish waits for the seal.

## 8. Box failure: Split to direct cloud (D1, D7)

**When.** The box is dead or unreachable and the hearing must continue, or its uplink is frozen because the cloud
refused its history (D19, section 10.4). Target: **under 10 minutes** from failure to lines in the cloud
(rehearsed, section 12).

**Signs of a dead box.** Every room device shows "Can't reach the venue box · retrying · your lines stay on screen"
(and "Open on etabella.net" after 60 s); on-call is paged ("box silent > 60 s during a live session"); Eclipse
shows itself disconnected; the router does not see the box.

**First, rule out the room network.** If the cloud still shows the box online and the transmitter live, the box is
fine: fix the Wi-Fi or router instead, the box is still recording.

**One restart, if the box is frozen.** A restart is a recoverable crash: everything already journaled is kept. Only
when the box is unresponsive (no answer from the router, screen frozen): hold the power button or cut its UPS
outlet, power on, wait up to 3 minutes. If it comes back, ask the reporter to reconnect and resend from the
verdict's minute. If not, split.

**Split, step by step:**

1. **Hearing operator or super-admin**: RT Production → the session → **Split to direct cloud** → confirm.
   Part 1 stops ('S', awaiting its box) and loses its Eclipse route; **Part 2** starts in the cloud with **the same
   Eclipse username and password**. RT Production shows Part 2's cloud host and port.
2. **Reporter** (the transmitter network has no internet, so the laptop must first **join the room Wi-Fi or a phone
   hotspot**; its auto-join is off, so join by hand):
   - **Listen mode** (Eclipse "Connect to server"): change **only the server address** to the cloud host shown for
     Part 2, port **2500**. The login is unchanged.
   - **Dial mode** (Eclipse "Wait for connection"): the cloud never dials a venue (O-5). In Eclipse, switch
     realtime output to **"Connect to server"** with these details: server = the cloud host shown for Part 2,
     port **2500**, username = the session's Eclipse username, password = the one shown in RT Production when the
     session was created (Part 2 reuses it).
3. **Check** RT Production: Part 2's lane shows the CAT connected and lines arriving. Note the time.
4. **Room**: people open etabella.net (their own data or the venue's internet), the case, RT, **Part 2**. When the
   box can still tell them, the banner says "This hearing continues on etabella.net as Part 2" with "Open Part 2".
5. **Record** the incident: failure time, split time, first Part 2 line, who did what.

**Afterwards:**

- If the box comes back (even days later, online), it receives the end for Part 1, uploads Part 1's tail and seals
  it. Publish lists Part 1, then Part 2.
- Do not try to move Part 2 back to the box: switching a live session between writers is Phase 4 (D1).
- Bytes the cloud held from a direct connection before the split are an **orphan** of Part 1: an admin either
  publishes them as an addendum or a super-admin dismisses them with a note (section 11).
- A Part 1 that can never seal: section 11, step 5; a surviving disk: section 11.6.

## 9. Pages and alerts (spec §12)

| Tier | Alert | Go to |
|---|---|---|
| P1 page | Box silent > 60 s during a live session | 8 (or 7 if only the internet) |
| P1 page | Lineage mismatch: the box does not continue the history the cloud applied; session uplink frozen | 10.4 |
| P1 page | `FORK`, repeated `REGRESS`, `DUP_IDENTITY`, `HELD_SHRINK`, `JOURNAL_CORRUPT`, replay divergence | 10.4, 10.6, 13 |
| P1 page | `JOURNAL_UNRECOVERABLE`: a session's journal is damaged and the cloud cannot repair it (RECOVER refused 3 times in a row); its upload is frozen. The alert names the next step | 10.4 (ended session: 11, step 5) |
| P1 page | Degraded durability (the box cannot write its journal) | 10.1 |
| P1 page | Held CAT connection, or a held direct stream for a venue session | 5 |
| P1 page | Certificate < 7 days before a scheduled hearing; box quarantined | 13, call the backend owner |
| P2 notify | Lag > 30 s while connected; root or audit mismatch; orphan created; refused unknown Eclipse login (P1 if > 10/h from one address, O-18); disk < 5 GB; clock off > 5 s (P1 > 60 s); certificate < 21 days; UPS on battery; version > 14 days behind; session awaiting seal > 24 h; warnings unacknowledged > 24 h; `RECOVER_FAILED` (the box could not pull its missing records back yet; once per session and cause, again after an hour, retried at every hello) | as named |
| Chip only | CAT silent > 2 min; CAT disconnect/reconnect; reconnect flaps; Eclipse lockout | 5, 6 |

An unknown Eclipse login is refused and alerted and nothing is kept (D3). If it is the reporter, they typed the
wrong username, or the session was created for another box or not at all.

## 10. Other problems

### 10.1 Recording to disk failed (critical)

The box cannot write its journal (disk full, I/O error, journal corrupt). It keeps serving the room from memory
and rounds carry only what the cloud has acknowledged, so the cloud never goes backwards; this is recorded as an
incident in the seal. **Call on-call now.** Do not restart the box. If the internet is up, on-call decides whether
to **split** (section 8) so the cloud becomes the writer. Afterwards the hearing completes "with warnings" and the
reporter's Eclipse file is used to reconcile.

### 10.2 Disk low

Under 10 GB free, new sessions will not arm; under 5 GB P2. **Download diagnostics**, call on-call. Never delete
files on the box. A box ships with far more free space than a hearing week needs; a full disk means something is
wrong (log growth, held captures, purge not running), or many `W` / force-closed sessions are kept on the box
(section 11, step 8): once they are published, re-image the box at the office.

### 10.3 Recovering after restart

After a crash or power cut the box replays its journal from the last checkpoint ("Recovering after a restart";
v1 shows no percentage). Wait. Room devices reconnect by themselves and show nothing new until the replay finishes;
then the box tells each open room to refresh (`feed-resync`) and the whole transcript comes back without a new line
or a page reload. Lines
that Eclipse sent but the box had not yet written to disk at the moment of the crash may be missing unless Eclipse
resends them (D25): ask the reporter to resend from the verdict's minute.

### 10.4 Cloud refused the history (D19), fork, regress

The box's uplink for that session is **frozen**: the cloud refuses a box that does not continue the history it
last applied (restored image, cloned box, corrupted journal). The room keeps reading from the box (it is still
"live in the room"). The cloud transcript stops. **Split to direct cloud** (section 8) so the cloud transcript
continues; on-call investigates with the diagnostics. There is no automatic rebase in v1 (O-1).

**A damaged journal the cloud cannot repair** (`JOURNAL_UNRECOVERABLE`, P1, MR-4). A corrupt journal is normally
repaired by the box pulling the cloud's copy back (RECOVER). When the damaged part was never uploaded, the cloud has
nothing to repair it with; after three refusals in a row the box stops retrying and freezes the session the same
way. The alert says what to do: a live session is **split to direct cloud** (section 8); a session that had already
ended is **force-closed (incomplete)** by a super-admin (section 11, step 5). The reporter's Eclipse file is the
authority for the damaged part (D25).

### 10.5 Clock

Offset over 5 s: P2; over 60 s: P1 and the box steps its clock from the cloud. With no internet chrony cannot sync;
the transcript order never depends on the clock, only times shown can be off. Fix the internet first, then Run
checks again.

### 10.6 Held shrink

A round that would remove more than 500 lines or 5 % of the transcript is **held** for a decision (S-D16), usually
after a large reporter refresh. On-call compares with the reporter before confirming in RT Production.

### 10.7 Certificate

The room page needs a valid certificate (HTTPS with HSTS, no click-through). In v1 the cloud does not issue box
certificates (its issuer answers `501`; the box raises `CERTIFICATE_RENEWAL_FAILED` at most once an hour, also to the
cloud): a new pair is issued at the office and installed on the box console with
`etabella-edge cert install --key <file> --chain <file>` (install.md step 11), before 30 days are left. Under 14 days
the box is not "ready". Alerts at
21 days (P2) and 7 days before a scheduled hearing (P1). An expired certificate is a hard stop for the room
(recording continues). A power cut during an install is finished at the next start: the box never serves half a pair.

## 11. End, seal and publish

1. **Stop** in RT Production (hearing operator). RT Production shows "Ending: draining CAT, then waiting for venue
   upload (N lines)".
2. **Reporter: stay connected** until the box shows the session ended. The box refuses new connections but keeps
   the active one so the closing lines and any refresh still land. It drains until the transmitter has been idle
   for 60 s and no refresh window is open (at most 5 minutes), then writes the end, uploads the rest and sends the
   signed seal.
3. **Sealed.** "Venue upload complete" (`K`), or "complete with N warnings" (`W`). Warnings (aborted refresh window,
   degraded durability, concurrent CAT, clock unverified …) need an **Acknowledge** with a note, by a global admin,
   a case admin or the hearing operator.
4. **Publish** is enabled when the session is `K`, acknowledged `W`, or force-closed `F`. A **split hearing**
   publishes its parts in order (Part 1, then Part 2), and only when **every** part is `K`, acknowledged `W` or `F`
   (O-4). Pending orphans (held streams) block publish until resolved: an **addendum** (admin, case admin or
   hearing operator) or a **dismissal** with a note (super-admin; the session becomes `F`).
5. **A part that can never seal** (box dead, or frozen by D19): a super-admin uses **Force close (incomplete)** with
   a note. The transcript is watermarked "INCOMPLETE: venue data missing <interval>" (O-3, S-D8). A surviving disk
   can still be read (section 11.6).
6. **Contested hearing:** reconcile against the reporter's Eclipse file, which is the authority (D25).
7. **Live exports** before the end are stamped "Live: as of HH:MM:SS"; after Stop, exports wait for the seal.
8. **The box purges** a `K` session 24 h after its seal (the cloud verified the root and the raw chain). In v1 a `W`
   session stays on the box, and so does a force-closed one (`F`, or sealed while the box was away): the box never
   learns that a `W` was acknowledged or that a session was published (that cloud → box signal is not in this
   build). Such sessions leave the box when it is re-imaged at the office (install.md, "Update a pilot box"), once
   RT Production shows them published. Unsealed sessions are never purged; never delete files by hand.

**Leaving the venue:** before switching the box off for transport, `etabella-edge status` (or Box settings → This
box) shows no session still ending or awaiting its seal; a box with an unsealed session goes back online as soon as
possible so it can seal.

### 11.6 A box that never comes back

The disk is encrypted and its key is sealed to the dead box's TPM. At the office:

1. Put the disk in an office machine; open it with the box's **LUKS recovery passphrase** from the vault
   (`cryptsetup open`), mount it read-only.
2. Copy `var/lib/etabella-edge/journal/<nSesid>/` to an office box under `/var/lib/etabella-edge/recover/<nSesid>/`.
3. ```sh
   etabella-edge recover --journal /var/lib/etabella-edge/recover/<nSesid> --out /var/lib/etabella-edge/recover/<nSesid>.transcript.json
   ```
4. Compare with the cloud's Part 1 and the reporter's file; on-call and the product owner decide (force close or
   addendum). Then wipe the copies and the disk.

## 12. Split rehearsal (D9, gate G2)

Required **before the first pilot hearing**, and again after any change to the cloud's `:2500` listener.
Pass = the split finished end to end in **under 10 minutes**.

**Preconditions:**

- Phase 0 audit done: the process listening on the production host's port 2500 is named, with its route file and
  enable flag (`ECLIPSE_TCP_INGEST=1`), and cloud-direct ingest is verified in production.
- A **staging** cloud running the production build with the same listener settings (`ECLIPSE_TCP_INGEST=1`,
  `ECLIPSE_AUTH_PORT=2500`), reachable on `:2500`.
- A box enrolled to staging (its `cloud.origin` is the staging origin), a staging case assigned to it.
- A replayed Eclipse feed: the Eclipse-direction replay tool (`tools/feed-replay/cat-dialer.ts`, Phase 1) with a
  Bridge corpus; until it exists, an Eclipse laptop replaying a capture. For dial mode, `tcp-server-main`'s
  `tcp.js` stands in for a transmitter waiting for a connection.
- People: the hearing operator, a "reporter" running the replay, a timekeeper.

**Run (listen mode):**

| Step | Action | Record |
|---|---|---|
| 1 | Create a staging session for the box in RT Production; wait for "Venue box ready" | |
| 2 | Start the replay into box `:2500` with the session login; let it run 5 minutes; a room device reads on the box | |
| 3 | **T1**: pull the box's power | time |
| 4 | Detection: page received, room banner "Can't reach the venue box" | time |
| 5 | **T3**: Split to direct cloud in RT Production | time |
| 6 | Re-point the replay to the staging host `:2500`, same login | time |
| 7 | **T5**: first Part 2 line visible on etabella (staging) | time |
| 8 | Power the box back on; it receives the end for Part 1, uploads the tail, seals Part 1 (`K`/`W`) | time, state |
| 9 | Publish: Part 1 then Part 2, in order; no 409 at split; Part 1 got nothing from the cloud listener after the split | pass/fail |

**Run again in dial mode:** the replay waits for a connection; the box dials it (Box settings → Transmitter). At
step 6 the "reporter" switches to "Connect to server" with the cloud host, port 2500 and the session login (O-5).

**Pass:** T5 − T1 < 10 minutes in both modes, step 9 passes. Keep the record (date, build, times, names) with the
release notes. A fail blocks the pilot (G2).

## 13. Collecting diagnostics

**From Box settings** (box admins, including an operator-code session): Status & troubleshooting → **Download
diagnostics**. The file is `etabella-box-<label>-<YYYYMMDD-HHmm>.zip`: logs, status, readiness and network results,
versions and the Connectivity Log. It never contains transcript text, tokens, code hashes or Eclipse logins.
Downloading it is audited. Send it to support through the usual support channel.

**From the console** (office, or on site with a keyboard), when the box page does not load:

```sh
etabella-edge status
etabella-edge status --json
docker inspect --format '{{json .State.Health}}' rt-edge
journalctl -u rt-edge -u docker -u etabella-edge-hoststatus --since "2 hours ago" --no-pager
docker logs --since 2h rt-edge
df -h /var/lib/etabella-edge
chronyc tracking
upsc ups@localhost ups.status
ufw status verbose
```

Never copy `edge.sqlite`, `journal/`, `capture/`, `device-key.pem` or `certs/privkey.pem` off the box: they hold
transcripts and keys. Journals leave a box only through its uplink, or through 11.6 at the office.

`/edge/local/metrics` (LAN only) serves Prometheus metrics labelled by session id, never case names.

In a browser's developer tools on the box page, every RT data answer carries `X-Edge-Source`: `box` (the box's own
copy), `cloud` (fetched from etabella.net through the box) or `cache` (the box's cached copy of an etabella.net
answer, with `X-Edge-Stale: <seconds>`). It is for diagnosis only; the page never reads it.

## 14. Quick reference

| What | Value |
|---|---|
| Box page | `https://<slug>.etabella-edge.net/` (hearing Wi-Fi; resolved by the kit router) |
| Eclipse listen mode | box transmitter-network address, port 2500, the session login |
| Eclipse dial mode | the box dials the reporter's laptop (Bridge or CaseView), retry every 3 s |
| Room sign-in | 12 h, renewed online, never past 24 h after the etabella.net sign-in (D24); warnings 60 min (online) / 30 min (offline) before |
| Room code | 6 characters (`K7Q-4M2`), one person, one session, device-bound; 5 tries → 60 s lock |
| Operator code | `OPR-XXXX-XX`, one per box per day, until 23:59 box time |
| Drain at end | transmitter idle 60 s and no refresh window open, at most 5 min |
| Thresholds | room "box unreachable" after 10 s, "Open on etabella.net" after 60 s; offline after 15 s down, online after 10 s up; split offered 5 min after a feed stop |
| Disk | ready ≥ 20 GB, sessions arm ≥ 10 GB, P2 < 5 GB |
| CLI | `etabella-edge status [--json]`, `etabella-edge capture list`, `etabella-edge capture upload [--id <id>]`, `etabella-edge recover --journal <dir> [--out <file>]`, `etabella-edge cert install --key <file> --chain <file>`, `etabella-edge enroll --code <code>` (box stopped) |
| CLI exit codes | 0 ok, 1 failed, 64 usage, 70 software, 75 box running, 77 not root, 78 config |
| Service | `systemctl status rt-edge` (never `restart` during a hearing) |
