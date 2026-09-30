import { ConflictException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Server } from 'socket.io';

import { DbService } from '@app/global/db/pg/db.service';
import { resolveTimezone } from '@app/feed-parse';

import { EclipseSessionCreateReq } from '../../interfaces/session.interface';

/** A hearing day never streams this long — a route whose session started
 *  earlier is a leftover nobody ended (same window as the frontend's live rule). */
export const ECLIPSE_ROUTE_MAX_AGE_HOURS = 18;

/** Version tag of the encrypted password kept on a route (`passwordEnc`). */
const ECLIPSE_PASSWORD_ENC_VERSION = 'v1';

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
    ) { }

    /**
     * Calls are serialized so two quick submissions for the same case cannot
     * both pass the case-level duplicate check.
     */
    async createEclipseSession(body: EclipseSessionCreateReq): Promise<any> {
        const operation = this.eclipseCreateQueue.then(() => this.createEclipseSessionLocked(body));
        this.eclipseCreateQueue = operation.then(() => undefined, () => undefined);
        return operation;
    }

    private async createEclipseSessionLocked(body: EclipseSessionCreateReq): Promise<any> {
        const {
            cEclipseUsername,
            cEclipsePassword,
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
     * Drop routes whose session is no longer live — deleted, ended by a path
     * that never cleaned its route (delete, sync-complete), or never ended at
     * all. Without this one leftover route blocks its case (and its Eclipse
     * credentials) forever. Runs inside the create queue. A failed lookup
     * drops nothing: a transport error is not evidence a session ended.
     */
    private async pruneDeadEclipseRoutes(): Promise<void> {
        const routes = await this.readEclipseRoutes();
        const ids = [...new Set(routes.map(route => String(route?.nSesid ?? '').trim()).filter(Boolean))];
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
     */
    private async hasActiveEclipseRoute(nCaseid: string): Promise<boolean> {
        const caseId = String(nCaseid ?? '').trim();
        const routes = await this.readEclipseRoutes();
        return routes.some(route => String(route?.nCaseid ?? '').trim() === caseId);
    }

    private async hasActiveEclipseCredentials(username: string, password: string): Promise<boolean> {
        const user = String(username ?? '').trim();
        const routes = await this.readEclipseRoutes();
        return routes.some(route =>
            String(route?.user ?? '').trim() === user && this.eclipsePasswordMatches(route, password));
    }

    /** Public: the TCP ingest auth-router matches Eclipse handshakes with this. */
    eclipsePasswordMatches(route: Record<string, any>, supplied: string): boolean {
        if (route?.passwordSalt && route?.passwordHash) {
            try {
                const expected = Buffer.from(String(route.passwordHash), 'base64');
                const actual = scryptSync(String(supplied ?? ''), Buffer.from(String(route.passwordSalt), 'base64'), expected.length);
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
    }): Promise<void> {
        const salt = randomBytes(16);
        const passwordHash = scryptSync(route.password, salt, 32);
        const runtimePath = this.eclipseRuntimeConfigPath();
        const routes = await this.readEclipseRoutes();
        const remaining = routes.filter(existing =>
            String(existing?.nSesid ?? '') !== route.nSesid
            && String(existing?.nCaseid ?? '') !== route.nCaseid);
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
