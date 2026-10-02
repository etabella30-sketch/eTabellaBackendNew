import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, Optional, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes, randomInt, randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Server } from 'socket.io';

import { DbService } from '@app/global/db/pg/db.service';
import { resolveTimezone } from '@app/feed-parse';

import { EdgeRegistryService } from '../../edge/edge-registry.service';
import { EclipseSessionCreateReq, REPORTER_IPV4_RE, REPORTER_PROTOCOL_MESSAGE, reporterKeyGiven, reporterProtocolPinned } from '../../interfaces/session.interface';
import { isUuid } from '../utility/safe-path';

/** A hearing day never streams this long — a route whose session started
 *  earlier is a leftover nobody ended (same window as the frontend's live rule). */
export const ECLIPSE_ROUTE_MAX_AGE_HOURS = 18;

/** Version tag of the encrypted password kept on a route (`passwordEnc`). */
const ECLIPSE_PASSWORD_ENC_VERSION = 'v1';

/**
 * scrypt cost of a venue-box session's route hash (spec §7: 2^15 for new routes). Direct-cloud routes keep
 * node's default (16384) and carry no `scryptN`, exactly as before. 128·N·r bytes = 32 MiB at r = 8, which is
 * node's default maxmem, so every scrypt call that honours a route's N lifts maxmem to fit.
 */
export const EDGE_ROUTE_SCRYPT_N = 32768;
const SCRYPT_MAXMEM = 64 * 1024 * 1024;

/** S-D17: a generated Eclipse password, 16 characters with no look-alikes (0/O, 1/l/I). */
const GENERATED_PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
export const GENERATED_PASSWORD_LENGTH = 16;
/** Spec §4.2 / §7: a typed password for a venue-box session is at least this long. */
export const EDGE_TYPED_PASSWORD_MIN = 12;

export function generateEclipsePassword(length = GENERATED_PASSWORD_LENGTH): string {
    let out = '';
    for (let i = 0; i < length; i++) out += GENERATED_PASSWORD_ALPHABET[randomInt(GENERATED_PASSWORD_ALPHABET.length)];
    return out;
}

/** The venue edge is on (EDGE_ENABLED=1/true); same rule as the edge module (edge.types edgeEnabled). */
function edgeOn(config: ConfigService): boolean {
    const raw = String(config.get('EDGE_ENABLED') ?? '').trim().toLowerCase();
    return raw === '1' || raw === 'true';
}

/**
 * The reporter connection of a venue-box request: the reporter machine's address and TCP port the box dials by
 * itself. Null when neither key was sent (the reporter's Eclipse connects to the box and logs in, as before).
 * One key without the other, or a value the DTO would refuse, is a 400 before anything is created.
 */
export function reporterConnectionOf(body: Pick<EclipseSessionCreateReq, 'cReporterIp' | 'nReporterPort'>): { cReporterIp: string; nReporterPort: number } | null {
    const hasIp = reporterKeyGiven(body?.cReporterIp);
    const hasPort = reporterKeyGiven(body?.nReporterPort);
    if (!hasIp && !hasPort) return null;
    if (!hasIp || !hasPort) {
        throw new BadRequestException('cReporterIp and nReporterPort go together: send both, or neither');
    }
    const cReporterIp = String(body.cReporterIp).trim();
    // A number, or the string of digits a form-encoded body sends (the DTO's rule; no hex, no exponent).
    const port: unknown = body.nReporterPort;
    const nReporterPort = typeof port === 'number' ? port : typeof port === 'string' && /^\d{1,5}$/.test(port.trim()) ? parseInt(port.trim(), 10) : NaN;
    if (!REPORTER_IPV4_RE.test(cReporterIp)) {
        throw new BadRequestException('cReporterIp must be an IPv4 address like 192.168.1.20');
    }
    if (!Number.isInteger(nReporterPort) || nReporterPort < 1 || nReporterPort > 65535) {
        throw new BadRequestException('nReporterPort must be a whole number from 1 to 65535');
    }
    return { cReporterIp, nReporterPort };
}

/** A route of a venue-box session (dormant cloud copy; the box holds the live one). */
export function isEdgeRoute(route: Record<string, any> | null | undefined): boolean {
    return String(route?.feedSource ?? '').trim().toUpperCase() === 'E';
}

/**
 * Which of the given sessions are still live: row exists, not soft-deleted,
 * live status, and started within the window. `dStartDt` is the hearing wall
 * clock, so it is read in the session's own zone (DB zone for legacy rows or
 * an unknown zone name). A missing row simply doesn't come back.
 */
