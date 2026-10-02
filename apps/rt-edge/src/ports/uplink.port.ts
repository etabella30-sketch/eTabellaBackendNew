/**
 * UplinkPort (token UPLINK_PORT, module uplink/): the box → cloud link (spec §3.2 `uplink`, §5.3–§5.7, D17–D19).
 *
 * The uplink owns: the socket.io-client connection to `BoxConfig.cloud.uplinkUrl` namespace `/edge`
 * (`tryAllTransports: true`, ping 10 s / timeout 20 s, `emitWithAck` 15 s), the clock-free device auth (challenge →
 * P-256 signature over `nonce‖edgeId‖bootId` with the key in `paths.deviceKeyFile`), `e.hello` and the per-session
 * lineage checks (`boxCheckHelloReply` / `resumeFromHello` over `KernelPort.journalView`), rounds (`buildRound` over
 * `KernelPort.view`, one in flight per session, `classifyRoundReply`), the raw lane (`KernelPort.readRaw`), RECOVER
 * (`KernelPort.recoverFromCloud`), the seal (`sealClaims` / `sealSigningPayload`, signed with the device key) after
 * the kernel's `session-event {type:'ended'}` (and, after a restart, for every ended-unsealed session the kernel
 * holds open: `KernelPort.endResult` non-null and `sealedAtMs` null; a complete seal reply sets `sealedAtMs`,
 * `sealState` and `localState:'sealed'` and publishes `session-status {cause:'uplink'}`, on which the kernel drops
 * the session), `e.ready`, `e.capture`, `e.status` every 5 s,
 * and the cloud → box messages (`c.assign` → StatePort + `assignments-changed`; `c.need`; revocations →
 * `StatePort.revocations.applyCloud(rev, receivedAtMs)` / `revokeUser(nUserid, receivedAtMs)` with the BOX receipt
 * time (the repo adds the clock skew; never pass the cloud's `since` as a cut-off) + `access-revoked`;
 * `edgeTokenKeys` → `StatePort.jwks`). It also owns the box's view of its internet (the `EDGE_TIMING` hysteresis:
 * offline after 15 s down, online after 10 s up) and writes the `cloud-*` / `internet-*` Connectivity Log rows.
 *
 * `e.status` (edge-sync `EdgeStatus`, spec §12): `sessions[]` from `KernelPort.sessions()` (`lastAuditOk` =
 * `KernelSessionView.lastAudit?.ok`, omitted while null), this port's sync fields and the latest `lan-viewers`; `device` = the latest `device-health`
 * bus payload (ops re-publishes it every heartbeat; fields still null are omitted) plus `sw`
 * (`BoxConfig.release.version`), `parserVer`, `uptime` (s) and `egressIp` (as the cloud last reported it). The
 * heartbeat's `dCertExp` (`rtedge_heartbeat`) is `certificate().info?.notAfterMs` as ISO-8601, omitted when null.
 *
 * The uplink also OWNS THE LAN CERTIFICATE (spec §8.3, §3.4 install step 3; ports/certificate.ts): it is the module
 * with the device key, the cloud origin and the identity, which `edge/v1/cert` needs. `ensureCertificate` below is
 * the only writer of `BoxConfig.http.tls.certFile` / `keyFile`; main.ts serves them, ops reports them.
 *
 * Reconnect backoff 1 → 30 s with full jitter, reset after 60 s stable (spec §10 #2). In `cli` run mode `start` is
 * never called; `enrol` works without it.
 */
import type { HelloVerdict, SealReply, UplinkState } from '@app/edge-sync';

import type { CloudLinkStatus, EdgeInternetStatus, EdgePersonRef } from '../contracts';
import type { EdgePrincipal } from './auth.port';
import type { EdgeCertificateStatus } from './certificate';

/**
 * Box → cloud link status (operator chip right segment and Status tile "cloud link"):
 * - `online`: the `/edge` socket is connected AND the last hello completed (a socket that is up but refused, e.g.
 *   quarantined, is not online);
 * - `lagSec`: max over sessions of (now − commit time of the oldest change the cloud has not acked), whole seconds,
 *   0 when everything is acked (spec §12 `lagSec`);
 * - `pendingPages`: dirty pages summed over sessions (local digest ≠ the cloud's);
 * - `lastSyncAt`: epoch ms of the last cloud CONFIRMATION (round `ok` or raw ack); null before the first;
 * - `lastCheckedAt`: epoch ms of the last evidence about the link (connect, ack, ping/pong, or a failed probe);
 * - `stale`: `now − lastCheckedAt > EDGE_TIMING.statusStaleAfterMs` (a stalled uplink loop).
 */
export interface UplinkLinkStatus {
    readonly online: boolean;
    readonly lagSec: number;
    readonly pendingPages: number;
    readonly lastSyncAt: number | null;
    readonly lastCheckedAt: number;
    readonly stale: boolean;
}

