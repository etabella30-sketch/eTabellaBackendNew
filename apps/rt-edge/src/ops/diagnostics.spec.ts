import { buildDiagnosticsFile, diagnosticsFileName, diagnosticsStamp, REDACTED, redactForDiagnostics, scrubString } from './diagnostics';
import { NOW } from './testing/ops-fakes';
import { unzip } from './testing/unzip';

const JWT = 'eyJhbGciOiJFUzI1NiIsInR5cCI6ImVkZ2Urand0In0.eyJzdWIiOiJ1MSIsImNhc2VzIjpbImMxIl19.MEUCIQDsignaturesignaturesignature';
const SHA = 'a3f1c9d2e4b5a6978877665544332211a3f1c9d2e4b5a6978877665544332211';

describe('diagnostics redaction (never transcript text, tokens, codes, passwords, hashes or Eclipse logins)', () => {
    it('drops sensitive keys at any depth, keeping null as null', () => {
        const out = redactForDiagnostics({
            token: 't',
            nested: { password: 'p', passwordEnc: 'x', salt: 's', hash: 'h', codeHash: 'c', deviceHash: 'd', deviceCookie: 'k', authorization: 'Bearer x' },
            route: { user: 'eclipse-user-7', salt: 'S', hash: 'H', scryptN: 32768 },
            held: [{ user: 'eclipse-user-7', peer: '192.168.20.40:5000', sha256: SHA }],
            keyFingerprint: 'AB:CD',
            fingerprint256: 'AA:BB',
            root: SHA,
            cloudRoot: SHA,
            cloudRootShort: '9f3c…c0a1',
            raw: { headHash: SHA, durableHash: SHA, headSeq: 9 },
            secret: null,
            peer: '192.168.20.31:8080',
            key: 'disk-free',
            code: 'tx-refused',
        }) as Record<string, any>;
        expect(out.token).toBe(REDACTED);
        expect(Object.values(out.nested).every(v => v === REDACTED)).toBe(true);
        expect(out.route).toBe(REDACTED);
        expect(out.held[0]).toEqual({ user: REDACTED, peer: '192.168.20.31:8080'.replace('31:8080', '40:5000'), sha256: REDACTED });
        expect([out.keyFingerprint, out.fingerprint256, out.root, out.cloudRoot, out.cloudRootShort]).toEqual([REDACTED, REDACTED, REDACTED, REDACTED, REDACTED]);
        expect(out.raw).toEqual({ headHash: REDACTED, durableHash: REDACTED, headSeq: 9 });
        expect(out.secret).toBeNull();
        // Operational fields stay: IPs, check keys, log codes.
        expect(out.peer).toBe('192.168.20.31:8080');
        expect(out.key).toBe('disk-free');
        expect(out.code).toBe('tx-refused');
    });

    it('drops anything that could hold transcript text, but keeps counts and positions', () => {
        const out = redactForDiagnostics({
            lines: [['00:00:00:00', ['MR SMITH: I was there'], 0]],
            text: 'MR SMITH: I was there',
            pages: [{ p: 1 }],
            note: 'free text',
            data: { lines: 2341, pages: 3, durationMs: 1_740_000 },
            lastLine: { page: 41, line: 18, atMs: NOW },
        }) as Record<string, any>;
        expect([out.lines, out.text, out.pages, out.note]).toEqual([REDACTED, REDACTED, REDACTED, REDACTED]);
        expect(out.data).toEqual({ lines: 2341, pages: 3, durationMs: 1_740_000 });
        expect(out.lastLine).toEqual({ page: 41, line: 18, atMs: NOW });
    });

    it('never lets a room code or an operator code through: code-shaped values, code keys and codes in free text', () => {
        const out = redactForDiagnostics({
            issued: { id: 'rc1', code: 'K7Q4M2', display: 'K7Q-4M2' },
            operator: { code: 'OPR6Z3K91', display: 'OPR-6Z3K-91', day: '2026-10-01' },
            roomCode: 'K7Q4M2',
            operatorCode: 'OPR6Z3K91',
            enrolCode: 'ABCD-EFGH',
            plaintext: 'anything',
            typed: { code: 'k7q-4m2' },
            message: 'operator typed OPR-6Z3K-91 and a reader typed K7Q-4M2 at 10:31',
            rows: [{ code: 'tx-refused' }, { code: 'KEY_UNCONFIRMED' }, { code: 'cloud-refused' }],
        }) as Record<string, any>;
        expect(out.issued).toEqual({ id: 'rc1', code: REDACTED, display: REDACTED });
        expect(out.operator).toEqual({ code: REDACTED, display: REDACTED, day: '2026-10-01' });
        expect([out.roomCode, out.operatorCode, out.enrolCode, out.plaintext, out.typed.code]).toEqual([REDACTED, REDACTED, REDACTED, REDACTED, REDACTED]);
        expect(out.message).toBe(`operator typed ${REDACTED} and a reader typed ${REDACTED} at 10:31`);
        // Machine codes (log codes, refusal codes) stay.
        expect(out.rows).toEqual([{ code: 'tx-refused' }, { code: 'KEY_UNCONFIRMED' }, { code: 'cloud-refused' }]);
        expect(scrubString('box VB-014 · day 2026-10-01 · session e7d1c2b0-0000-4000-8000-000000000014')).toBe('box VB-014 · day 2026-10-01 · session e7d1c2b0-0000-4000-8000-000000000014');
    });

    it('scrubs tokens, bearer headers, long hex, colon fingerprints and long base64 out of free text', () => {
        expect(scrubString(`rejected token ${JWT} from 10.0.0.5`)).toBe(`rejected token ${REDACTED} from 10.0.0.5`);
        expect(scrubString('header Authorization: Bearer abc.def-ghi')).toBe(`header Authorization: Bearer ${REDACTED}`);
        expect(scrubString(`root ${SHA} mismatch`)).toBe(`root ${REDACTED} mismatch`);
        expect(scrubString('fp AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99 ok')).toBe(`fp ${REDACTED} ok`);
        expect(scrubString('salt c2FsdHNhbHRzYWx0c2FsdHNhbHRzYWx0c2FsdHNhbHRzYWx0c2FsdA== end')).toBe(`salt ${REDACTED} end`);
        // Ordinary text, ids and paths survive.
        const plain = 'session e7d1c2b0-0000-4000-8000-000000000014 dialed 192.168.20.31:8080 (/var/lib/etabella-edge/journal)';
        expect(scrubString(plain)).toBe(plain);
    });

    it('is JSON-safe: numbers, buffers, maps, sets, errors, functions, cycles by depth', () => {
        const err = new Error(`boom ${JWT}`);
        const out = redactForDiagnostics({
            n: Number.NaN,
            inf: Number.POSITIVE_INFINITY,
            big: BigInt(12),
            buf: Buffer.from('x'),
            fn: () => 1,
            undef: undefined,
            map: new Map([['token', 'x'], ['ok', 'y']]),
            set: new Set(['a']),
            err,
        }) as Record<string, any>;
        expect(out).toEqual({ n: null, inf: null, big: '12', buf: '[binary]', map: { token: REDACTED, ok: 'y' }, set: ['a'], err: { name: 'Error', message: `boom ${REDACTED}` } });
        let deep: Record<string, unknown> = {};
        const root = deep;
        for (let i = 0; i < 40; i++) {
            deep.next = {};
            deep = deep.next as Record<string, unknown>;
        }
        expect(JSON.stringify(redactForDiagnostics(root))).toContain('[truncated]');
    });

    it('names the file etabella-box-<label>-<YYYYMMDD-HHmm>.zip in box-local time, with a safe label', () => {
        expect(diagnosticsStamp(NOW, 'Europe/London')).toBe('20261001-1030');
        expect(diagnosticsStamp(Date.UTC(2026, 9, 1, 23, 5), 'Europe/London')).toBe('20261002-0005');
        expect(diagnosticsFileName('VB-014', NOW, 'Europe/London')).toBe('etabella-box-VB-014-20261001-1030.zip');
        expect(diagnosticsFileName('Court 3 / "North"', NOW, 'Asia/Kolkata')).toBe('etabella-box-Court-3-North-20261001-1500.zip');
        expect(diagnosticsFileName('   ', NOW, 'Europe/London')).toBe('etabella-box-box-20261001-1030.zip');
    });

    it('builds a zip of README.txt + one redacted JSON file per section', () => {
        const file = buildDiagnosticsFile(
            [
                ['manifest', { versions: { sw: '1.0.3' } }],
                ['tokens', { token: JWT, note: 'x' }],
            ],
            'etabella-box-VB-014-20261001-1030.zip',
            NOW,
        );
        expect(file.contentType).toBe('application/zip');
        expect(file.fileName).toBe('etabella-box-VB-014-20261001-1030.zip');
        const entries = unzip(file.body);
        expect(entries.map(e => e.name)).toEqual(['README.txt', 'manifest.json', 'tokens.json']);
        expect(JSON.parse(entries[1].data.toString())).toEqual({ versions: { sw: '1.0.3' } });
        expect(JSON.parse(entries[2].data.toString())).toEqual({ token: REDACTED, note: REDACTED });
        expect(file.body.toString('latin1')).not.toContain(JWT.slice(0, 20));
    });
});