const LIVE_ROUTE_SESSIONS_SQL = `
    SELECT r."nSesid"::text AS "nSesid",
           (r."dDelDt" IS NULL
            AND r."cStatus" IN ('R', 'A', 'L')
            AND (r."dStartDt" IS NULL
                 OR (r."dStartDt"::timestamp AT TIME ZONE COALESCE(
                        (SELECT z.name FROM pg_timezone_names z WHERE z.name = r."cTimezone" LIMIT 1),
                        current_setting('TimeZone')))
                    > now() - make_interval(hours => $2::int))) AS "bLive"
      FROM "RSessionMaster" r
     WHERE r."nSesid"::text = ANY($1::text[])`;

/**
 * The sync state of the sessions behind venue-box ('E') routes (spec §4.1 cSyncState), and whether a split made
 * one of them Part 1 of a hearing that goes on live as a later part (D7: Part 1 is 'S' too; its route normally
 * moved to Part 2, but a failed move leaves it here while Part 2 runs without one). Read only when the route file
 * holds an 'E' route for the case being created, so a file without venue routes costs nothing new.
 */
const EDGE_ROUTE_SYNC_STATES_SQL = `
    SELECT r."nSesid"::text AS "nSesid", r."cSyncState",
           EXISTS (SELECT 1 FROM "RSessionMaster" n
                    WHERE n."nPrevPartSesid" = r."nSesid" AND n."dDelDt" IS NULL
                      AND n."cStatus" IN ('R', 'A', 'L')) AS "bLiveNextPart"
      FROM "RSessionMaster" r
     WHERE r."nSesid" = ANY($1::uuid[])`;

/**
 * cSyncState of a venue session that has ENDED (spec §4.4): 'S' = end requested, waiting for its box's seal (the
 * end body, incl. the dormant route's removal, is deferred until then); 'K' / 'W' / 'F' = sealed (the end body
 * removes the route, or the edge module's retry / sweep does). Its dormant route no longer means "live".
 */
const ENDED_SYNC_STATES: ReadonlySet<string> = new Set(['S', 'K', 'W', 'F']);

/**
 * Home-managed Eclipse 12 sessions on the live realtime server.
 *
 * Creates an immediately-live session on the shared realtime DB
 * (et_realtime_insertupdate_session 'N' + et_realtime_update_running_session)
 * and writes a password-hashed route consumed by the Eclipse feed bridge
 * listening on ECLIPSE_AUTH_PORT. The route file is the durable source of
 * truth for which case a Bridge credential pair feeds.
 */
@Injectable()
export class EclipseSessionService {

    private readonly logger = new Logger(EclipseSessionService.name);
    private eclipseCreateQueue: Promise<void> = Promise.resolve();

    constructor(
        private readonly db: DbService,
        private readonly config: ConfigService,
        @Inject('WEB_SOCKET_SERVER') private ios: Server,
        // The venue-box registry (exported by EdgeModule): pushes a new 'E' session to its box (spec §4.2 step 5).
        @Optional() private readonly edgeRegistry?: EdgeRegistryService,
    ) { }

    /**
     * Calls are serialized so two quick submissions for the same case cannot
     * both pass the case-level duplicate check.
     */
    async createEclipseSession(body: EclipseSessionCreateReq): Promise<any> {
        const operation = this.eclipseCreateQueue.then(() =>
            String(body?.cFeedSource ?? '').trim().toUpperCase() === 'E'
                ? this.createEdgeSessionLocked(body)
                : this.createEclipseSessionLocked(body));
        this.eclipseCreateQueue = operation.then(() => undefined, () => undefined);
        return operation;
    }