/** One session's sync position (`e.status` session fields, verdict `history-refused`, BoxDetails `cloudRootShort`). */
export interface UplinkSessionSync {
    readonly nSesid: string;
    /** `ok` | `recovering` | `frozen` (v1; `rebasing`/`fenced` are Phase 4 and never reported). */
    readonly uplinkState: UplinkState;
    /** The last hello verdict for the session; null before the first hello. */
    readonly verdict: HelloVerdict | null;
    readonly cloudAppliedRev: number;
    readonly appliedRawSeq: number | null;
    readonly rawAckedSeq: number;
    /** Root of the last applied round as the cloud confirmed it; null before the first. */
    readonly cloudRoot: string | null;
    readonly dirtyPages: number;
    /** Lines in dirty pages plus lines beyond the cloud's total. */
    readonly lagLines: number;
    /** Raw head minus raw acked, in bytes. */
    readonly lagBytes: number;
    readonly lagSec: number;
    readonly lastSyncedAtMs: number | null;
    /** D19 / FORK: when and why the session's uplink froze; null when not frozen. */
    readonly frozenAtMs: number | null;
    readonly frozenReason: string | null;
    /** MR-2: a round held by the shrink guard (`HELD_SHRINK{heldId}`); null otherwise. */
    readonly heldShrinkId: string | null;
    /** The seal reply's state once complete. */
    readonly sealState: 'K' | 'W' | null;
}

/** Result of `rt-edge enroll` (spec §3.4 install step 2). */
export interface UplinkEnrolResult {
    readonly nEdgeid: string;
    readonly slug: string;
    /** Print this on the console; the admin compares it in Venue boxes. */
    readonly keyFingerprint: string;
    /** 'pending-confirm' until the admin confirms. */
    readonly status: 'pending-confirm' | 'active';
}

/** What the cloud mint returned through the relay (`POST /edge/local/operator-code/issue`, CONTRACTS.md §8.2). */
export interface RelayedOperatorCode {
    /** Normalized (`OPR6Z3K91`). The plaintext passes through once; the uplink keeps nothing but the hash it stores. */
    readonly code: string;
    readonly day: string;
    readonly validUntilMs: number;
    readonly mintedBy: EdgePersonRef;
    readonly replacedEarlier: boolean;
}

export interface UplinkPort {
    /**
     * Begin connecting and keep connected, in the background, when `StatePort.identity` is `pending-confirm`,
     * `active` or `quarantined` (never without an identity or when `revoked`). Called after the LAN listener's first
     * attempt, WHETHER OR NOT it bound (ports/boot.ts): a box without a certificate depends on this to get one.
     * - `pending-confirm`: the cloud refuses an unconfirmed key (spec §5.3 requires 'A'); the uplink keeps retrying
     *   with the normal reconnect backoff (`linkFailure: 'key-refused'` meanwhile). The first accepted connect is the
     *   admin's confirmation (spec §3.4 step 3): it patches the identity to `active` (`confirmedAtMs`) and runs
     *   `ensureCertificate()`.
     * - `active`: runs `ensureCertificate()` in the background right away (it is a no-op when nothing is due), after
     *   every completed hello, and every EDGE_CERT_CHECK_INTERVAL_MS while online.
     * Resolves PROMPTLY: it never awaits a connect, a hello, a certificate or any network I/O, and it does NOT reject
     * for a runtime condition — offline, not enrolled, revoked, an unreadable or refused device key, an unreachable
     * or refusing cloud, no certificate — those are state: `cloudLink()`, `certificate()`,
     * `StatePort.identity.patch({linkFailure})` (verdict `box-not-linked`, readiness `box-linked`), the Connectivity
     * Log and `alert`s. Rejects only on a programming error; the lifecycle then logs it, alerts and keeps the box
     * recording. Idempotent; the box subscribes to the bus here (`device-health`, `lan-viewers`, `session-event`,
     * `alert`).
     */
    start(): Promise<void>;
    /**
     * Disconnect cleanly (pending acks are abandoned; the next hello's digest diff covers them). Idempotent; a no-op
     * when `start` never ran; a `start` still pending is abandoned (it must not connect after `close`).
     */
    close(): Promise<void>;

    status(): UplinkLinkStatus;
    /** Contract operator-chip segment (`synced` only after a cloud confirmation, DR6). */
    cloudLink(): CloudLinkStatus;
    /** The box's internet with the UI hysteresis (`EdgePingResponse.internet`, readiness, verdict, marking). */
    internet(): EdgeInternetStatus;
    /** etabella.net answered the last probe (HTTPS with certificate validation). */
    etabellaReachable(): boolean;
    session(nSesid: string): UplinkSessionSync | null;
    sessions(): readonly UplinkSessionSync[];

