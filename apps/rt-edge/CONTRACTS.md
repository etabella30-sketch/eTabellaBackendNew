# rt-edge — venue box API contract (v1.0.0)

The HTTP and LAN-socket contract between the **venue box** (`apps/rt-edge`) and the **edge build** of the Angular app
that the box serves (D23). It is written before either side is implemented; both sides build against it.

| | |
|---|---|
| Types (source of truth) | `apps/rt-edge/src/contracts/*.ts`, exported from `contracts/index.ts` |
| FE mirror | `eTabella angular 21: src/app/features/edge/api/edge-api.types.ts` — generated from the files above, see §11 |
| FE client | `src/app/features/edge/api/edge-api.service.ts` (`EdgeApiService`) |
| Contract version | `EDGE_CONTRACT_VERSION = '1.0.0'`, served in `/edge-config.json`; the FE refuses a different major |
| Authority | `docs/rt-local-edge-spec.md` rev 3 (§4.10, §8.2, §8.4, §8.7, §9, §9.1, §9.2, §12), plan ledger D1–D34, design review DR1–DR23 (DR23: email sign-in only in v1), build defaults O-1…O-19 (`build-decisions.md`), approved wireframes v2 |

Where this file and the `.ts` types disagree, the types win and this file is the bug.

---

## 1. Conventions

- **One origin.** Every path is relative to the box origin `https://<slug>.etabella-edge.net`. The page is served
  by the box, so every call is same-origin: no CORS, no mixed content, no PNA preflight (spec §8.3).
  The FE sends `withCredentials: true` (it matters only for the room-code device cookie, §2.3).