    private async createEclipseSessionLocked(body: EclipseSessionCreateReq): Promise<any> {
        // Direct to cloud: today's path. The venue-box keys belong to the 'E' path only; the request that
        // reaches the SP is the one it received before they existed.
        if (body.nEdgeid || body.nHearingOpid) {
            throw new BadRequestException('nEdgeid and nHearingOpid are only for a venue-box session (cFeedSource E)');
        }
        if (reporterKeyGiven(body.cReporterIp) || reporterKeyGiven(body.nReporterPort)) {
            throw new BadRequestException('cReporterIp and nReporterPort are only for a venue-box session (cFeedSource E)');
        }
        const {
            cEclipseUsername,
            cEclipsePassword,
            cFeedSource: _feedSource,
            nEdgeid: _nEdgeid,
            nHearingOpid: _nHearingOpid,
            cReporterIp: _cReporterIp,
            nReporterPort: _nReporterPort,
            ...sessionBody
        } = body;
        // Hearing timezone rides the whole pipeline (DB row, route file, line
        // stamps). An invalid/absent zone silently degrades to the server's.
        const cTimezone = resolveTimezone(body.cTimezone);
        sessionBody.cTimezone = cTimezone;
        await this.pruneDeadEclipseRoutes();
        if (await this.hasActiveEclipseRoute(body.nCaseid)) {
            throw new ConflictException('A realtime session is already live for this case');
        }
        if (await this.hasActiveEclipseCredentials(cEclipseUsername, cEclipsePassword)) {
            throw new ConflictException('These Eclipse credentials are already used by another live session. Use a different username or password.');
        }

        // The public create contract uses permission 'I'; the shared
        // et_realtime_insertupdate_session function inserts on 'N'. Translate
        // at this adapter boundary.
        const res = await this.db.executeRef('realtime_insertupdate_session', { ...sessionBody, permission: 'N' });
        if (!res.success) {
            this.logger.error(`Eclipse session creation failed: ${res.error}`);
            return { msg: -1, value: res.error };
        }
        const created = res.data?.[0]?.[0] ?? {};
        const nSesid = String(created?.nSesid ?? '').trim();
        if (Number(created?.msg) !== 1 || !nSesid) return created;

        const createdCaseId = String(created?.nCaseid ?? body.nCaseid).trim();
        try {
            const activated = await this.db.executeRef('realtime_update_running_session', {
                nSesid,
                cUnicuserid: body.cUnicuserid,
                dDate: body.dStartDt,
            });
            if (!activated?.success) {
                throw new Error(activated?.error || 'the session could not be marked as running');
            }
            await this.writeEclipseRoute({
                nSesid,
                nCaseid: createdCaseId,
                cName: body.cName,
                username: cEclipseUsername,
                password: cEclipsePassword,
                nLines: body.nLines,
                cTimezone,
            });
        } catch (error) {
            this.logger.error(`Eclipse session activation failed for session ${nSesid}: ${error?.message ?? error}`);
            try {
                await this.db.executeRef('realtime_insertupdate_session', { nSesid, permission: 'C' });
                await this.removeEclipseRoute(nSesid);
            } catch {
            }
            throw new InternalServerErrorException('The Eclipse route could not be registered');
        }

        try {
            this.ios["server"].emit('on-notification', { msg: 1, nSesid, nCaseid: createdCaseId, cStatus: 'R' });
        } catch (error) {
        }

        return {
            ...created,
            msg: 1,
            nSesid,
            nCaseid: createdCaseId,
            cName: body.cName,
            cEclipseUsername,
            cHost: this.config.get<string>('ECLIPSE_FEED_HOST') || '46.202.166.124',
            nPort: Number(this.config.get<string>('ECLIPSE_AUTH_PORT')) || 2500,
        };
    }

