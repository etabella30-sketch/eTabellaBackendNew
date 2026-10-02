import { assignmentSnapshotFrom, sessionDeliveryFrom } from './assignments';

const ROUTE = { user: 'eclipse-1', salt: 'c2FsdA==', hash: 'aGFzaA==', scryptN: 32768 };

/** The protocol's AssignedSession (libs/edge-sync protocol.ts), as `c.assign{op:'upsert'}` carries it. */
const assigned = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
    nSesid: 'ses-1',
    nCaseid: 'case-1',
    cName: 'Day 3 — Morning',
    dStartDt: '2026-10-01 10:00:00',
    tz: 'Europe/London',
    nLines: 25,
    epoch: 1,
    rebaseSeq: null,
    parserVer: '1.1.0+abc',
    fmt: 1,
    route: ROUTE,
    team: [
        { nUserid: 'u1', isCaseAdmin: true },
        { nUserid: 'u2', isCaseAdmin: false },
    ],
    hearingOperator: 'u1',
    case: { cCaseno: 'HC-2026-001', cName: 'Okafor v Shah' },
    ...extra,
});

describe('uplink assignment normalisation (spec §4.2 "Delivery to the edge")', () => {
    it('maps the protocol AssignedSession to the stored assignment, its case and its team', () => {
        const d = sessionDeliveryFrom(assigned())!;
        expect(d.assignment).toEqual({
            nSesid: 'ses-1',
            nCaseid: 'case-1',
            cName: 'Day 3 — Morning',
            dStartDt: '2026-10-01 10:00:00',
            tz: 'Europe/London',
            nLines: 25,
            protocol: null,
            epoch: 1,
            rebaseSeq: null,
            parserVer: '1.1.0+abc',
            fmt: 1,
            route: ROUTE,
            hearingOperator: { nUserid: 'u1', name: 'u1' },
            nPartNo: 1,
            nPrevPartSesid: null,
            next: null,
            cloudOp: 'upsert',
            deleted: false,
            reporter: null,
        });
        expect(d.cases).toEqual([{ nCaseid: 'case-1', cCasename: 'Okafor v Shah', cCaseno: 'HC-2026-001', assignedAtMs: null }]);
        expect(d.roster.map(m => [m.nUserid, m.isCaseAdmin, m.source, m.active, m.nSesid])).toEqual([
            ['u1', true, 'team', true, null],
            ['u2', false, 'team', true, null],
        ]);
        // No plaintext, no passwordEnc: only the four route fields survive.
        expect(sessionDeliveryFrom(assigned({ route: { ...ROUTE, password: 'x', passwordEnc: 'y' } }))!.assignment.route).toEqual(ROUTE);
    });

    it('reads the SP-shaped extensions: protocol, parts, cOp end, deleted, hearing operator names, assignees', () => {
        const d = sessionDeliveryFrom(
            assigned({
                cProtocol: 'C',
                nPartNo: 1,
                nNextPartSesid: 'ses-2',
                cOp: 'end',
                bDeleted: true,
                hearingOperator: undefined,
                nHearingOpid: 'u9',
                cHearingOpFname: 'Ada',
                cHearingOpLname: 'Okafor',
                nIngestEpoch: 3,
                nRebaseSeq: '120',
                cTimezone: 'Asia/Kolkata',
                tz: undefined,
                assignees: [{ nUserid: 'u5', cFname: 'Sam', cLname: 'Lee', cUserStatus: 'I' }],
                epoch: undefined,
                rebaseSeq: undefined,
            }),
        )!;
        expect(d.assignment).toMatchObject({ protocol: 'C', cloudOp: 'end', deleted: true, hearingOperator: { nUserid: 'u9', name: 'Ada Okafor' }, epoch: 3, rebaseSeq: 120, tz: 'Asia/Kolkata', next: { nSesid: 'ses-2', nPartNo: 2, splitAtMs: null } });
        expect(d.roster.find(m => m.nUserid === 'u5')).toMatchObject({ name: 'Sam Lee', source: 'session', nSesid: 'ses-1', active: false });
        expect(sessionDeliveryFrom(assigned({ hearingOperator: { nUserid: 'u3', name: 'Jo' } }))!.assignment.hearingOperator).toEqual({ nUserid: 'u3', name: 'Jo' });
        expect(sessionDeliveryFrom(assigned({ route: { user: 'x' } }))!.assignment.route).toBeNull();
        expect(sessionDeliveryFrom(assigned({ nLines: -3 }))!.assignment.nLines).toBe(25);
    });

    it("reads the reporter machine the box dials: the wire object, or the SP's flat columns", () => {
        expect(sessionDeliveryFrom(assigned({ reporter: { host: '192.168.1.20', port: 1337 } }))!.assignment.reporter).toEqual({ host: '192.168.1.20', port: 1337 });
        expect(sessionDeliveryFrom(assigned({ cReporterIp: ' 192.168.1.20 ', nReporterPort: 1337 }))!.assignment.reporter).toEqual({ host: '192.168.1.20', port: 1337 });
        // An integer column may arrive as text.
        expect(sessionDeliveryFrom(assigned({ cReporterIp: '10.0.0.5', nReporterPort: '65535' }))!.assignment.reporter).toEqual({ host: '10.0.0.5', port: 65535 });
        // The wire object, when there is one, is the whole answer: its parts are never mixed with the flat columns.
        expect(sessionDeliveryFrom(assigned({ reporter: { host: '192.168.1.20', port: 1337 }, cReporterIp: '10.0.0.5', nReporterPort: 1 }))!.assignment.reporter).toEqual({ host: '192.168.1.20', port: 1337 });
        expect(sessionDeliveryFrom(assigned({ reporter: { host: '192.168.1.20' }, nReporterPort: 1337 }))!.assignment.reporter).toBeNull();
        expect(sessionDeliveryFrom(assigned({ reporter: null, cReporterIp: '192.168.1.20', nReporterPort: 1337 }))!.assignment.reporter).toEqual({ host: '192.168.1.20', port: 1337 });
    });

    it('a reporter that is not an IPv4 address and a port 1-65535, or only one of the two, reads as none (never fatal)', () => {
        const none = (extra: Record<string, unknown>): void => {
            const d = sessionDeliveryFrom(assigned(extra));
            expect(d).not.toBeNull(); // the session itself is still delivered
            expect(d!.assignment.reporter).toBeNull();
        };
        none({});
        none({ reporter: null });
        none({ reporter: 'reporter-laptop:1337' });
        none({ reporter: { host: 'reporter-laptop', port: 1337 } });
        none({ reporter: { host: '192.168.1', port: 1337 } });
        none({ reporter: { host: '192.168.01.20', port: 1337 } }); // no leading zeros
        none({ reporter: { host: '192.168.1.256', port: 1337 } });
        none({ reporter: { host: '::1', port: 1337 } });
        none({ reporter: { host: '192.168.1.20', port: 0 } });
        none({ reporter: { host: '192.168.1.20', port: 65536 } });
        none({ reporter: { host: '192.168.1.20', port: 1337.5 } });
        none({ reporter: { host: '192.168.1.20', port: 'ssh' } });
        none({ reporter: { host: '192.168.1.20' } });
        none({ reporter: { port: 1337 } });
        none({ cReporterIp: '192.168.1.20' });
        none({ cReporterIp: '192.168.1.20', nReporterPort: null });
        none({ nReporterPort: 1337 });
        // One bad reporter does not cost the pull its session.
        const pull = assignmentSnapshotFrom([assigned({ reporter: { host: 'nope', port: 1 } }), assigned({ nSesid: 'ses-2', reporter: { host: '192.168.1.21', port: 2000 } })])!;
        expect(pull.skipped).toBe(0);
        expect(pull.snapshot.sessions.map(s => s.reporter)).toEqual([null, { host: '192.168.1.21', port: 2000 }]);
    });

    it('refuses unusable entries: not an object, no id, an unsafe id, no case', () => {
        expect(sessionDeliveryFrom(null)).toBeNull();
        expect(sessionDeliveryFrom('ses-1')).toBeNull();
        expect(sessionDeliveryFrom(assigned({ nSesid: '' }))).toBeNull();
        expect(sessionDeliveryFrom(assigned({ nSesid: '../../etc' }))).toBeNull();
        expect(sessionDeliveryFrom(assigned({ nCaseid: null }))).toBeNull();
    });

    it('a full pull: the protocol array or the cloud snapshot object; malformed rows are skipped and counted', () => {
        expect(assignmentSnapshotFrom({ nope: true })).toBeNull();
        expect(assignmentSnapshotFrom('x')).toBeNull();
        const fromArray = assignmentSnapshotFrom([assigned(), { nSesid: '' }, assigned({ nSesid: 'ses-2', nCaseid: 'case-2', case: undefined })])!;
        expect(fromArray.skipped).toBe(1);
        expect(fromArray.snapshot.sessions.map(s => s.nSesid)).toEqual(['ses-1', 'ses-2']);
        // Every session's case exists as a case row.
        expect(fromArray.snapshot.cases.map(c => c.nCaseid).sort()).toEqual(['case-1', 'case-2']);
        expect(fromArray.snapshot.operatorCode).toBeNull();

        const snap = assignmentSnapshotFrom({
            sessions: [{ ...assigned(), cloudOp: 'end', next: { nSesid: 'ses-9', nPartNo: 2, splitAtMs: 5 } }],
            cases: [{ nCaseid: 'case-1', cCasename: 'Okafor v Shah', cCaseno: 'HC-1', assignedAtMs: 7 }, { cCasename: 'no id' }],
            roster: [
                { nCaseid: 'case-1', nSesid: null, nUserid: 'u1', name: 'Priya Shah', email: 'p@example.com', role: 'Counsel', isCaseAdmin: true, active: true, source: 'team' },
                { nCaseid: 'case-1', nSesid: 'ses-1', nUserid: 'u4', name: 'Kim', isCaseAdmin: false, active: true, source: 'session' },
                { nUserid: 'no-case' },
            ],
            superAdmins: [{ nUserid: 'sa1', name: 'Root Admin', email: null }, { name: 'no id' }],
            operatorCode: { day: '2026-10-01', salt: 'c2E=', hash: 'aA==', scryptN: 32768, issuedAtMs: 1, mintedBy: { nUserid: 'u1', name: 'Priya Shah' } },
        })!;
        expect(snap.skipped).toBe(2);
        expect(snap.snapshot.sessions[0]).toMatchObject({ cloudOp: 'end', next: { nSesid: 'ses-9', nPartNo: 2, splitAtMs: 5 } });
        expect(snap.snapshot.cases).toEqual([{ nCaseid: 'case-1', cCasename: 'Okafor v Shah', cCaseno: 'HC-1', assignedAtMs: 7 }]);
        expect(snap.snapshot.roster.find(m => m.nUserid === 'u1')).toMatchObject({ email: 'p@example.com', role: 'Counsel', isCaseAdmin: true });
        expect(snap.snapshot.roster.find(m => m.nUserid === 'u4')).toMatchObject({ source: 'session', nSesid: 'ses-1' });
        expect(snap.snapshot.superAdmins).toEqual([{ nUserid: 'sa1', name: 'Root Admin', email: null }]);
        expect(snap.snapshot.operatorCode).toEqual({ day: '2026-10-01', alg: 'scrypt', salt: 'c2E=', hash: 'aA==', scryptN: 32768, issuedAtMs: 1, mintedBy: { nUserid: 'u1', name: 'Priya Shah' } });
        expect(assignmentSnapshotFrom({ sessions: [], operatorCode: { day: '2026-10-01' } })!.snapshot.operatorCode).toBeNull();
    });
});
