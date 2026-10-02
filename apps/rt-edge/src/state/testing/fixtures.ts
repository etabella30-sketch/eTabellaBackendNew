/**
 * SPEC HELPER (imported by *.spec.ts only): temp-dir state databases and assignment fixtures. Nothing in the box
 * imports it.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { FEED_PARSE_VERSION } from '@app/feed-parse';

import type { BoxAssignmentSnapshot, BoxRosterMember, BoxSessionAssignment } from '../../ports';
import { SqliteEdgeState } from '../sqlite-state';

export interface TempState {
    readonly dir: string;
    readonly file: string;
    readonly state: SqliteEdgeState;
    reopen(): SqliteEdgeState;
    cleanup(): Promise<void>;
}

export function tempState(timeZone = 'Europe/London', prefix = 'rt-edge-state-'): TempState {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
    const file = path.join(dir, 'edge.sqlite');
    const opened: SqliteEdgeState[] = [];
    const open = (): SqliteEdgeState => {
        const s = SqliteEdgeState.open({ file, timeZone });
        opened.push(s);
        return s;
    };
    const first = open();
    return {
        dir,
        file,
        state: first,
        reopen: open,
        async cleanup() {
            for (const s of opened) await s.close().catch(() => undefined);
            fs.rmSync(dir, { recursive: true, force: true });
        },
    };
}

export function assignment(nSesid: string, extra: Partial<BoxSessionAssignment> = {}): BoxSessionAssignment {
    return {
        nSesid,
        nCaseid: 'case-1',
        cName: `Session ${nSesid}`,
        dStartDt: '2026-10-01 10:00:00',
        tz: 'Europe/London',
        nLines: 25,
        protocol: null,
        epoch: 1,
        rebaseSeq: null,
        parserVer: FEED_PARSE_VERSION,
        fmt: 1,
        route: { user: `user-${nSesid}`, salt: 'c2FsdA==', hash: 'aGFzaA==', scryptN: 1024 },
        hearingOperator: { nUserid: 'u-admin', name: 'Priya Shah' },
        nPartNo: 1,
        nPrevPartSesid: null,
        next: null,
        cloudOp: 'upsert',
        deleted: false,
        reporter: null,
        ...extra,
    };
}

export function member(nUserid: string, extra: Partial<BoxRosterMember> = {}): BoxRosterMember {
    return {
        nUserid,
        name: `Person ${nUserid}`,
        email: `${nUserid}@example.test`,
        nCaseid: 'case-1',
        nSesid: null,
        role: 'Counsel',
        isCaseAdmin: false,
        active: true,
        source: 'team',
        ...extra,
    };
}

export function snapshot(extra: Partial<BoxAssignmentSnapshot> = {}): BoxAssignmentSnapshot {
    return {
        cases: [{ nCaseid: 'case-1', cCasename: 'Acme v Beta', cCaseno: 'HC-2026-001', assignedAtMs: null }],
        sessions: [assignment('ses-a')],
        roster: [member('u-admin', { isCaseAdmin: true, name: 'Priya Shah' }), member('u-2', { name: 'Daniel Okafor' })],
        superAdmins: [{ nUserid: 'u-super', name: 'Sam Root', email: null }],
        operatorCode: null,
        ...extra,
    };
}