    /**
     * Spec §4.2 "Create, cloud-first" for a venue-box session (cFeedSource 'E'):
     *  1. the same SP pair as a direct session ('N', then running), each with a per-session cUnicuserid
     *     `sess:<uuid>` (S-D10), so the running-session SP's sibling close never ends another session;
     *  2. et_rtedge_session_bind: cFeedSource 'E', bEverEdge, epoch 1, cSyncState 'L', cParserVer (the box's), and
     *     the optional reporter connection (cReporterIp + nReporterPort: the box then dials the reporter's machine
     *     by itself; they reach the box in its assignment as `reporter`, EdgeRegistryService.assignments). A request
     *     with a reporter connection must pin cProtocol ('B' or 'C'), else it is a 400 before anything is created;
     *  3. the DORMANT route: feedSource 'E', nEdgeid, epoch 1, scryptN 2^15 (the cloud listener holds a direct
     *     stream that matches it, never parses it; the reveal keeps working);
     *  4. on-notification 'R' as today, then EdgeRegistryService.pushSessionUpsert so a connected box arms at
     *     once (best effort, not awaited; the box's hello pull is the guarantee).
     * The answer carries the box's LAN address as cHost / nCatPort as nPort, edgeOnline, edgeReady false, the
     * stored reporter connection (cReporterIp / nReporterPort, null when none was given), and a
     * generated password (S-D17) exactly once when none was typed. Any failure after the insert ends the new
     * session (SP 'C') and removes its route, as the direct path does; a failure after the bind first undoes
     * the bind (unbindFailedVenueSession). Refused while the edge is off
     * (EDGE_ENABLED, the rollback switch of spec §4.8).
     */
    private async createEdgeSessionLocked(body: EclipseSessionCreateReq): Promise<any> {
        if (!edgeOn(this.config)) {
            throw new ServiceUnavailableException('Venue boxes are switched off on this server (EDGE_ENABLED). Create the session direct to cloud.');
        }
        const nEdgeid = String(body.nEdgeid ?? '').trim().toLowerCase();
        if (!isUuid(nEdgeid)) {
            throw new BadRequestException('A venue-box session needs the box (nEdgeid)');
        }
        const typed = body.cEclipsePassword;
        const generated = typed === undefined || typed === null || typed === '';
        if (!generated && String(typed).length < EDGE_TYPED_PASSWORD_MIN) {
            throw new BadRequestException(`The Eclipse password must be at least ${EDGE_TYPED_PASSWORD_MIN} characters, or leave it empty to have one generated`);
        }
        const cEclipsePassword = generated ? generateEclipsePassword() : String(typed);
        // Both keys or neither (400 otherwise, before anything is created); null = the reporter connects to the box.
        const reporter = reporterConnectionOf(body);
        // The box connects to a reporter address only for a session that pins its protocol (it refuses the address
        // otherwise, 'protocol-unknown', and nobody at the create would know). Without an address nothing changes.
        if (reporter && !reporterProtocolPinned(body.cProtocol)) {
            throw new BadRequestException(REPORTER_PROTOCOL_MESSAGE);
        }
        const {
            cEclipseUsername,
            cEclipsePassword: _typed,
            cFeedSource: _feedSource,
            nEdgeid: _nEdgeid,
            nHearingOpid,
            // The legacy insert SP never sees the reporter connection: it goes to the bind, with the other venue keys.
            cReporterIp: _cReporterIp,
            nReporterPort: _nReporterPort,
            ...sessionBody
        } = body;
        const cTimezone = resolveTimezone(body.cTimezone);
        sessionBody.cTimezone = cTimezone;
        // S-D10: the session's own id for the unique-user rule, on both SP calls.
        const cUnicuserid = `sess:${randomUUID()}`;
        sessionBody.cUnicuserid = cUnicuserid;
        await this.pruneDeadEclipseRoutes();
        if (await this.hasActiveEclipseRoute(body.nCaseid)) {
            throw new ConflictException('A realtime session is already live for this case');
        }
        if (await this.hasActiveEclipseCredentials(cEclipseUsername, cEclipsePassword)) {
            throw new ConflictException('These Eclipse credentials are already used by another live session. Use a different username or password.');
        }

        const res = await this.db.executeRef('realtime_insertupdate_session', { ...sessionBody, permission: 'N' });
        if (!res.success) {
            this.logger.error(`Venue session creation failed: ${res.error}`);
            return { msg: -1, value: res.error };
        }
        const created = res.data?.[0]?.[0] ?? {};
        const nSesid = String(created?.nSesid ?? '').trim();
        if (Number(created?.msg) !== 1 || !nSesid) return created;
        const createdCaseId = String(created?.nCaseid ?? body.nCaseid).trim();

        // What a rollback must undo of the bind: 'bound' once et_rtedge_session_bind answered msg 1; 'unknown'
        // while its call is out or failed (it may still have committed); 'none' before it, or when it refused.
        let binding: 'none' | 'unknown' | 'bound' = 'none';
        const rollback = async () => {
            // First the binding, so a box never keeps an 'E' / 'L' session that has no route (it would arm it).
            if (binding !== 'none') await this.unbindFailedVenueSession(nSesid, nEdgeid, binding === 'bound');
            try {
                const ended = await this.db.executeRef('realtime_insertupdate_session', { nSesid, permission: 'C' });
                if (!ended?.success) this.logger.error(`Venue session ${nSesid}: ending it after the failed create failed: ${ended?.error ?? 'no answer'}`);
            } catch (error) {
                this.logger.error(`Venue session ${nSesid}: ending it after the failed create failed: ${error?.message ?? error}`);
            }
            try {
                await this.removeEclipseRoute(nSesid);
            } catch (error) {
                this.logger.error(`Venue session ${nSesid}: removing its route after the failed create failed: ${error?.message ?? error}`);
            }
        };

        let bound: Record<string, any>;
        try {
            const activated = await this.db.executeRef('realtime_update_running_session', {
                nSesid,
                cUnicuserid,
                dDate: body.dStartDt,
            });
            if (!activated?.success) {
                throw new Error(activated?.error || 'the session could not be marked as running');
            }
            binding = 'unknown';
            const bind = await this.db.executeRef('rtedge_session_bind', {
                nSesid,
                nEdgeid,
                ...(nHearingOpid ? { nHearingOpid } : {}),
                ...(body.nUserid ? { nMasterid: body.nUserid } : {}),
                ...(reporter ?? {}),
            });
            if (!bind?.success) throw new Error(bind?.error || 'the venue box binding failed');
            bound = bind.data?.[0]?.[0] ?? {};
            binding = Number(bound?.msg) === 1 ? 'bound' : 'none';
        } catch (error) {
            this.logger.error(`Venue session activation failed for session ${nSesid}: ${error?.message ?? error}`);
            await rollback();
            throw new InternalServerErrorException('The venue session could not be registered');
        }
        if (Number(bound?.msg) !== 1) {
            // The box refused the session (not active, case not assigned, hearing operator not a case admin...).
            this.logger.warn(`Venue session ${nSesid} not bound to box ${nEdgeid}: ${bound?.cCode ?? ''} ${bound?.value ?? ''}`);
            await rollback();
            return { msg: -1, value: bound?.value || 'The session could not be bound to the venue box', cCode: bound?.cCode ?? 'NOT_BOUND' };
        }
        // The bind answers with the reporter connection it stored. A bind SP older than 2026-10-02_rt_edge_11
        // ignores the two keys: the box would wait for a reporter who was told the box connects to them, so the
        // create is refused (and undone) instead of answering as if the connection were set.
        const storedPort = Number(bound.nReporterPort);
        const stored = typeof bound.cReporterIp === 'string' && REPORTER_IPV4_RE.test(bound.cReporterIp.trim())
            && Number.isInteger(storedPort) && storedPort >= 1 && storedPort <= 65535
            ? { cReporterIp: bound.cReporterIp.trim(), nReporterPort: storedPort }
            : null;
        if (reporter && !stored) {
            this.logger.error(`Venue session ${nSesid}: the bind did not store the reporter connection (is migration 2026-10-02_rt_edge_11 applied?)`);
            await rollback();
            return {
                msg: -1,
                value: 'The reporter address and port could not be saved on this server. Leave both empty (the reporter connects to the box), or ask support to apply the database update.',
                cCode: 'REPORTER_NOT_STORED',
            };
        }

        try {
            await this.writeEclipseRoute({
                nSesid,
                nCaseid: createdCaseId,
                cName: body.cName,
                username: cEclipseUsername,
                password: cEclipsePassword,
                nLines: body.nLines,
                cTimezone,
                edge: { nEdgeid, epoch: Number(bound.nIngestEpoch) || 1 },
            });
        } catch (error) {
            this.logger.error(`Venue session route failed for session ${nSesid}: ${error?.message ?? error}`);
            await rollback();
            throw new InternalServerErrorException('The Eclipse route could not be registered');
        }

        try {
            this.ios["server"].emit('on-notification', { msg: 1, nSesid, nCaseid: createdCaseId, cStatus: 'R' });
        } catch (error) {
        }
        this.pushToBox(nEdgeid, nSesid);

        const port = Number(bound.nCatPort);
        return {
            ...created,
            msg: 1,
            nSesid,
            nCaseid: createdCaseId,
            cName: body.cName,
            cEclipseUsername,
            cHost: bound.cLanIp ? String(bound.cLanIp) : null,
            nPort: Number.isInteger(port) && port > 0 ? port : 2500,
            cFeedSource: 'E',
            nEdgeid,
            cEdgeName: bound.cEdgeName ?? null,
            nHearingOpid: bound.nHearingOpid ?? null,
            cReporterIp: stored?.cReporterIp ?? null,
            nReporterPort: stored?.nReporterPort ?? null,
            cSyncState: bound.cSyncState ?? 'L',
            edgeOnline: bound.bEdgeOnline === true,
            edgeReady: false,
            ...(generated ? { cEclipsePassword, bPasswordGenerated: true } : {}),
        };
    }

