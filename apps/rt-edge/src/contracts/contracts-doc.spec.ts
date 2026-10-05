import * as fs from 'fs';
import * as path from 'path';

import { RT_SOURCES } from '../lan/rt-data/rt-data.service';
import { EDGE_ERROR_CODES, EDGE_ERROR_STATUS } from './errors';
import { VERDICT_KINDS, VERDICT_SEVERITY } from './verdict';

/** CONTRACTS.md is what the FE and support read: it must say what the box does. */
const DOC = fs.readFileSync(path.resolve(__dirname, '../../CONTRACTS.md'), 'utf8').replace(/\r\n/g, '\n');

function section(title: string, next: string): string {
    const from = DOC.indexOf(title);
    const to = DOC.indexOf(next, from + title.length);
    if (from < 0 || to < 0) throw new Error(`CONTRACTS.md has no section "${title}" followed by "${next}"`);
    return DOC.slice(from, to);
}

describe('CONTRACTS.md matches the box', () => {
    it('§3 lists exactly EDGE_ERROR_CODES, each with its HTTP status', () => {
        const table = section('## 3. Error codes', '## 4.');
        const rows = [...table.matchAll(/^\| `([a-z_]+)` \| (\d{3}) \|/gm)].map(m => [m[1], Number(m[2])]);
        expect(rows.map(([code]) => code).sort()).toEqual([...EDGE_ERROR_CODES].sort());
        for (const [code, status] of rows) expect([code, status]).toEqual([code, EDGE_ERROR_STATUS[code as keyof typeof EDGE_ERROR_STATUS]]);
    });

    it('§8.8 names the X-Edge-Source values the RT data routes send', () => {
        const m = /`X-Edge-Source` \(([^)]*)\)/.exec(section('### 8.8', '## 9.'));
        expect(m).not.toBeNull();
        expect([...m![1].matchAll(/`([a-z]+)`/g)].map(v => v[1])).toEqual([...RT_SOURCES]);
    });

    it('§8.4 promises no recovery percentage (the kernel reports progressPct null in v1)', () => {
        expect(section('### 8.4', '### 8.5')).toMatch(/`progressPct` is always `null` in v1/);
    });

    it('§8.4 ranks exactly VERDICT_KINDS, each with its severity (feed-quiet, cant-reach-etabella, captures-not-uploaded: user decision 2026-10-04)', () => {
        const rows = [...section('### 8.4', '### 8.5').matchAll(/^\| (\d+) \| `([a-z-]+)`[^|]*\| (critical|bad|warn) \|/gm)].map(m => [Number(m[1]), m[2], m[3]]);
        expect(rows).toEqual(VERDICT_KINDS.map((kind, rank) => [rank, kind, VERDICT_SEVERITY[kind]]));
    });

    it('§8.6 and §9.1 name the fields the box sends (network re-run, check applies / resolver, operator listen)', () => {
        const network = section('### 8.6', '### 8.7');
        expect(network).toContain('`NetworkChecksResponse { msg, running, checkedAtMs, everyMs, checks: NetworkCheck[] }`');
        expect(network).toContain('`{ key, ok, level, value, ms, applies, resolver }`');
        expect(section('### 9.1', '### 9.2')).toContain('problems, readinessToDo, listen: {address, port} }');
    });

    it('§3 and §8.8: a body over the limit is 413 payload_too_large, never invalid_request', () => {
        expect(EDGE_ERROR_STATUS.payload_too_large).toBe(413);
        expect(section('### 8.8', '## 9.')).toMatch(/body 1 MiB \(over it: 413 `payload_too_large`/);
    });

    it('every switched-off code route is named feature_disabled 404 where its errors are listed (§5.2, §6.3, §6.4, §8.1, §8.2)', () => {
        expect(EDGE_ERROR_STATUS.feature_disabled).toBe(404);
        for (const [from, to] of [
            ['### 5.2', '## 6.'],
            ['### 6.3', '### 6.4'],
            ['### 6.4', '### 6.5'],
            ['### 8.1', '### 8.2'],
            ['### 8.2', '### 8.3'],
        ]) {
            expect({ from, says: /404\s+`feature_disabled`|`feature_disabled`\s+404/.test(section(from, to)) }).toEqual({ from, says: true });
        }
    });

    it('§9 names the boot resync event the LAN gateway sends', () => {
        expect(section('## 9.', '### 9.1')).toContain("`realtime-events {type:'feed-resync', nSesid, rev}`");
    });
});

/** The runbook support reads must say what the box does too. */
describe('docs/rt-edge/runbook.md matches the box', () => {
    const RUNBOOK = fs.readFileSync(path.resolve(__dirname, '../../../../docs/rt-edge/runbook.md'), 'utf8').replace(/\r\n/g, '\n');

    it('names the same X-Edge-Source values as CONTRACTS.md §8.8 and the code', () => {
        const at = RUNBOOK.indexOf('`X-Edge-Source`');
        expect(at).toBeGreaterThan(0);
        const named = [...RUNBOOK.slice(at, RUNBOOK.indexOf('\n\n', at)).matchAll(/`(box|cloud|cache)`/g)].map(m => m[1]);
        expect(named).toEqual([...RT_SOURCES]);
    });

    it('says the code sign-ins answer 404 feature_disabled while off, promises no recovery percentage, and that rooms resync after a boot replay', () => {
        expect(RUNBOOK).toMatch(/404\s+(?:>\s*)?`feature_disabled`/);
        expect(RUNBOOK).toMatch(/v1 shows no percentage/);
        expect(RUNBOOK).toContain('`feed-resync`');
    });

    it('the box header table is one table (no paragraph breaks it)', () => {
        const head = RUNBOOK.slice(0, RUNBOOK.indexOf('## 0.'));
        const rows = head.split('\n').filter(l => l.startsWith('|'));
        const firstRow = head.split('\n').findIndex(l => l.startsWith('|'));
        expect(head.split('\n').slice(firstRow, firstRow + rows.length).every(l => l.startsWith('|'))).toBe(true);
    });
});
