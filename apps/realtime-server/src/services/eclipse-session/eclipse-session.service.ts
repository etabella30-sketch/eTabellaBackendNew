import { ConflictException, Inject, Injectable, InternalServerErrorException, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Server } from 'socket.io';

import { DbService } from '@app/global/db/pg/db.service';

import { EclipseSessionCreateReq } from '../../interfaces/session.interface';

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
            passwordSalt: salt.toString('base64'),
            passwordHash: passwordHash.toString('base64'),
        }], null, 2), { encoding: 'utf8', mode: 0o600 });
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