    /**
     * Undo et_rtedge_session_bind for a venue session whose create failed after it (review item 18). The legacy
     * SP 'C' that ends the session does not know the venue columns, so without this the row stays cFeedSource
     * 'E', bEverEdge, nEdgeid, cSyncState 'L': et_rtedge_assignments hands it to the box as an upsert (the box
     * arms it and finds no route), the case cannot be released from the box, and the box's list counts it live.
     *
     * The undo is et_rtedge_session_rebind_direct (file 09): it clears exactly what the bind set (cFeedSource
     * 'D', cApply 'L', nEdgeid, bEverEdge, cSyncState, the epoch and the applied watermarks), and only for a
     * session still 'E' on that box, 'L', not deleted, never fed and holding no orphan, which a session created
     * a moment ago is. `known`: the bind answered msg 1; otherwise its call failed and may or may not have
     * committed, so a refusal (CONFLICT: nothing bound) is the expected answer and stays quiet. A known binding
     * that cannot be undone raises an admin alert: the session needs "Use direct cloud instead" or a force seal.
     */
    private async unbindFailedVenueSession(nSesid: string, nEdgeid: string, known: boolean): Promise<boolean> {
        let why: string;
        try {
            const res = await this.db.executeRef('rtedge_session_rebind_direct', { nSesid, nEdgeid });
            const row = res?.success ? res.data?.[0]?.[0] : null;
            if (row && Number(row.msg) === 1) {
                this.logger.warn(`Venue session ${nSesid}: the create failed after the bind; the session is unbound from box ${nEdgeid}`);
                // Its feed path changed ('E' -> 'D'): the edge module drops what it and the viewer gateway cached
                // about it (EventsGateway.forgetIngestLane through the apply port). Never fails the rollback.
                try {
                    this.edgeRegistry?.noteFeedPathChanged?.(nSesid);
                } catch {
                }
                return true;
            }
            why = row ? `${row.cCode ?? ''} ${row.value ?? ''}`.trim() : String(res?.error ?? 'no answer');
        } catch (error) {
            why = String(error?.message ?? error);
        }
        if (!known) {
            this.logger.log(`Venue session ${nSesid}: no binding to undo after the failed bind call (${why})`);
            return false;
        }
        const message = `Venue session ${nSesid}: the create failed after it was bound to box ${nEdgeid}, and the binding could not be undone (${why}). The session is ended but still bound: use "Use direct cloud instead" or force-seal it.`;
        this.logger.error(message);
        try {
            this.edgeRegistry?.alert?.({ kind: 'VENUE_CREATE_UNBIND_FAILED', tier: 'P2', nSesid, nEdgeid, message, data: { reason: why } });
        } catch {
        }
        return false;
    }