    /**
     * "Run checks again" (readiness, verdict): reconnect if needed, run hello, pull assignments, and resolve when the
     * hello completed (the assignments are stored and `assignments-changed` published). Rejects with
     * `EdgePortError('offline', …, {offline:true})` within 300 ms when the internet is down,
     * `box_not_configured` without an identity, `box_not_linked` when the cloud refuses the box (revoked,
     * quarantined, unconfirmed key).
     */
    syncNow(): Promise<void>;
    /**
     * Enrol (spec §3.4): generate the device key (TPM-sealed software key on pilot boxes, D2) into
     * `paths.deviceKeyFile` (mode 0600; refuses to overwrite an existing key unless `rekey`), send the one-time code
     * and the public key to the cloud, store the identity (`pending-confirm`) and return the fingerprint. It does not
     * wait for the admin's confirmation and fetches no certificate: the running box (`rt-edge` serve, `start()`)
     * learns the confirmation on its first accepted connect and then runs `ensureCertificate()`. Errors:
     * `invalid_request` (malformed code), `offline`, `cloud_refused` (code unknown, expired or used).
     */
    enrol(input: { readonly code: string; readonly cloudOrigin?: string; readonly rekey?: boolean }): Promise<UplinkEnrolResult>;
    /**
     * Relay an operator-code mint to the cloud for an ONLINE case admin (the principal's edge token goes with it;
     * box-signed tokens never do). Stores the returned day hash in `StatePort.operatorCodes` (source 'relay').
     * Errors: `online_sign_in_required` (principal not `online`), `not_case_admin`, `offline`, `cloud_refused`.
     */
    relayOperatorCode(principal: EdgePrincipal): Promise<RelayedOperatorCode>;
    /** Send `e.seal` for an ended session now (normally automatic after `session-event {type:'ended'}`). */
    seal(nSesid: string): Promise<SealReply>;
    /** Upload one closed held capture (`e.capture` + archive URL); returns the cloud orphan id. Errors: not_found, offline. */
    uploadCapture(id: string): Promise<{ readonly nOrphanid: string }>;

    /**
     * The installed LAN certificate: `certificateStatus(BoxConfig.http.tls, readFile, now,
     * boxHostname(identity.slug, box.domain) | null)` (ports/certificate.ts), re-inspected at most every
     * EDGE_CERT_INSPECT_CACHE_MS and right after an install. Works before / without `start()` and in `cli` mode (ops
     * reads it for `device-health.certDaysLeft`, readiness, the verdict and the expiry alerts; `rt-edge status`
     * prints it). Never throws; `not-configured` with plain HTTP (dev).
     */
    certificate(): EdgeCertificateStatus;
    /**
     * Fetch and install a certificate for `<slug>.<box.domain>` when `certificateRenewalDue(certificate(), now)`
     * (spec §8.3: missing / unreadable / invalid / wrong host / not yet valid, or less than two thirds of the
     * lifetime left — expired included); otherwise resolve the current status without any I/O. Concurrent calls
     * share one run. Resolves the status after the run.
     *
     * Steps (each failure leaves the installed pair untouched):
     * 1. Generate a NEW P-256 TLS key with node:crypto (never the device key; a fresh key per issuance) into
     *    `<keyFile>.next` (mode 0600; `paths.certDir` created 0700), replacing a stale `.next` of an interrupted run.
     * 2. Build a PKCS#10 CSR, CN and the only subjectAltName DNS = `boxHostname(identity.slug, box.domain)`, signed
     *    with that key.
     * 3. `GET <cloud.realtimeApiUrl>/edge/v1/challenge?edgeId=<nEdgeid>` → nonce, then `POST …/edge/v1/cert`
     *    `{ edgeId, nonce, csr: <PEM>, sig }`, where `sig` = base64 DER ECDSA-P256-SHA256 by the DEVICE key over the
     *    UTF-8 string `nonce‖edgeId‖sha256hex(csrDer)` ("a device signature", spec §7 route rules). The cloud
     *    (`edge-registry.service`, ACME DNS-01) replies `{ msg: 1, chain: <PEM, leaf first> }`. HTTPS with
     *    certificate validation, 15 s timeout per request; a cloud answer of 202/`pending` (issuance still running)
     *    is retried at the next trigger.
     * 4. Verify before installing: the leaf parses (`inspectCertificatePem`), matches the new key
     *    (`X509Certificate.checkPrivateKey`), covers the host, `notBefore ≤ now + EDGE_BOX_CLOCK_SKEW_MS` and
     *    `notAfter > now`, and `readTlsMaterial` accepts chain + key as a pair.
     * 5. Install (uplink/cert-install.ts `installCertificatePair`) under the cert directory's install lock, shared
     *    with the console's `rt-edge cert install`: stage `<keyFile>.next` and `<certFile>.next`, check the staged
     *    pair loads, rename the key then the chain into place (a crash between the renames is finished at the next
     *    start). Audited (`cert-install`, `via: 'cloud'`).
     * 6. Publish `certificate-installed` (main.ts binds or reloads at once), refresh `certificate()`, and send the
     *    new `dCertExp` with the next heartbeat.
     *
     * Errors (the background triggers log these and raise `CERTIFICATE_RENEWAL_FAILED`, P2, P1 when
     * `daysLeft < EDGE_CERT_PAGE_DAYS`; the next trigger retries): `box_not_configured` (no identity),
     * `box_not_linked` (identity not `active`: `pending-confirm`, `quarantined` or `revoked` boxes get no
     * certificate), `offline`, `cloud_refused` (the cloud refused the CSR, or its chain failed step 4),
     * `rate_limited` (a console `cert install` holds the install lock: nothing was written).
     */
    ensureCertificate(): Promise<EdgeCertificateStatus>;
}