- **Time.** Instants are **epoch milliseconds (UTC)** named `…AtMs` (plus `nowMs`). Durations are `…Ms` / `…Sec`.
  Exceptions: JWT claims (epoch seconds) and the cloud-compatible `edge-status` fields `since` / `lastSyncAt`
  (epoch ms, names kept from the cloud gateway). A **day** is `YYYY-MM-DD` in the box time zone
  (`EdgeConfig.timeZone`). Every HH:MM on a box screen is formatted in that zone (a session's own `tz` for its start).
- **Ids** keep the cloud's names and are strings: `nEdgeid`, `nCaseid`, `nSesid`, `nUserid`.
- **Envelope.** Success bodies carry `msg: 1`. Errors are `{ msg: -1, error: <code>, message: <developer text>, …extra }`
  with the HTTP status from `EDGE_ERROR_STATUS`. `message` is never shown to people; **the FE owns every sentence**.
  The box sends machine codes and numbers (e.g. `attemptsLeft`, `retryAfterSec`, `feedStoppedAtMs`).
- **Caching.** `/edge-config.json`, `/edge/ping` and every `/edge/*` reply carry `Cache-Control: no-store`.
- **Paths.** Exactly the ones in `EDGE_ROUTES` (`routes.ts`); `edgePath(path, params)` fills `:id` segments
  (URI-encoded). This file settles O-17 for the box screens' API.

## 2. Identities and auth

### 2.1 Three ways in, one header

| Kind (`EdgeIdentityKind`) | Token | Issued by | Lifetime | Can mark? (v1) |
|---|---|---|---|---|
| `online` | edge ("room sign-in") token, ES256, `aud=edge:<nEdgeid>`, `cases` claim (D22) | etabella.net authapi after the PKCE sign-in (D33) | ≤ 12 h (D28), renewals never past `auth_time + 24 h` (D24) | yes, while online (proxied) |
| `room-code` | box-signed token, `iss=box:<nEdgeid>`, `kind:'room-code'`, `nSesid`, `mintedBy` | the box, on `POST /edge/auth/room-code` | until its session ends, capped at redemption + 24 h (O-9) | **no** — box-signed tokens are never forwarded; proxied writes get `503 {reauth:true}` (§8.4) |
| `operator` | box-signed token, `kind:'operator'`, `day`, `mintedBy` | the box, on `POST /edge/auth/operator-code` | to the end of that box-local day (DR7) | no (an operator is not a user) |

Every signed-in call carries `Authorization: Bearer <token>`; the LAN socket sends the same token as
`auth: { token }`. The FE keeps the token in `localStorage` on the box origin (spec §8.4 step 5); the edge auth
interceptor attaches it to same-origin requests only. Routes with auth `none` ignore any header.
A client-supplied `nUserid` (body, query, socket `query`) is never trusted.

### 2.2 Who is a box admin (O-11)

`box-admin` = case admin of ≥ 1 case assigned to the box (cached roster), **or** super-admin, **or** an operator-code
session (that day only). Room-code identities are never box admins. Issuing a room code additionally needs case
admin of **that session's case** (operator session: a case of the admin who minted the code, O-10).
`online-case-admin` = an `online` identity that is case admin of ≥ 1 box case, or a super-admin.

### 2.3 Room-code device binding (O-9)

On the first redemption the box sets `etab_edge_device` (`EDGE_DEVICE_COOKIE`): random device id, `httpOnly`,
`Secure`, `SameSite=Strict`, `Path=/`, `Max-Age` 7 days. A redeemed code is bound to that id: the same device may
redeem the same code again (`reentry: true`); any other device gets `code_used_elsewhere`.
Wrong tries: **5 per device cookie and per client IP → 60 s lock** (`EDGE_CODE_MAX_TRIES`, `EDGE_CODE_LOCK_SEC`).

### 2.4 Status codes that matter to the interceptor

- **401 only means "your sign-in is not valid"** (`unauthenticated`, `token_expired`, `token_revoked`). The edge
  interceptor answers it by signing in again (online: PKCE; room-code: the room-code panel). Code-entry failures and
  permission refusals are **never** 401.
- **503 `{offline:true}`** / **`{reauth:true}`** never sign anyone out (spec §9 interceptor row).
- **403 `{useCloud:true}`**: a route the box never serves (admin, Eclipse credentials, upload, transcript; §8.2).

## 3. Error codes (`EDGE_ERROR_CODES`)

| Code | HTTP | Extra fields | Meaning |
|---|---|---|---|
| `unauthenticated` | 401 | — | no / unreadable token on a signed-in route |
| `token_expired` | 401 | — | token past `exp` (±5 min skew) |
| `token_revoked` | 401 | — | revocation list, sign-out denylist, ended room access |
| `not_box_admin` | 403 | — | box-admin route, caller is not (§2.2) |
| `not_case_admin` | 403 | — | room codes for a case the caller does not administer |
| `online_sign_in_required` | 403 | — | needs an `online` identity (operator-code issue) |
| `use_cloud` | 403 | `useCloud: true` | route never served by the box |
| `reauth` | 503 | `reauth: true` | box-signed token on a proxied cloud route |
| `offline` | 503 | `offline: true` | needs the internet; answered within 300 ms |
| `box_not_linked` | 503 | — | the box has no confirmed cloud identity |
| `box_not_configured` | 503 | — | the box has no identity at all (§10 #22) |
| `code_wrong` | 400 | `attemptsLeft` | "That code doesn't match. Check it with the operator." |
| `code_used_elsewhere` | 409 | `usedAtMs`, `deviceLabel` | "Used on another device at 10:48. Ask the operator." |
| `code_expired` | 410 | `sessionName`, `endedAtMs` (both null for an operator code) | "This code was for Day 2 — Afternoon, which has ended." |
| `code_revoked` | 410 | — | revoked unused code, or room access ended by an admin |
| `code_locked` | 429 | `retryAfterSec` | "Too many tries. Try again in 0:52." |
| `session_not_found` | 404 | — | unknown or purged session |
| `session_ended` | 409 | — | cannot issue codes for an ended session |
| `operator_name_required` | 400 | — | operator-code session issued without `operatorName` (O-10) |
| `code_already_used` | 409 | — | revoke on a used code (use end-access) |
| `code_not_used` | 409 | — | end-access on an unused code (use revoke) |
| `state_changed` | 409 | `stateVersion` | transmitter changed since the caller read it (DR13) |
| `confirm_required` | 409 | `guard: TransmitterGuard` | interrupting change, confirm first (DR13) |
| `invalid_settings` | 400 | `fields: TransmitterFieldErrors` | inline validation (IPv4, port 1–65535) |
| `not_dial_mode` | 409 | — | connect / reconnect / test in listen mode |
| `not_configured` | 409 | — | connect with no applied dial address |
| `already_connected` | 409 | — | connect while the link is up |
| `link_up` | 409 | — | reconnect while the link is up |
| `test_refused_busy` | 409 | `linkState` | "Test only" while connected, retrying or capturing |
| `feature_disabled` | 404 | — | a route of a code sign-in switched off in this box's config (`features.roomCodes` / `operatorCode`, §5.1), answered before any sign-in check |
| `not_found` | 404 | — | unknown id |
| `invalid_request` | 400 | — | malformed body or query |
| `payload_too_large` | 413 | — | the request body is over the box's limit (its body parser's, or 1 MiB on the RT write routes, §8.8); never `invalid_request` |
| `rate_limited` | 429 | `retryAfterSec` | too many calls |
| `cloud_refused` | 502 | — | the cloud refused a relayed call |
| `server_error` | 500 | — | anything else |

Client-only codes (`EDGE_CLIENT_ERROR_CODES`, never sent by the box): `box_unreachable` (network error, status 0)
and `timeout`. `edgeCallFailure(err)` in the FE service maps every failure to one of these shapes.

## 4. Endpoint summary

| # | Method | Path | Auth | Request | 200 reply |
|---|---|---|---|---|---|
| 1 | GET | `/edge-config.json` | none | — | `EdgeConfig` |
| 2 | GET | `/edge/ping` | none | — | `EdgePingResponse` |
| 3 | POST | `/edge/auth/sign-in/start` | none | `EdgeSignInStartRequest` | `EdgeSignInStartResponse` |
| 4 | POST | `/edge/auth/room-code` | none | `RoomCodeRedeemRequest` | `RoomCodeRedeemResponse` |
| 5 | POST | `/edge/auth/operator-code` | none | `OperatorCodeSignInRequest` | `OperatorCodeSignInResponse` |
| 6 | GET | `/edge/auth/me` | signed-in | — | `EdgeMeResponse` |
| 7 | POST | `/edge/auth/sign-out` | signed-in | `{}` | `EdgeAck` |
| 8 | GET | `/edge/local/cases` | signed-in | — | `EdgeLocalCasesResponse` |
| 9 | GET | `/edge/local/status` | signed-in | — | `EdgeStatusSnapshot` |
| 10 | GET | `/edge/local/room-codes[?nSesid=]` | box-admin | — | `RoomCodeListResponse` |
| 11 | GET | `/edge/local/room-codes/picker` | box-admin | — | `RoomCodePickerResponse` |
| 12 | POST | `/edge/local/room-codes` | box-admin + case admin | `IssueRoomCodesRequest` | `IssueRoomCodesResponse` |
| 13 | POST | `/edge/local/room-codes/:id/revoke` | box-admin + case admin | `{}` | `RoomCodeRowResponse` |
| 14 | POST | `/edge/local/room-codes/:id/end-access` | box-admin + case admin | `{}` | `RoomCodeRowResponse` |
| 15 | POST | `/edge/local/room-codes/:id/reissue` | box-admin + case admin | `ReissueRoomCodeRequest` | `ReissueRoomCodeResponse` |
| 16 | GET | `/edge/local/operator-code` | box-admin | — | `OperatorCodeStatusResponse` |
| 17 | POST | `/edge/local/operator-code/issue` | online-case-admin | `{}` | `OperatorCodeIssueResponse` |
| 18 | GET | `/edge/local/ops/readiness` | box-admin | — | `ReadinessResponse` |
| 19 | POST | `/edge/local/ops/readiness/run` | box-admin | `{}` | `ReadinessResponse` |
| 20 | GET | `/edge/local/ops/verdict` | box-admin | — | `VerdictResponse` |
| 21 | POST | `/edge/local/ops/verdict/recoveries/:id/dismiss` | box-admin | `{}` | `EdgeAck` |
| 22 | GET | `/edge/local/ops/log` | box-admin | `ConnectivityLogQuery` (query string) | `ConnectivityLogPage` |
| 23 | GET | `/edge/local/ops/log/:id/tries[?before&limit]` | box-admin | — | `ConnectivityLogTriesPage` |
| 24 | GET | `/edge/local/ops/network` | box-admin | — | `NetworkChecksResponse` |
| 25 | POST | `/edge/local/ops/network/run` | box-admin | `{}` | `NetworkChecksResponse` |
| 26 | GET | `/edge/local/ops/box` | box-admin | — | `BoxDetailsResponse` |
| 27 | GET | `/edge/local/ops/diagnostics` | box-admin | — | `application/zip` file |
| 28 | GET | `/edge/local/ops/transmitter` | box-admin | — | `TransmitterStateResponse` |
| 29 | PUT | `/edge/local/ops/transmitter` | box-admin | `TransmitterApplyRequest` | `TransmitterStateResponse` |
| 30 | POST | `/edge/local/ops/transmitter/connect` | box-admin | `TransmitterVersionRequest` | `TransmitterStateResponse` |
| 31 | POST | `/edge/local/ops/transmitter/reconnect` | box-admin | `TransmitterVersionRequest` | `TransmitterStateResponse` |
| 32 | POST | `/edge/local/ops/transmitter/test` | box-admin | `TransmitterTestRequest` | `TransmitterTestResponse` |
| 33 | POST | `/edge/local/ops/reporter-card` | box-admin | `ReporterCardRequest` | `ReporterCardResponse` |

Every box-admin write is audited on the box (who, when, what). Unchanged and out of scope here: the RT routes the
box serves locally or proxies (`/realtimeapi/session/activesession…`, `/feed/pages/…`, the allowlisted mark
routes, §8.2), `/edge/local/metrics` (Prometheus, LAN only) and the cloud ↔ box uplink (`/edge` namespace, §5).

---

## 5. Identity and reachability

### 5.1 `GET /edge-config.json` (D8)

Auth none. Reply `EdgeConfig` (no `msg`: it is a config document).

```ts
{ contractVersion, nEdgeid, boxName, venueLabel, boxHost, roomWifiSsid, timeZone, cloudOrigin, cloudPingUrl,
  pkce: { authorizeUrl, tokenUrl, refreshUrl, callbackPath: '/auth/callback', codeChallengeMethod: 'S256', audience },
  features: { roomCodes, operatorCode, transmitterDialMode, offlineMarks, reporterPasswordOnBox, documentsOnBox } }
```

- Loaded by the edge build's `APP_INITIALIZER` before bootstrap. `EdgeApiService.getConfig()` emits **null** for
  404, a non-JSON body, or anything `isEdgeConfig()` rejects → the "Box not configured" screen (§10 #22). Never a
  sign-in redirect to the wrong box.
- `edgeContractMajor(contractVersion) !== edgeContractMajor(EDGE_CONTRACT_VERSION)` → the FE shows the same screen.
- v1 feature defaults (DR23, 2026-10-01: email sign-in only): `roomCodes` and `operatorCode` **false** (their routes answer 404 `feature_disabled`); `transmitterDialMode` true; `offlineMarks` false (S-D6, DR9
  wording "Marking is paused until the internet is back"); `reporterPasswordOnBox` false (O-12); `documentsOnBox`
  false (S-D19).

### 5.2 `GET /edge/ping` (DR5, DR14, O-16)

Auth none. Reply `EdgePingResponse { msg, nEdgeid, nowMs, timeZone, internet: { state: 'up'|'down'|'unknown', sinceMs }, cloudLinked }`.

The login page decides its message from two probes, each with `EDGE_TIMING.pingTimeoutMs` (4 s). The device probe
decides PKCE vs room code; the box's own `internet` state only picks the wording:

| Box ping | Device → etabella.net (`fetch(cloudPingUrl, {mode:'no-cors', cache:'no-store'})`) | Login shows |
|---|---|---|
| ok | ok | the PKCE sign-in (frame 1) — also when the box itself is offline (the device has its own internet; the box verifies the token offline) |
| ok, `internet.state='up'` | fails | "Your device can't reach etabella.net" + room-code entry inline (frame 2; room Wi-Fi only) |
| ok, `internet.state` `'down'` / `'unknown'` | fails | "Internet unavailable since HH:MM" (from `internet.sinceMs`) + room-code entry inline (frame 2) |
| fails, times out, or `nEdgeid` ≠ config | any | "This device can't reach the venue box properly. On a VPN? …" + room Wi-Fi name (frame 3, DR14) |

The room-code entry in frame 2 exists only while `features.roomCodes` is on. In v1 it is off (DR23): the FE shows no
code entry (only the "can't reach etabella.net" / "Internet unavailable" wording), and `POST /edge/auth/room-code`
answers 404 `feature_disabled` (§6.3).

## 6. Sign-in

### 6.1 Online sign-in (D33, DR5, DR22)

```
box login (email) ──► device probes (§5.2) ──► POST /edge/auth/sign-in/start ──► top-level navigation to authorizeUrl
   ──► etabella.net: password typed there only ──► authapi edge/authorize ──► 302 https://<slug>…/auth/callback?code&state
   ──► FE: parseEdgeCallback(query, storedState) ──► POST <pkce.tokenUrl> {code, verifier, state} (box, forwarded to the cloud) ──► token in localStorage
   ──► GET /edge/auth/me ──► dashboard
```

**`POST /edge/auth/sign-in/start`** — auth none.

- Request `EdgeSignInStartRequest { email, state, codeChallenge, codeChallengeMethod: 'S256' }`. The FE generates the
  PKCE verifier and `state` and keeps them (and the email, DR22 "your email is kept") in `sessionStorage`; the
  verifier never goes to the box.
- Validation: `state` matches `EDGE_STATE_RE`, `codeChallenge` matches `EDGE_PKCE_CHALLENGE_RE`, email is an address.
- Reply `{ msg: 1, authorizeUrl }` where `authorizeUrl = pkce.authorizeUrl + '?' + EdgeAuthorizeQuery`
  (`edge=<nEdgeid>&state=<state>&cc=<codeChallenge>&login_hint=<email>`). The box id comes from the box, never the
  browser. The box audits "sign-in started" (email hashed, no password ever involved).
- Errors (`EdgeSignInStartError`): `invalid_request` 400, `box_not_linked` 503, `box_not_configured` 503,
  `rate_limited` 429.

**`/auth/callback` (FE route, not an API).** Query `EdgeCallbackQuery { code?, state?, error? }`.
`parseEdgeCallback(query, storedState)` (FE service):

| Query | Result |
|---|---|
| `code` + `state` = stored state | `{kind:'code', code, state}` → exchange the code |
| `error=<cloud code>` | `{kind:'error', error, reason: edgeSignInFailureReason(error)}` |
| `code` with a missing / foreign `state` | `{kind:'error', error:'state_mismatch', reason:'link-expired'}` |
| neither | `{kind:'error', error:'invalid_request', reason:'unknown'}` |

DR22 reasons (`EDGE_SIGNIN_FAILURE_REASON`): `cancelled` → "cancelled"; `network` (exchange never reached authapi)
→ "internet dropped"; `code_expired` / `code_used` / `code_invalid` / `verifier_mismatch` / `state_mismatch` → "link
expired"; `no_box_cases` / `user_inactive` → `no-access`; `account_mismatch` → `other-account`; everything else →
`unknown` (no reason shown). The banner keeps the email, "Try again" is primary, and if etabella.net is now
unreachable the room-code panel appears inline.

**Cloud calls (authapi owns them; listed so the box page has one reference).**

`pkce.tokenUrl` and `pkce.refreshUrl` are BOX paths, relative to the box origin: `/edge/auth/cloud/token` and
`/edge/auth/cloud/refresh` (`auth: none`; lan/cloud-signin.ts). The box forwards each call server to server to
`BoxConfig.cloud.tokenUrl` / `cloud.refreshUrl` (never a URL from the request) with `Origin: https://<slug>.<box
domain>`, and returns the cloud's status and JSON body unchanged. The browser therefore makes no cross-origin call to
the cloud, so the sign-in does not depend on CORS headers of the cloud's reverse proxy. The box adds three answers of
its own, in the same `{msg:-1, error, message}` shape: `network` 503 (it could not reach etabella.net), `server_error`
(the cloud answered without JSON) and `invalid_request` 400 (not a small JSON object); a renewal without a `Bearer`
header is `token_invalid` 401 and nothing is sent. The code stays bound to the PKCE verifier that never left the
browser that started the sign-in.

- `POST <pkce.tokenUrl>` body `EdgeTokenExchangeRequest { code, verifier, state }`, no cookies
  (`withCredentials: false`). Reply `EdgeTokenResult { msg: 1, token }`. Errors: authapi's `EdgeCloudSignInError`
  body `{msg:-1, error, message}`.
- `POST <pkce.refreshUrl>` with `Authorization: Bearer <current edge token>`, no body, no cookies. Same reply.
- Expiry, `auth_time` and the case list are read from the token's claims (`EdgeTokenClaims`), so extra fields
  authapi adds never break the box page.

### 6.2 Renewal and expiry (DR11, D24, O-13)

`edgeRenewalPlan(exp, auth_time)` → `EdgeRenewalPlan` (also returned by `/edge/auth/me` as `renewal`):

| Moment | Rule |
|---|---|
| `silentRefreshFromMs` = exp − 2 h | online: refresh silently (authapi `edge/refresh`) |
| `renewNowFromMs` = exp − 60 min | only if the silent refresh failed: quiet "Renew now" (returns to the same line) |
| `offlineWarnFromMs` = exp − 30 min | internet unavailable: "Your sign-in ends at HH:MM. Get a room code from the operator before then." |
| `ceilingAtMs` = auth_time + 24 h | no token reaches past it; `canRenew=false` when exp is within 60 s of it → at expiry sign in on etabella.net again |
| `expiresAtMs` | transcript stays visible under the sign-in / room-code panel, scroll kept; box recording unaffected |

### 6.3 `POST /edge/auth/room-code` (D33, DR5, DR10, O-9)

Auth none (device cookie read, and set on first redemption).

- Request `{ code }` as typed or pasted. The box normalizes with `normalizeEdgeCode` (case-insensitive; spaces and
  dashes ignored; O → 0, I/L → 1). Alphabet: Crockford base32 (`EDGE_CODE_ALPHABET`), 6 characters, shown `K7Q-4M2`.
- 200 `RoomCodeRedeemResponse { msg, status:'ok', token, kind:'room-code', nUserid, name, room: EdgeRoomGrant,
  validUntilMs, untilSessionEnds: true, reentry }` → "Signed in as Daniel Okafor · Room access: Day 3 — Morning."
  with "Not you?".
- Errors (`RoomCodeRedeemError`): `code_wrong` 400 `{attemptsLeft}` · `code_used_elsewhere` 409
  `{usedAtMs, deviceLabel}` · `code_expired` 410 `{sessionName, endedAtMs}` · `code_revoked` 410 · `code_locked` 429
  `{retryAfterSec}` (live countdown) · `invalid_request` 400 (not 6 alphabet characters; the FE validates first) ·
  `feature_disabled` 404 while `features.roomCodes` is off (the v1 default, DR23), before anything is read or audited.
- Every attempt is audited without the code value (outcome, device id, client IP, time).

### 6.4 `POST /edge/auth/operator-code` (DR7, O-10)

Auth none. Request `{ code }`; normalized with `normalizeOperatorCode` (`OPR` prefix optional), shown `OPR-6Z3K-91`.

- 200 `OperatorCodeSignInResponse { msg, status:'ok', token, kind:'operator', name:'Operator', day, validUntilMs
  (23:59:59.999 box time), mintedBy: {nUserid, name} }` → Box settings open for today.
- Errors (`OperatorCodeSignInError`): `code_wrong` 400 `{attemptsLeft}` · `code_expired` 410 (another day's code) ·
  `code_locked` 429 `{retryAfterSec}` · `invalid_request` 400 · `feature_disabled` 404 while `features.operatorCode`
  is off (the v1 default, DR23). No "not issued" error: unknown = wrong.
- Every use is audited. The box holds only today's hash.

### 6.5 `GET /edge/auth/me`

Signed-in. Reply `EdgeMeResponse`:

```ts
{ msg, kind, nUserid|null, name, email|null, validUntilMs, untilSessionEnds, renewal|null,
  isBoxAdmin, isSuperAdmin, roomCodeCaseIds[], rooms: EdgeRoomGrant[], operator: {day, mintedBy}|null, nowMs }
```

`rooms` = the sessions this identity may `join-room` (online: its box cases' sessions; room-code: exactly one;
operator: the minting admin's box cases). Errors: 401 codes only.

### 6.6 `POST /edge/auth/sign-out`

Signed-in, body `{}`, reply `EdgeAck`. The box denylists the presented `jti` until its expiry, closes that identity's
LAN sockets and audits. A room-code binding survives (same device + same code may re-enter while the session runs).
The FE drops its stored token whatever the reply.

## 7. Dashboard and chips

### 7.1 `GET /edge/local/cases` (D32, DR4, DR8, DR15, DR19)

Signed-in. Served from cached assignments (works offline). Reply `EdgeLocalCasesResponse`:

```ts
{ msg, nowMs, today, timeZone, viewer: EdgeIdentityKind, scope: 'case-team'|'room-code'|'operator',
  emptyReason: 'no-cases'|'not-on-box-yet'|null, assignments: { syncedAtMs, fresh }, cases: EdgeLocalCase[] }
EdgeLocalCase = { nCaseid, cCasename, cCaseno, isCaseAdmin, roomAccess: {nSesid, sessionName}|null,
                  rt: { kind, nSesid, sessionName, startAtMs, rank }, sessions: EdgeLocalSession[] }
EdgeLocalSession = { nSesid, nCaseid, cName, dStartDt, tz, startAtMs, isToday, phase: 'not-started'|'live'|'ended',
                     localState, firstLineAtMs, lastLineAtMs, page, totalLines, endedAtMs,
                     nPartNo, nPrevPartSesid, continuedAs: EdgePartPointer|null, cloudUrl }
```

Box rules:

- **Scope (DR19):** box cases ∩ what this viewer may open. Room-code viewer: only the code's case, and only that
  session in `sessions`, with `roomAccess` set (tag "Room access · <session>", title "Your room access").
- **RT button (`rt.kind`, DR4, DR8):** `live` if any session's phase is `live` → full-width card "Open realtime ·
  Live" (meta "Day 3 — Morning · started 10:02 · page 41" from `firstLineAtMs`, `page`); else `next-today` (a session
  today not started, with a start: earliest one) → "RT · Starts 10:00"; else `today-not-started` (today, no start
  time) → "RT · Today, not started"; else `other` → "RT". `rank = EDGE_CASE_RT_RANK[kind]`; `cases` arrive sorted by
  rank, then by `rt.startAtMs`, then by name. No filler cards.
- **Phase:** `not-started` until the first line; `live` from the first line (a frozen uplink, D19, is still live in
  the room); `ended` once SESSION_END is journaled.
- **Empty (`cases: []`):** `no-cases` when the assignments are fresh (`fresh` = synced since the start of today, or
  the cloud reachable now) → "No hearings on this box today" + "Cases appear when an admin assigns them to
  <boxName> on etabella.net."; `not-on-box-yet` otherwise → "Session details aren't on this box yet" + "Ask the
  operator…" (DR15: never a false "No hearings today").
- Non-RT case actions are not represented: the box dashboard hides them (D32).

### 7.2 `GET /edge/local/status` (DR6)

Signed-in. Reply `EdgeStatusSnapshot { msg, nowMs, heartbeatMs: 5000, staleAfterMs: 15000, internet, sessions:
EdgeSessionStatus[], operator? }`. `sessions` are those the viewer may open; `operator` only for box admins.
The dashboard polls it every `heartbeatMs`; the RT page uses the socket (§9). Shapes: §9.1.

## 8. Box settings

### 8.1 Room codes (D33, DR10, §4.10)

Every route of this section answers 404 `feature_disabled` while `features.roomCodes` is off (the v1 default, DR23),
before any sign-in or box-admin check. The rest of the section applies to a box that turns room codes on.

- **`GET /edge/local/room-codes[?nSesid]`** → `RoomCodeListResponse { msg, rows: RoomCodeRow[], unusedCount }`,
  newest first. A row: `{ id, nSesid, nCaseid, sessionName, caseName, person: {nUserid, name, role}, status:
  'unused'|'used'|'revoked'|'ended'|'expired', issuedAtMs, issuedBy: EdgeActor, usedAtMs, deviceLabel, revokedAtMs,
  endedAtMs, can: {revoke, endAccess, reissue} }`. The code itself is never listed. "N unused codes" =
  `unusedCount`.
- **`GET /edge/local/room-codes/picker`** → `RoomCodePickerResponse { msg, sessions: RoomCodePickerSession[],
  operatorNameRequired }`; a session: `{ nSesid, nCaseid, sessionName, caseName, startAtMs, phase, canIssue,
  blockedReason: 'not-case-admin'|'session-ended'|null, people: [{nUserid, name, role, hasUnusedCode, hasAccess}] }`.
  The control is disabled with the reason (DR10).
- **`POST /edge/local/room-codes`** body `IssueRoomCodesRequest { nSesid, userIds (1–50), operatorName? }` →
  `IssueRoomCodesResponse { msg, nSesid, sessionName, caseName, results: RoomCodeIssueResult[] }` in request order;
  each result is `{status:'issued', nUserid, issued: {id, person, code, display, replacedId}}` or `{status:'refused',
  nUserid, error: 'not_on_case_team'|'user_not_found'}` ("one row per person"). A person's earlier unused code for the
  session is revoked (`replacedId`). Codes are shown once (read-out card: full name, role, `display`); the FE clears
  the card when the pickers change. Errors: `not_case_admin` 403, `session_not_found` 404, `session_ended` 409,
  `operator_name_required` 400 (operator session, O-10), `invalid_request` 400.
- **`POST …/:id/revoke`** ("Revoke unused code") → `RoomCodeRowResponse { msg, row }`. Errors: `code_already_used`
  409, `not_found` 404, `not_case_admin` 403.
- **`POST …/:id/end-access`** ("End <name>'s room access", confirmed in the UI) → `RoomCodeRowResponse`. The box
  revokes that device's token and closes its LAN sockets at once. Errors: `code_not_used` 409, `not_found`,
  `not_case_admin`.
- **`POST …/:id/reissue`** body `{ operatorName? }` ("Re-issue") → `ReissueRoomCodeResponse { msg, issued, row }`.
  Revokes the old code if unused; a used code's device keeps access (end-access is separate). Errors:
  `session_ended`, `operator_name_required`, `not_found`, `not_case_admin`.
- Codes expire with their session (`expired`), and code hashes are purged with the session data (§10 #19).

### 8.2 Operator code, box side (DR7, O-10)

Minting happens in the cloud (RT Production "Venue box ready", or this relay); the box stores only a day-expiring
hash, delivered with its assignments. Both routes here (and `POST /edge/auth/operator-code`, §6.4) answer 404
`feature_disabled` while `features.operatorCode` is off (the v1 default, DR23), before any sign-in check.

- **`GET /edge/local/operator-code`** → `OperatorCodeStatusResponse { msg, day, issued, issuedAtMs, mintedBy,
  validUntilMs, usesToday }`. Never the code.
- **`POST /edge/local/operator-code/issue`** (online-case-admin; body `{}`) → `OperatorCodeIssueResponse { msg, code,
  display, day, validUntilMs, mintedBy, replacedEarlier }`, shown once ("Print or save it now … Valid until 23:59
  today"). The box relays to the cloud, stores the new hash, returns the plaintext once and keeps nothing else.
  Errors: `offline` 503, `online_sign_in_required` 403, `not_case_admin` 403, `cloud_refused` 502.

### 8.3 "Ready for today" (DR15)

`GET /edge/local/ops/readiness` (last results) · `POST /edge/local/ops/readiness/run` (re-run; replies when done,
≤ ~10 s; also pulls assignments when online) → `ReadinessResponse { msg, day, checkedAtMs, running, landing,
firstLiveAtMs, items: ReadinessItem[7 or 8], needAttention, total }`.

`landing` is true until the day's first session goes live: Status opens on the checklist while true, then the verdict
takes over. Each item: `{ key, ok, level: 'ok'|'warn'|'bad', detail, action: {kind, primary, href}|null }`.

| `key` (order) | `detail` | ok when | not ok → `level`, `action` |
|---|---|---|---|
| `box-linked` | `{linked, lastCloudContactAtMs, failure}` | confirmed identity, cloud seen today | bad · `run-checks-again` (or `download-diagnostics` for `revoked` / `quarantined`) |
| `sessions-today` | `{count, sessions[{nSesid, sessionName, caseName, startAtMs}], assignmentsSyncedAtMs}` | count ≥ 1 | warn · `open-rt-production` (href: RT Production) |
| `team-lists` | `{people, cases, syncedAtMs}` | rosters for every box case synced today | warn · `run-checks-again` |
| `transmitter-connected` | `{state, mode}` | `state` ∈ connected-no-session, live, quiet | bad · `open-transmitter` ("Set up transmitter") |
| `etabella-reachable` | `{internet, reachable, sinceMs}` | reachable | bad · `open-network-checks` |
| `operator-code-issued` | `{issued, issuedAtMs, mintedByName}` | issued for today | warn · `issue-operator-code` (primary) for an online case admin, else `open-rt-production` |
| `disk-free` | `{freeMB, minFreeMB}` | ≥ 20 GB (`EDGE_DISK_READY_MIN_MB`) | warn ≥ 10 GB, else bad · `download-diagnostics` |
| `clock-in-sync` | `{synced, offsetMs}` | synced, \|offset\| < 1 s | warn < 5 s, else bad · `run-checks-again` |

"2 of 7 need attention" = `needAttention` of `total` (7 checks; 8 only with `features.operatorCode` on — DR23).

### 8.4 Verdict (DR12, DR16)

`GET /edge/local/ops/verdict` → `VerdictResponse { msg, checkedAtMs, running, overall: 'ok'|'problem'|'critical',
problems: VerdictProblem[], recoveries: VerdictRecovery[], logFilterDefault }`.
`POST /edge/local/ops/verdict/recoveries/:id/dismiss` ("Done") → `EdgeAck`.

**Ranking (`VERDICT_KINDS`, worst first; every problem stays listed):**

| rank | kind | severity | `detail` | typical `actions` |
|---|---|---|---|---|
| 0 | `recording-failed` | critical | `{reason: 'disk-full'|'io-error'|'journal-corrupt', lastSafe: {page, line, atMs}}` | download-diagnostics |
| 1 | `box-not-linked` | bad | `{failure, lastLinkedAtMs}` | run-checks-again |
| 2 | `disk-low` | bad | `{freeMB, minFreeMB}` | download-diagnostics |
| 3 | `recovering` | warn | `{startedAtMs, progressPct}` — `progressPct` is always `null` in v1 (the journal replay reports no progress); the FE words it "Recovering after a restart" without a percentage | — |
| 4 | `history-refused` (D19; MR-4: also a corrupt journal RECOVER cannot repair) | bad | `{refusedAtMs, splitDone}` | split-to-cloud-info |
| 5 | `feed-stopped` | bad | `FeedStoppedIncident` (below) | reconnect (dial, link down), open-transmitter, show-to-reporter (listen), split-to-cloud-info (from 5 min) |
| 6 | `internet-unavailable` | bad | `{sinceMs, pendingPages, lagSec}` | run-checks-again |
| 7 | `clock` | warn | `{synced, offsetMs}` | run-checks-again |

`problems` are sorted with `sortVerdictProblems` (rank, then oldest first). A problem: `{ id (stable), kind, rank,
severity, sinceMs, nSesid, sessionName, detail, hints: VerdictHint[], actions: VerdictAction[{kind, primary,
stateVersion, nSesid}] }`. `hints` are keys the FE words ("Check Eclipse output is still started on the reporter's
laptop.", "Check the cable between the reporter's laptop and the transmitter switch.").

**Feed drop** — `FeedStoppedIncident { feedStoppedAtMs, gapFromMs, gapToMs|null, lastLine: {page, line, atMs},
resendFromMs, supportAlertedAtMs, splitOfferedFromMs, mode, peer }`: "Feed stopped 4 min 12 s ago", "Last line
10:31:05 · page 41, line 18", "Possible gap 10:31:05 → now. Ask the reporter to resend from 10:31.", "Support alerted
10:33", and from `splitOfferedFromMs` (+5 min) "an eTabella admin can move the hearing to direct cloud".
`resendFromMs` = `gapFromMs` floored to the minute.

**Reconnect** — `VerdictRecovery { id, kind:'reconnected', nSesid, sessionName, reconnectedAtMs, gapFromMs,
gapToMs, resendFromMs }` stays (green) until dismissed.

`overall`: `critical` if any critical problem, `problem` if any other, `ok` if none. The verdict is **red** while a
`critical` or `bad` problem is listed; `logFilterDefault` is then `'problems'`, else `'all'` (DR12).

### 8.5 Connectivity Log (D34, DR12)

`GET /edge/local/ops/log?filter&day&q&before&after&limit` → `ConnectivityLogPage { msg, filter, day, rows, nextBefore,
newest, days }`.

- `filter`: `all` | `problems` (`row.problem`) | `transmitter` (`source='transmitter'`) | `cloud` (`source='cloud'`).
  `day`: YYYY-MM-DD, default today; `days` lists days with rows ("Today ▾"). `q`: case-insensitive text. `limit`
  1–200, default 50.
- Rows are newest first. `before=<nextBefore>` → older page. `after=<newest>` → rows **created or updated** since
  (the "N new events" poll while the list is paused on scroll; an updated retry row comes back with the same `id`).
- Row: `{ id, atMs, updatedAtMs, event: 'attempt'|'retrying'|'connected'|'disconnected'|'error'|'feed'|'success',
  source, code: ConnectivityLogCode, problem, nSesid, sessionName, peer, actor, data: {lines?, pages?, durationMs?,
  lagSec?, error?, protocol?}, retry: {sinceMs, tries, lastError, active}|null }`.
- **Retries collapse** into one row (`event:'retrying'`, `retry.tries` counting up, `updatedAtMs` moving) —
  "Reporter network 192.168.20.31:8080 · refused · retrying since 10:31:08 · 63 tries". "Show tries":
  `GET /edge/local/ops/log/:id/tries?before&limit` → `ConnectivityLogTriesPage { msg, rowId, rows: [{atMs, error,
  peer}], nextBefore }`.
- Empty day: `rows: []`, `newest: null` → "No events today". **There is no delete route.**

### 8.6 Network, this box, diagnostics

- `GET /edge/local/ops/network` · `POST /edge/local/ops/network/run` ("Run checks again") →
  `NetworkChecksResponse { msg, running, checkedAtMs, checks: NetworkCheck[] }`, one per `NETWORK_CHECK_KEYS`:
  `box-room-address` ("Address for people in the room"), `box-transmitter-address` (the box on the reporter
  network), `internet`, `etabella-reachable` (DR16: "Internet unavailable" vs "Can't reach eTabella"), `dns`,
  `clock-offset`. Each `{ key, ok, level, value, ms }`.
- `GET /edge/local/ops/box` → `BoxDetailsResponse { msg, nEdgeid, boxName, boxLabel, version, parserVer,
  backendCommit, feCommit, nowMs, timeZone, uptimeSec, clockOffsetMs, clockSynced, diskFreeMB, diskTotalMB, journalMB,
  certDaysLeft, upsOnBattery, cloudRootShort }` — the "This box" tile, "Technical details" (spec ids and hashes stay
  behind it, DR16) and the login screen's admin-only "Box details" (DR5).
- `GET /edge/local/ops/diagnostics` → a file: `Content-Type: application/zip`, `Content-Disposition: attachment;
  filename="etabella-box-<boxLabel>-<YYYYMMDD-HHmm>.zip"`. Logs, status, readiness / network results, versions,
  Connectivity Log; never transcript text, tokens, hashes or Eclipse logins. Audited. The FE fetches it as a Blob
  (`downloadDiagnostics()`), because the bearer token must ride on the request.

### 8.7 Transmitter (D34, DR13, DR16)

Modes (`TransmitterMode`), in Eclipse's own setting names (DR16): **`dial`** = Eclipse output **"Wait for
connection"** (Eclipse is the server; the box connects to the reporter's laptop at host:port, protocol
`bridge`|`caseview`, reconnecting every 3 s); **`listen`** = Eclipse output **"Connect to server"** (the reporter
types the box address, port 2500 and the session login).

**`GET /edge/local/ops/transmitter`** → `TransmitterStateResponse { msg, stateVersion, settings|null, applied: {atMs,
by}|null, link: TransmitterLinkStatus, sessions: TransmitterSessionOption[], listen: {boxTransmitterAddress, port},
actions: {connect, testOnly, reconnect} }`. `settings: null` = first run (mode question shown, no address yet).

`TransmitterSettings { mode, protocol, host, port, autoReconnect, receivingSesid }` — the last four fields matter in
dial mode only; `receivingSesid: null` = automatic (the one live session bound to the box).

**State version.** `stateVersion` increases when the applied settings change **and** when the link's connection
changes (connect, disconnect, new connection) — not on bytes or lines. Every write names the version it read; a
stale one gets `state_changed` 409 `{stateVersion}` → "The connection changed while you were editing. Review again."

**`PUT /edge/local/ops/transmitter`** ("Apply…"; edits are a draft until applied) body `TransmitterApplyRequest
{ stateVersion, settings, confirmInterrupt }`:

1. stale version → `state_changed` 409;
2. `validateTransmitterSettings` fails → `invalid_settings` 400 `{fields}` (`required` | `ipv4` | `port-range` |
   `unknown-session`);
3. the link is up and `transmitterInterruptingChanges(current, next)` is not empty (a mode change; in dial mode a
   change of protocol, host, port or receiving session, or auto-reconnect turned **off**) and `confirmInterrupt` is
   false → `confirm_required` 409 `{guard: TransmitterGuard {session, lastLineAtMs, peer, now, after, changes,
   stateVersion}}`. The FE shows the one guard dialog (focus starts on Cancel), and on "Disconnect and switch" resends
   with `confirmInterrupt: true` and the **same** version — the box re-checks it on confirm;
4. otherwise apply, (re)start the link as the new settings require, audit, reply 200 with the new state.

**`POST …/transmitter/connect`** body `{stateVersion}` — the one primary "Connect": start the dial link with the
applied settings. Errors: `state_changed`, `not_dial_mode`, `not_configured`, `already_connected`.

**`POST …/transmitter/reconnect`** body `{stateVersion}` — "Reconnect", offered only in the verdict while the link is
down. Errors: `state_changed`, `not_dial_mode`, `link_up`.

**`POST …/transmitter/test`** body `TransmitterTestRequest { protocol, host, port }` — "Test only" with the **draft**
address; nothing is applied. Offered (`actions.testOnly`) only while nothing is connected or retrying; refused with
`test_refused_busy` 409 `{linkState}` while connected, retrying or capturing, so it can never take over a live
socket. Reply `TransmitterTestResponse { msg, result: 'data'|'connected-no-data'|'refused'|'timeout'|'unreachable'|
'protocol-mismatch', protocolSeen, bytes, durationMs }` (≤ 10 s).

All four writes are audited ("Applied 09:12 by P. Shah" comes from `applied`).

**Reporter address set on etabella.net (cloud reporter settings).** A venue session may carry the reporter machine's
address, typed in the cloud's "Start realtime session" dialog: `reporter: { host, port } | null` on each session of the
assignment snapshot and on `c.assign {op:'upsert'}` (the SP columns `cReporterIp` / `nReporterPort` are read too).
`host` is an IPv4 dotted quad, `port` 1–65535; anything else, or only one of the two, reads as `null` (the session is
still delivered). `null` changes nothing: the reporter's Eclipse connects to the box and logs in, as above. With an
address the box switches to dial mode **by itself**, through the same apply as step 4 (`applied.by` =
`{ nUserid: null, name: 'etabella.net (session settings)', via: 'online' }`, audit `transmitter-apply`, Connectivity Log
`tx-settings-applied`, a new `stateVersion`), with `settings = { mode: 'dial', protocol, host, port, autoReconnect:
true, receivingSesid: <that session> }`:

- **Which session:** the transmitter is box-wide, so the box follows ONE session at a time, the **owner**, chosen
  among the stored sessions that are listed, not deleted, not ended or ending and whose arm was not refused, WITH OR
  WITHOUT an address: (1) the session whose transmitter connection is up now (logged in or dialed, even before its
  first line); else (2) the session that has started and was active less than 6 hours ago (the most recent), so a link
  that drops mid-hearing does not hand the box to another session; else (3) among the sessions not started yet, the
  latest one whose start time has passed, else the one that starts first (no start last, then `nSesid`); a started
  session nobody ended, idle for 6 hours or more, comes last. The owner comes from the stored sessions, and nothing is
  applied before the owner itself is armed (arm order after a restart never decides). The owner is re-read on every
  assignment, arm, end and link drop, and every 15 seconds.
- **The owner carries an address** and pins a protocol (`cProtocol` `B` → `bridge`, `C` → `caseview`): dial mode
  for it. **The owner carries none** (its reporter's Eclipse connects to the box): nothing is applied for any other
  session; that session's `cloudReporterStatus()` is `waiting` / `held-by-session` with `heldBy` = the owner.
- **Once per value:** the box remembers what it took from the cloud (`nSesid|host|port|protocol`) and never applies the
  same value twice, so a connection a person sets at the box afterwards stays; a person's Apply while a session carries
  an address counts the same. A changed address, port or protocol is a new value and is applied again.
- **Never over a connection worth keeping:** a change that would close a connection waits (`waiting` / `feed-live`)
  while a reporter's Eclipse is logged in to the box (even before its first line) or lines have arrived over the
  connection the box dialed. A dialed connection that never carried a line may be closed.
- **Refused** (the connection is left as it is, one `CLOUD_REPORTER_REFUSED` alert per value): dial mode switched off
  (`features.transmitterDialMode`), a host outside the box's transmitter network (S-D14), or no pinned protocol.
- **When the cloud's settings are over** (the owner carries no address, or no session is open, or the owner's address
  is refused while settings the cloud applied for another session are still in force) and the settings are still
  exactly the ones taken from the cloud: the settings that were in force before them return (a person's dial setup,
  else the default listen mode), and the remembered value is cleared. Settings a person changed at the box are left
  alone.
- **A remembered value is forgotten** when no open session carries it any more and a person changed the connection
  since: the same address typed again on etabella.net is then a new value.

The localhost box console shows it: a "Reporter" column per session (the address, or "Connects to this box") and, in
the reporter connection card, "Set on etabella.net for <session>", the refusal in plain words, or "Waiting: <session>
is still open and holds the reporter connection. End it on etabella.net, or set the connection here."

**`POST /edge/local/ops/reporter-card`** body `{ nSesid }` — "Show to reporter" (DR16), full screen, large type.
POST because opening it is logged. Reply `ReporterCardResponse { msg, nSesid, sessionName, caseName, serverAddress,
port, username, password: null, passwordSource: 'rt-production', mode, openedAtMs }`. Build default O-12: the box
holds only the scrypt hash, so the card says "Use the password shown in RT Production when the session was created"
(a string `password` only if `features.reporterPasswordOnBox` is turned on later). Errors: `session_not_found` 404.

### 8.8 RT page data routes (spec §8.2, `src/lan/rt-data/`)

The RT page keeps calling the cloud paths it calls on etabella.net; the box answers a fixed table
(`RT_ROUTES` in `rt-routes.ts`; exact method + path, case-insensitive, one optional trailing slash; paths with `%`,
`\`, dot or empty segments never match). Every route needs a box sign-in; scope is DR19 (`canSeeCase` /
`canOpenSession`). Anything not in the table keeps answering 403 `use_cloud`.

| Kind | Routes | Offline / room-code |
|---|---|---|
| Local | `realtimeapi/session/getSessionsByCaseId`, `getlivesessionbycaseid`, `activesession`; `coreapi/case/caseinfo`; coreapi pickers (`common/getcode`, `common/myteamusers`, `contact/getcontactlist`, `workspace/tasks/list`, `comments/grid`, `common/getannotations`) answer `[]` | served from state |
| Local while the kernel holds the session, else proxied | `session/activesession/detail`, `session/realtimedatabysesid`, `feed/pages/total`, `feed/pages/data` (`bTranscript=true` always proxied) | cloud's "no data" body + header |
| Proxied read, cached per user (15 s fresh, ≤ 12 h stale) | `marknav/all`, `marknav/quickmarklist`, `feed/annotations`, `doclink/docdetail`, `issue/issuelist_V2` | stale copy (`X-Edge-Stale`) else empty + `X-Edge-Offline`; room-code / operator: empty + `X-Edge-Reauth` |
| Proxied read, never empty | `factsheet/` detail, issues, contacts, links, shared, tasks | stale copy else 503 `offline`; room-code / operator 503 `reauth` |
| Proxied write, online only | `fact/*` (insertHighlights, deleteHighlights, insertquickfact, quickfactupdate, insertfact, addhighlight), `factsheet/save`, `factsheet/delete`, `doclink/insertdoc`, `doclink/docdelete`, `issue/*` (insert, update, delete, sequence) | 503 `reauth` → 403 `use_cloud` (out-of-scope ids) → 503 `offline` |

Headers on box answers: `X-Edge-Source` (`box` / `cloud` / `cache`: the box's own state, proxied, the box's cached
copy; `RT_SOURCES`), `X-Edge-Offline: 1`, `X-Edge-Reauth: 1`,
`X-Edge-Stale: <seconds>`. A JSON array body cannot carry a flag, so the FE reads "marking paused" from
`edge-status` (§9.1), and the headers are for diagnostics.

Cloud answers: 2xx JSON passes through (a write clears that user's cached reads); cloud 401 → 502 `cloud_refused`
(the box never signs a user out because of the cloud); other 4xx JSON passes through; 5xx, non-JSON, redirect or
oversize → 502 (reads serve a stale copy first); unreachable → reads as offline, writes 503 `offline`; too many
calls in flight → 429. Only `cloud.realtimeApiUrl` on `cloud.origin` is ever contacted (otherwise the proxy is
disabled), the forwarded path comes from the table, the query is rebuilt (repeated keys refused),
`nUserid`/`nMasterid` are replaced by the caller's id, and only `Authorization: Bearer <edge token>` is sent.
Limits: read 8 s / write 15 s; reply 8 MiB read / 1 MiB write; body 1 MiB (over it: 413 `payload_too_large`, the
same code the box's body parser answers above its own limit); query 8 KiB (over it: 400 `invalid_request`).

Known gaps (v1): session lists show box sessions only (no cloud merge); coreapi pickers are empty on the box;
proxied mark calls get 502 until realtime-server accepts edge tokens (step 8 middleware); a write that times out
may still have been applied (Phase 4 `cClientId` idempotency).

---

## 9. LAN socket (box gateway, `/socket.io`)

Handshake `auth: { token }` (same token as HTTP). `query.nUserid` is ignored; `join-room` (`S<nSesid>`) is checked
against the cached roster (a room-code token reaches only its session). Unchanged from the cloud gateway and not
redefined: `join-room`, `leave-room`, `fetch-data` → `previous-data` + `previous-data-end` (newest first, D11/D12),
`message`, `feed-refresh-data`, `realtime-events`, `on-notification` (`cStatus` 'R' at arm, 'E' at end).

The two box events have their own names, so they never trigger the feed store's `realtime-events` refetch.

**How the box ends a socket.** A sign-out on the box, an ended room access, a user cut-off and a lapsed sign-in
(operator day, room-code cap, D24 ceiling) end it with `io server disconnect` — final: socket.io-client does not
retry. A token the CLOUD revokes is different: etabella.net revokes the token a silent renewal (D24) replaced exactly
as it revokes one that was signed out, and only the device knows which. So an online socket whose token the cloud
lists — or whose token a roster re-check finds revoked — adopts a newer token of the same sign-in (same user, same
`auth_time`) that the box has verified since (the device used its renewed token on any box route), and keeps the
rooms it may still open; otherwise only its transport is closed (`transport close`): the client reconnects at once with the token its
`auth` callback returns now — a renewed token is accepted, a revoked one is refused at the handshake
(`connect_error` `unauthorized`, `token_revoked`), which the FE treats as final. Either way the revoked token reads
nothing more. A socket past its `exp` but inside the D24 ceiling stays open (D28); a roster change re-derives its
cases and admin flags from the cached roster all the same.

**Box boot (restart, power cut).** The box serves its LAN socket before its journal replays have committed, and a
device that reconnects then (socket.io retries a restart's 'transport close' by itself; the FE re-joins and
re-fetches on `connect`) is answered at once with what the box holds: an empty snapshot for a session still
replaying (`previous-data-end` only), the full snapshot for one already recovered or armed with no line yet. Once
that session's replay commits, the box sends its room `realtime-events {type:'feed-resync', nSesid, rev}` — the
existing event, with its existing meaning: refetch the snapshot (the FE spreads the refetch over 0–3 s). A room
joined before the box's LAN service started gets the same event once it does. The FE needs no change: a room device
present at any moment of the boot ends with the whole transcript without a new line arriving. A session the box does
not hold answers as before (empty, no resync).

### 9.1 `edge-status` → `EdgeSessionStatus`

Sent to `S<nSesid>` right after `join-room`, on every change, and at least every 5 s (`statusHeartbeatMs`).

```ts
{ nSesid, seq, atMs,
  // cloud-compatible names (spec §9), epoch ms:
  venue: 'online'|'offline'|'catching-up', lagLines, lagSec, since, lastSyncAt, catConnected,
  // LAN only:
  room: { chip, feed, marking, startAtMs, firstLineAtMs, lastLineAtMs, feedStoppedAtMs, internetDownSinceMs, endedAtMs },
  continuedAs: { nSesid, nPartNo, cloudUrl, splitAtMs } | null,
  operator?: EdgeOperatorStatus }            // box-admin sockets only
```

**Feed state** (box): `waiting` (no line yet) · `live` (a line within 2 min) · `quiet` (link up, no line for longer)
· `stopped` (lines received, not ended, transmitter link down) · `ended` (SESSION_END journaled).
**Marking** (v1, S-D6): `paused` while the box's internet is unavailable, else `available`.
**Room chip** = `edgeRoomChip(feed, marking)`, precedence **ended → feed stopped → waiting → offline → quiet → live**:

| `chip` | Words (DR6) | Banner slot (DR9) |
|---|---|---|
| `live` | ● Live in this room | — |
| `waiting` | ○ Waiting for reporter | RT page waiting state "Waiting for the reporter … opens here by itself" |
| `quiet` | ◔ No new lines since HH:MM (neutral) | — |
| `feed-stopped` | ✕ Feed stopped | "No new lines since HH:MM · the operator has been told" |
| `offline` | ! Offline · marking paused | "Internet unavailable since HH:MM. The transcript in this room keeps running. Marking is paused …" then "Back online · marking available" for 5 s |
| `ended` | Session ended HH:MM | "Session ended HH:MM · keep reading; the final transcript comes after publish" |

**Operator status** (`EdgeOperatorStatus { checkedAtMs, stale, transmitter: TransmitterLinkStatus, cloud:
CloudLinkStatus, problems, readinessToDo }`), the three-segment operator chip:

| Segment | Source | States |
|---|---|---|
| device → box | client (`edgeDeviceLinkState`, §10.1) | `connected` · `lost` · `stale` ("Status unavailable · last checked HH:MM") |
| transmitter → box | `transmitter.state` | `not-set-up` · `waiting` · `connecting` (`attempt` → "Connecting (try 3)") · `connected-no-session` ("Connected · no live session yet …", DR8) · `live` · `quiet` (`quietLevel` neutral ≤ 10 min, then warn) · `disconnected` |
| box → cloud | `cloud.state` | `synced` (cloud-confirmed only) · `behind` (neutral blue, `lagSec` → "18 s behind") · `internet-unavailable` · `cant-reach-etabella` · `sync-refused` · `not-linked` |

The transmitter peer IP is in this admin-only object only. `stale` is the box's own flag (status older than 15 s);
the FE also marks status stale when none arrived for 15 s. Screen readers: one polite announcement per **chip
state change**, never per counter tick.

### 9.2 `edge-session` → `EdgeSessionEvent`

Sent to `S<nSesid>`; `seq` is shared with `edge-status` (drop anything at or below the last seen):

- `{type:'first-line', nSesid, seq, atMs}` — the DR8 waiting state opens the transcript by itself, only on the page
  of the session the person chose (lines still arrive by `message`);
- `{type:'ended', nSesid, seq, endedAtMs}` — DR9 ended banner (legacy `on-notification {cStatus:'E'}` still sent);
- `{type:'split', nSesid, seq, continuedAs}` — DR9 "This hearing continues on etabella.net as **Part 2**" + "Open
  Part 2" (`continuedAs.cloudUrl`). While the box itself is unreachable the FE cannot receive this; it asks the cloud
  (see §12).

## 10. Client-side rules

### 10.1 Box unreachable (DR9)

`edgeDeviceLinkState({ socketConnected, lastBoxContactAtMs, lastStatusAtMs, statusMarkedStale, nowMs })`:

- the LAN socket drops → the FE pings `/edge/ping` every 5 s (`pingEveryMs`, 4 s timeout);
- **`lost`** once the socket is down **and** nothing from the box (any HTTP reply, socket event or ping) for 10 s
  (`boxUnreachableAfterMs`) → banner "Can't reach the venue box · retrying · your lines stay on screen"; after
  60 s lost (`openCloudAfterMs`) add "Open on etabella.net" (`EdgeLocalSession.cloudUrl`); after a split also the
  Part 2 pointer;
- **`stale`** when connected but the newest status is older than 15 s or flagged stale;
- else **`connected`**. The banner clears on the next socket connect or successful ping.

### 10.2 Thresholds (`EDGE_TIMING`)

`statusHeartbeatMs` 5 s · `statusStaleAfterMs` 15 s · `liveLineWindowMs` 2 min · `quietNeutralMs` 10 min ·
`splitOfferAfterMs` 5 min · `backOnlineBannerMs` 5 s · `boxUnreachableAfterMs` 10 s · `openCloudAfterMs` 60 s ·
`pingTimeoutMs` 4 s · `pingEveryMs` 5 s · box internet hysteresis offline after 15 s / online after 10 s.

### 10.3 §9.1 interaction states → contract

| Feature | Loading | Empty | Error | Success | Partial |
|---|---|---|---|---|---|
| Box login | client spinner during §5.2 probes | — | §5.2 table; `parseEdgeCallback` reasons | `/edge/auth/me` | — |
| Room-code entry | client | client | `RoomCodeRedeemError` + extras | `RoomCodeRedeemResponse` | client (errors clear on edit) |
| Operator code | client | — | `OperatorCodeSignInError` | `OperatorCodeSignInResponse` | — |
| Dashboard | client | `emptyReason` | — | `rt.kind='live'` first | `scope='room-code'` + `roomAccess` |
| Room chip | — | `chip='waiting'` | `feed-stopped` | `live` | `quiet`, `offline` |
| Operator chip | — | `not-set-up`, `not-linked` | `disconnected`, `sync-refused`, `stale` | `live`, `synced` | `connecting`+`attempt`, `behind`+`lagSec` |
| RT page | client | `first-line` event | `feed-stopped`, device `lost` | `live`, back online | `offline`, `ended` |
| Sign-in expiry | — | — | `expiresAtMs` | refreshed token | `renewNowFromMs`, `offlineWarnFromMs` |
| Ready for today | `running`, `checkedAtMs=null` | — | item `action` | `needAttention=0` | `needAttention` of `total` |
| Verdict | `running` | — | `problems` | `recoveries` | several `problems`, ranked |
| Connectivity Log | client | `rows=[]` | `logFilterDefault='problems'` | — | `after` poll count; `retry` rows |
| Transmitter form | client | `settings=null` | `invalid_settings.fields` | `applied` | client draft vs `settings` |
| Guard dialog | re-check on confirm | — | `state_changed` | 200 + verdict reconnect | — |
| Room codes | client | `unusedCount=0` | `blockedReason` | `IssuedRoomCode[]` | `results[]` per person |

## 11. Keeping the FE mirror exact

`edge-api.types.ts` is generated: these files concatenated in `index.ts` order, import lines (and the blank line
after them) dropped, leading indentation halved (4 → 2 spaces, the FE style), under a header comment. Nothing else
differs. After changing any contract file, regenerate (run with node from anywhere; adjust the two paths):

```js
const fs = require('fs'), path = require('path');
const BE = '<backend>/apps/rt-edge/src/contracts';
const FE = '<frontend>/src/app/features/edge/api/edge-api.types.ts';
const order = [...fs.readFileSync(path.join(BE, 'index.ts'), 'utf8').matchAll(/export \* from '\.\/([a-z-]+)';/g)].map(m => m[1]);
const reindent = l => { const n = /^ */.exec(l)[0].length; return ' '.repeat(Math.floor(n / 4) * 2 + n % 4) + l.slice(n); };
const body = name => {
  const lines = fs.readFileSync(path.join(BE, name + '.ts'), 'utf8').replace(/\r\n/g, '\n').split('\n'), out = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^import (type )?\{[^}]*\} from '\.\/[a-z-]+';$/.test(lines[i])) { if (lines[i + 1] === '') i++; continue; }
    out.push(reindent(lines[i]));
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
};
// HEADER = the comment block at the top of the current edge-api.types.ts, ending with ' */\n'
const HEADER = fs.readFileSync(FE, 'utf8').replace(/\r\n/g, '\n').split('\n// ===== ')[0].replace(/\n+$/, '\n');
fs.writeFileSync(FE, HEADER + '\n' + order.map(n => `// ===== contracts/${n}.ts =====\n\n${body(n)}`).join('\n'));
```

Contract files must keep single-line `import type { … } from './x';` / `import { … } from './x';` lines and no
other imports (the contract has no dependencies), so the mirror stays a plain concatenation.

## 12. Open items (for the owners named)

1. **authapi `edge/token` / `edge/refresh` reply** (authapi owner): the box page needs only `{ msg: 1, token }`
   and reads everything else from the claims. `contracts.spec.ts` fails if `EDGE_SIGNIN_ERRORS`, the TTL / ceiling /
   lead constants or the PKCE / state regexes drift from `apps/authapi/src/services/auth/edge-token.types.ts`.
2. **Authorize page query** (cloud FE `/auth/edge` owner): this contract names the email parameter `login_hint`
   (beside `edge`, `state`, `cc`).
3. **Assignments payload** (realtime-server `et_rtedge_assignments` / `c.assign` owner): the box needs each team
   member's **name, role and email** and the case name (`cCasename`, `cCaseno`) to fill `me`, the room-code picker,
   the read-out card and the dashboard; spec §4.2 lists only `team:[{nUserid, isCaseAdmin}]`. It also needs the
   operator-code hash for the day and, after a split, Part 2's `nSesid` / `nPartNo` with `op:'end'`. A session's
   `reporter: { host, port } | null` (§8.7) is optional: a cloud that does not send it leaves the box as it was.
4. **Operator-code relay** (realtime-server owner): a cloud endpoint or uplink message for
   `POST /edge/local/operator-code/issue`, minting under the signed-in case admin (O-10, **ask user**: does that
   delegation satisfy D33?).
5. **Part 2 pointer while the box is down** (FE RT page owner): the FE must ask the cloud (edge token, D22-scoped RT
   route) for a session whose `nPrevPartSesid` is this one; no box route can answer when the box is dead.
6. **Room-code users cannot mark in v1** (spec consequence of §8.4 "never forwarded"): the FE disables Mark controls
   for `kind !== 'online'`. Confirm with the user if room-code readers are expected to mark before Phase 4.
7. **O-12 (ask user):** showing the Eclipse password on the reporter card (`features.reporterPasswordOnBox`).

## 13. Tests

- Backend: `npx jest --config package.json apps/rt-edge/src/contracts` (from the backend root) — helpers, error
  statuses, route table, authapi drift.
- Frontend: `npx ng test --watch=false --include='src/app/features/edge/**/*.spec.ts'` (from the FE root) —
  `EdgeApiService` against `HttpTestingController`: every route, method, body and `withCredentials`; config
  fallbacks; ping timeout; every room-code state as a result; transmitter guard / stale version / busy test;
  log paging; diagnostics Blob and file name; `parseEdgeCallback`.