    /** spec §4.2 step 5: push the new session to its box; never fails the create. */
    private pushToBox(nEdgeid: string, nSesid: string): void {
        if (!this.edgeRegistry) {
            this.logger.warn(`Venue session ${nSesid}: no edge registry here; box ${nEdgeid} picks it up on its next hello`);
            return;
        }
        void Promise.resolve()
            .then(() => this.edgeRegistry!.pushSessionUpsert(nEdgeid, nSesid))
            .then(
                res => {
                    if (!res?.delivered) this.logger.log(`Venue session ${nSesid} not pushed to box ${nEdgeid} (${res?.reason ?? 'not delivered'}); its next hello pull delivers it`);
                },
                error => this.logger.warn(`Venue session ${nSesid}: push to box ${nEdgeid} failed: ${error?.message ?? error}`),
            );
    }

    /**
     * Drop routes whose session is no longer live — deleted, ended by a path
     * that never cleaned its route (delete, sync-complete), or never ended at
     * all. Without this one leftover route blocks its case (and its Eclipse
     * credentials) forever. Runs inside the create queue. A failed lookup
     * drops nothing: a transport error is not evidence a session ended.
     *
     * A venue-box session's route ('E', the dormant cloud copy) is never
     * pruned: its session ends as a request ('S', cStatus 'C') and stays bound
     * until its seal, which removes the route (SessionService
     * completeGatedSessionEnd); split and "Use direct cloud instead" rewrite it
     * (EdgeRegistryService.updateRoutes).
     */
    private async pruneDeadEclipseRoutes(): Promise<void> {
        const routes = await this.readEclipseRoutes();
        const ids = [...new Set(routes.filter(route => !isEdgeRoute(route)).map(route => String(route?.nSesid ?? '').trim()).filter(Boolean))];
        if (!ids.length) return;
        const res = await this.db.rowQuery(LIVE_ROUTE_SESSIONS_SQL, [ids, ECLIPSE_ROUTE_MAX_AGE_HOURS]);
        if (!res?.success || !Array.isArray(res.data)) {
            this.logger.warn(`Could not verify Eclipse route sessions, keeping all routes: ${res?.error ?? 'no data'}`);
            return;
        }
        const live = new Set(res.data.filter(row => row?.bLive === true).map(row => String(row.nSesid).trim()));
        const dead = new Set(ids.filter(id => !live.has(id)));
        if (!dead.size) return;
        const remaining = routes.filter(route => !dead.has(String(route?.nSesid ?? '').trim()));
        await fs.writeFile(this.eclipseRuntimeConfigPath(), JSON.stringify(remaining, null, 2), { encoding: 'utf8', mode: 0o600 });
        this.logger.warn(`Removed Eclipse route(s) with no live session: ${[...dead].join(', ')}`);
    }

    /**
     * The bridge's runtime route file is the durable source of truth for a
     * Home-managed Eclipse connection — a stale DB row must not gate creation.
     *
     * One exception (review C4): a venue-box route ('E') stays in the file after
     * its session ENDED, until the box seals it (spec §4.4 defers the route
     * removal to the seal). Such a session is over (cStatus 'C', cSyncState
     * 'S' or sealed), so its route no longer blocks a new session of the case.
     * Live venue sessions still block, and so does an 'E' route whose state
     * cannot be read (no row, a failed read, a non-uuid id): only a known end
     * unblocks. Direct routes are judged exactly as before (no read).
     */
    private async hasActiveEclipseRoute(nCaseid: string): Promise<boolean> {
        const caseId = String(nCaseid ?? '').trim();
        const routes = await this.readEclipseRoutes();
        const forCase = routes.filter(route => String(route?.nCaseid ?? '').trim() === caseId);
        if (!forCase.length) return false;
        if (forCase.some(route => !isEdgeRoute(route))) return true;
        const ended = await this.endedVenueSessions(forCase.map(route => String(route?.nSesid ?? '').trim()));
        return forCase.some(route => !ended.has(String(route?.nSesid ?? '').trim().toLowerCase()));
    }

