/**
 * Email-only sign-in of the localhost box console. The person at the box types their email; the box looks it up in
 * the people list etabella.net sent with the box's cases (the roster) and its super-admins. No password and no trip
 * to etabella.net: the console opens only on the box computer itself (box-console.server.ts), so the email says WHO is
 * at the box (for the audit trail and to show their cases), it is not what keeps strangers out.
 *
 * Sessions live in memory: a box restart signs everyone out.
 */
import { randomBytes } from 'crypto';

import type { EdgePrincipal } from '../ports/auth.port';
import type { AssignmentsRepo, RosterRepo } from '../ports/state.port';

/** How long a console sign-in lasts. */
export const CONSOLE_SESSION_TTL_MS = 12 * 3600 * 1000;
export const CONSOLE_COOKIE = 'box_console';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ConsolePerson {
    readonly nUserid: string;
    readonly name: string;
    readonly email: string;
    readonly isSuperAdmin: boolean;
    /** Box cases this person is on (a super-admin sees every case; this list is then not used). */
    readonly caseIds: readonly string[];
}

/** `invalid`: not an email; `no-roster`: the box has no people list yet; `unknown`: not on any case of this box. */
export type ConsoleRefusal = 'invalid' | 'no-roster' | 'unknown';

/** Exactly one of `person` / `reason` is set. */
export interface ConsoleLookup {
    readonly person: ConsolePerson | null;
    readonly reason: ConsoleRefusal | null;
}

/** Find the person an email belongs to among the box's super-admins and active case members. */
export function findConsolePerson(emailRaw: unknown, assignments: Pick<AssignmentsRepo, 'cases'>, roster: Pick<RosterRepo, 'forCase' | 'superAdmins'>): ConsoleLookup {
    const email = typeof emailRaw === 'string' ? emailRaw.trim().toLowerCase() : '';
    if (!email || email.length > 254 || !EMAIL_RE.test(email)) return { person: null, reason: 'invalid' };
    const same = (value: string | null): boolean => !!value && value.trim().toLowerCase() === email;

    const admins = roster.superAdmins();
    const cases = assignments.cases();
    const caseIds: string[] = [];
    let member: { nUserid: string; name: string } | null = null;
    let people = admins.length;
    for (const c of cases) {
        for (const m of roster.forCase(c.nCaseid)) {
            if (!m.active) continue;
            people++;
            if (!same(m.email)) continue;
            member = member ?? { nUserid: m.nUserid, name: m.name };
            if (!caseIds.includes(c.nCaseid)) caseIds.push(c.nCaseid);
        }
    }
    const admin = admins.find(a => same(a.email)) ?? null;
    if (admin) return { reason: null, person: { nUserid: admin.nUserid, name: admin.name, email, isSuperAdmin: true, caseIds: cases.map(c => c.nCaseid) } };
    if (member) return { reason: null, person: { nUserid: member.nUserid, name: member.name, email, isSuperAdmin: false, caseIds } };
    return { person: null, reason: people === 0 ? 'no-roster' : 'unknown' };
}

/** The sentence the sign-in form shows for a refusal. */
export function consoleSignInMessage(reason: ConsoleRefusal): string {
    switch (reason) {
        case 'invalid':
            return 'Enter your email address.';
        case 'no-roster':
            return "This box hasn't received its people list from etabella.net yet. Check the internet, wait a minute and try again.";
        default:
            return "This email isn't on any case of this box. Ask an admin to add you to the case on etabella.net.";
    }
}

/**
 * Who a signed-in console user acts as on the box: an operator-kind principal (never forwardable to the cloud) that
 * may change the reporter connection. Audit rows carry their name with "(box console)".
 */
export function consolePrincipal(person: ConsolePerson, nowMs: number, token: string): EdgePrincipal {
    return {
        kind: 'operator',
        userId: null,
        name: `${person.name} (box console)`,
        email: person.email,
        caseIds: person.caseIds,
        adminCaseIds: [],
        isBoxAdmin: true,
        isSuperAdmin: person.isSuperAdmin,
        validUntil: nowMs + CONSOLE_SESSION_TTL_MS,
        untilSessionEnds: false,
        jti: `box-console-${token.slice(0, 8)}`,
        issuedAt: nowMs,
        authTime: null,
        mintedBy: null,
        operatorDay: null,
        deviceHash: null,
        forwardable: false,
        token: '',
    } as EdgePrincipal;
}

interface ConsoleSession {
    readonly person: ConsolePerson;
    readonly expiresAtMs: number;
}

/** In-memory console sign-ins, keyed by an unguessable cookie value. */
export class ConsoleSessions {
    private readonly sessions = new Map<string, ConsoleSession>();

    constructor(private readonly max = 50) {}

    open(person: ConsolePerson, nowMs: number): string {
        this.prune(nowMs);
        if (this.sessions.size >= this.max) {
            const oldest = this.sessions.keys().next().value;
            if (oldest !== undefined) this.sessions.delete(oldest);
        }
        const token = randomBytes(32).toString('base64url');
        this.sessions.set(token, { person, expiresAtMs: nowMs + CONSOLE_SESSION_TTL_MS });
        return token;
    }

    get(token: string | null, nowMs: number): ConsolePerson | null {
        if (!token) return null;
        const s = this.sessions.get(token);
        if (!s) return null;
        if (s.expiresAtMs <= nowMs) {
            this.sessions.delete(token);
            return null;
        }
        return s.person;
    }

    close(token: string | null): void {
        if (token) this.sessions.delete(token);
    }

    private prune(nowMs: number): void {
        for (const [token, s] of this.sessions) if (s.expiresAtMs <= nowMs) this.sessions.delete(token);
    }
}

/** The console cookie's value from a `Cookie` header; null when absent. */
export function consoleCookie(header: string | undefined): string | null {
    if (!header) return null;
    for (const part of header.split(';')) {
        const eq = part.indexOf('=');
        if (eq > 0 && part.slice(0, eq).trim() === CONSOLE_COOKIE) {
            const value = part.slice(eq + 1).trim();
            return /^[A-Za-z0-9_-]{20,100}$/.test(value) ? value : null;
        }
    }
    return null;
}