    /**
     * Which of these venue sessions have ended (ENDED_SYNC_STATES) with no later part of the hearing still live.
     * Empty on any doubt: a failed read ends nothing.
     */
    private async endedVenueSessions(ids: string[]): Promise<Set<string>> {
        const uuids = [...new Set(ids.filter(id => isUuid(id)).map(id => id.toLowerCase()))];
        if (!uuids.length) return new Set();
        try {
            const res = await this.db.rowQuery(EDGE_ROUTE_SYNC_STATES_SQL, [uuids]);
            if (!res?.success || !Array.isArray(res.data)) {
                this.logger.warn(`Could not read the state of venue session(s) ${uuids.join(', ')}; their routes keep blocking the case: ${res?.error ?? 'no data'}`);
                return new Set();
            }
            return new Set(res.data
                .filter(row => ENDED_SYNC_STATES.has(String(row?.cSyncState ?? '').trim()) && row?.bLiveNextPart !== true)
                .map(row => String(row.nSesid).trim().toLowerCase()));
        } catch (error) {
            this.logger.warn(`Could not read the state of venue session(s) ${uuids.join(', ')}; their routes keep blocking the case: ${error?.message ?? error}`);
            return new Set();
        }
    }

    private async hasActiveEclipseCredentials(username: string, password: string): Promise<boolean> {
        const user = String(username ?? '').trim();
        const routes = await this.readEclipseRoutes();
        return routes.some(route =>
            String(route?.user ?? '').trim() === user && this.eclipsePasswordMatches(route, password));
    }

    /**
     * Public: the TCP ingest auth-router matches Eclipse handshakes with this. A route that names its scrypt
     * cost (`scryptN`, venue-box routes: 2^15) is checked with it; a route without one (every direct-cloud
     * route) exactly as before, with node's default cost.
     */
    eclipsePasswordMatches(route: Record<string, any>, supplied: string): boolean {
        if (route?.passwordSalt && route?.passwordHash) {
            try {
                const expected = Buffer.from(String(route.passwordHash), 'base64');
                const salt = Buffer.from(String(route.passwordSalt), 'base64');
                const n = Number(route.scryptN);
                const actual = route.scryptN === undefined || route.scryptN === null
                    ? scryptSync(String(supplied ?? ''), salt, expected.length)
                    : scryptSync(String(supplied ?? ''), salt, expected.length, { N: n, maxmem: SCRYPT_MAXMEM });
                return expected.length === actual.length && timingSafeEqual(expected, actual);
            } catch {
                return false;
            }
        }
        return route?.pass !== undefined && String(route.pass) === String(supplied ?? '');
    }

    /** Public: the TCP ingest auth-router re-reads routes on every handshake. */
    async readEclipseRoutes(): Promise<Record<string, any>[]> {
        const runtimePath = this.eclipseRuntimeConfigPath();
        try {
            const routes = JSON.parse(await fs.readFile(runtimePath, 'utf8'));
            if (!Array.isArray(routes)) throw new Error('expected an array');
            return routes;
        } catch (error) {
            if (error?.code === 'ENOENT') return [];
            this.logger.error(`Could not verify Eclipse runtime routes at ${runtimePath}: ${error?.message ?? error}`);
            throw new ServiceUnavailableException('Could not verify the current Eclipse session');
        }
    }

    private async writeEclipseRoute(route: {
        nSesid: string;
        nCaseid: string;
        cName: string;
        username: string;
        password: string;
        nLines: number;
        cTimezone?: string;
        /** A venue-box session: the dormant route the cloud listener holds (spec §4.2), and the box's copy's source. */
        edge?: { nEdgeid: string; epoch: number };
    }): Promise<void> {
        const salt = randomBytes(16);
        const passwordHash = route.edge
            ? scryptSync(route.password, salt, 32, { N: EDGE_ROUTE_SCRYPT_N, maxmem: SCRYPT_MAXMEM })
            : scryptSync(route.password, salt, 32);
        const runtimePath = this.eclipseRuntimeConfigPath();
        const routes = await this.readEclipseRoutes();
        // One route per case, except the dormant venue route of an ended session of the case that still waits for
        // its seal (hasActiveEclipseRoute let this create through): it stays, so the cloud listener still holds a
        // direct stream for it and its seal removes it (spec §4.4). A file without venue routes is filtered as before.
        const remaining = routes.filter(existing =>
            String(existing?.nSesid ?? '') !== route.nSesid
            && (String(existing?.nCaseid ?? '') !== route.nCaseid || isEdgeRoute(existing)));
        await fs.mkdir(path.dirname(runtimePath), { recursive: true });
        await fs.writeFile(runtimePath, JSON.stringify([...remaining, {
            nSesid: route.nSesid,
            nCaseid: route.nCaseid,
            label: route.cName,
            nLines: route.nLines,
            user: route.username,
            cTimezone: route.cTimezone,
            passwordSalt: salt.toString('base64'),
            passwordHash: passwordHash.toString('base64'),
            ...(route.edge ? { scryptN: EDGE_ROUTE_SCRYPT_N, feedSource: 'E', nEdgeid: route.edge.nEdgeid, epoch: route.edge.epoch } : {}),
            // Encrypted copy for the super-admin reveal; dies with the route.
            ...(this.encryptEclipsePassword(route.password) ?? {}),
        }], null, 2), { encoding: 'utf8', mode: 0o600 });
    }

    /**
     * Super admin reveal of a live session's Eclipse login. Only routes that
     * still exist can answer (an ended session's route is gone). A route
     * written before encrypted copies existed, or one the current key cannot
     * open, answers with `cEclipsePassword: null`.
     */
    async revealEclipseCredential(nSesid: string, adminUserId: string): Promise<{
        msg: 1; nSesid: string; cEclipseUsername: string; cEclipsePassword: string | null;
    }> {
        const id = String(nSesid ?? '').trim();
        const routes = await this.readEclipseRoutes();
        const route = routes.find(r => String(r?.nSesid ?? '').trim() === id);
        if (!route) throw new NotFoundException('This session has no live Eclipse connection');
        const password = this.decryptEclipsePassword(route.passwordEnc);
        this.logger.log(`Eclipse credential of session ${id} revealed to admin ${adminUserId} (password ${password === null ? 'unavailable' : 'shown'})`);
        return { msg: 1, nSesid: id, cEclipseUsername: String(route.user ?? ''), cEclipsePassword: password };
    }

    /** AES-256-GCM key derived from the server's JWT secret (no extra config).
     *  Rotating that secret only makes older copies unreadable. */
    private eclipsePasswordKey(): Buffer | null {
        const secret = this.config.get<string>('JWT_SECRET');
        if (!secret) return null;
        return Buffer.from(hkdfSync('sha256', secret, 'etabella-eclipse-route', 'eclipse-password-v1', 32));
    }

    private encryptEclipsePassword(password: string): { passwordEnc: string } | null {
        const key = this.eclipsePasswordKey();
        if (!key || !password) return null;
        const iv = randomBytes(12);
        const cipher = createCipheriv('aes-256-gcm', key, iv);
        const ciphertext = Buffer.concat([cipher.update(String(password), 'utf8'), cipher.final()]);
        const parts = [iv, cipher.getAuthTag(), ciphertext].map(b => b.toString('base64'));
        return { passwordEnc: [ECLIPSE_PASSWORD_ENC_VERSION, ...parts].join('.') };
    }

    private decryptEclipsePassword(passwordEnc: unknown): string | null {
        if (typeof passwordEnc !== 'string') return null;
        const [version, iv, tag, ciphertext] = passwordEnc.split('.');
        const key = this.eclipsePasswordKey();
        if (version !== ECLIPSE_PASSWORD_ENC_VERSION || !iv || !tag || !ciphertext || !key) return null;
        try {
            const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
            decipher.setAuthTag(Buffer.from(tag, 'base64'));
            return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64')), decipher.final()]).toString('utf8');
        } catch {
            return null;
        }
    }

    /** Best-effort route removal — called from sessionEnd and create rollback. */
    async removeEclipseRoute(nSesid: string): Promise<void> {
        const runtimePath = this.eclipseRuntimeConfigPath();
        try {
            const raw = await fs.readFile(runtimePath, 'utf8');
            const routes = JSON.parse(raw);
            if (!Array.isArray(routes)) return;
            const remaining = routes.filter(route => String(route?.nSesid ?? '') !== nSesid);
            await fs.writeFile(runtimePath, JSON.stringify(remaining, null, 2), { encoding: 'utf8', mode: 0o600 });
        } catch (error) {
            if (error?.code !== 'ENOENT') throw error;
            await fs.mkdir(path.dirname(runtimePath), { recursive: true });
            await fs.writeFile(runtimePath, '[]', { encoding: 'utf8', mode: 0o600 });
        }
    }

    private eclipseRuntimeConfigPath(): string {
        return this.config.get<string>('ECLIPSE_SESSION_CONFIG')
            || path.join(process.cwd(), 'tools', 'feed-replay', 'sessions.runtime.json');
    }
}
