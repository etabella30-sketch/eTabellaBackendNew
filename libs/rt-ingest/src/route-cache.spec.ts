import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { fileRoutesSource, normalizeRoute, RouteCache, RoutesSource } from './route-cache';
import { IngestAlert } from './types';

const cloudRoute = (nSesid: string, user: string) => ({
    nSesid,
    nCaseid: `case-${nSesid}`,
    label: `Day ${nSesid}`,
    nLines: 25,
    user,
    cTimezone: 'Europe/London',
    passwordSalt: 'c2FsdA==',
    passwordHash: 'aGFzaA==',
    passwordEnc: 'v1.secret.never.cached',
});

/** A source whose next read is scripted: a value, or an error. */
function scriptedSource() {
    let next: { value?: unknown; error?: Error } = { value: [] };
    let onChange: (() => void) | null = null;
    let reads = 0;
    const source: RoutesSource = {
        async read() {
            reads += 1;
            if (next.error) throw next.error;
            return next.value;
        },
        watch(cb) {
            onChange = cb;
            return () => {
                onChange = null;
            };
        },
        describe: () => 'scripted',
    };
    return {
        source,
        setValue: (value: unknown) => {
            next = { value };
        },
        setError: (error: Error) => {
            next = { error };
        },
        fire: () => onChange?.(),
        reads: () => reads,
    };
}

describe('normalizeRoute', () => {
    it('accepts the cloud route-file shape and never keeps passwordEnc', () => {
        const r = normalizeRoute(cloudRoute('s1', 'alok'))!;
        expect(r).toMatchObject({ nSesid: 's1', nCaseid: 'case-s1', user: 'alok', salt: 'c2FsdA==', hash: 'aGFzaA==', nLines: 25, tz: 'Europe/London', legacyPass: null, scryptN: null });
        expect(JSON.stringify(r)).not.toContain('never.cached');
    });

    it('accepts the box assignment shape ({route:{user,salt,hash,scryptN}}) and rev-3 fields', () => {
        const r = normalizeRoute({ nSesid: 's2', nCaseid: 'c', tz: 'Asia/Kolkata', nLines: 25, feedSource: 'E', nEdgeid: 7, epoch: 1, route: { user: 'u', salt: 'AA==', hash: 'BB==', scryptN: 32768 } })!;
        expect(r).toMatchObject({ nSesid: 's2', user: 'u', salt: 'AA==', hash: 'BB==', scryptN: 32768, tz: 'Asia/Kolkata', feedSource: 'E', nEdgeid: '7', epoch: 1 });
    });

    it('keeps a legacy plaintext route and rejects unusable entries', () => {
        expect(normalizeRoute({ nSesid: 's3', user: 'x', pass: 'p' })).toMatchObject({ legacyPass: 'p', salt: null });
        expect(normalizeRoute({ user: 'x', pass: 'p' })).toBeNull();
        expect(normalizeRoute({ nSesid: 's', pass: 'p' })).toBeNull();
        expect(normalizeRoute({ nSesid: 's', user: 'x' })).toBeNull();
        expect(normalizeRoute(null)).toBeNull();
        expect(normalizeRoute('nope')).toBeNull();
    });
});

describe('RouteCache', () => {
    it('loads routes and answers synchronous lookups by user and by session', async () => {
        const s = scriptedSource();
        s.setValue([cloudRoute('s1', 'alok'), cloudRoute('s2', 'bina')]);
        const cache = new RouteCache({ source: s.source, pollMs: 0 });
        const res = await cache.start();
        expect(res).toMatchObject({ ok: true, diff: { added: ['s1', 's2'], removed: [], changed: [] } });
        expect(cache.byUser('alok').map(r => r.nSesid)).toEqual(['s1']);
        expect(cache.byUser('ALOK')).toEqual([]); // exact match, as Eclipse sends it
        expect(cache.bySession('s2')!.user).toBe('bina');
        expect(cache.isLive('s1')).toBe(true);
        expect(cache.isLive('nope')).toBe(false);
        expect(cache.status()).toMatchObject({ loaded: true, count: 2, consecutiveErrors: 0 });
        cache.stop();
    });

    it('KEEPS the last good routes on a read error or a parse error, alerting once per error streak', async () => {
        const s = scriptedSource();
        const alerts: IngestAlert[] = [];
        s.setValue([cloudRoute('s1', 'alok')]);
        const cache = new RouteCache({ source: s.source, pollMs: 0, onAlert: a => alerts.push(a) });
        await cache.start();

        s.setError(Object.assign(new Error('EIO: i/o error'), { code: 'EIO' }));
        expect(await cache.refresh()).toMatchObject({ ok: false });
        expect(cache.isLive('s1')).toBe(true);
        expect(cache.byUser('alok')).toHaveLength(1);

        s.setError(new SyntaxError('Unexpected end of JSON input')); // a torn write
        expect((await cache.refresh()).ok).toBe(false);
        s.setValue({ not: 'an array' });
        expect((await cache.refresh()).error).toMatch(/expected an array/);
        expect(cache.isLive('s1')).toBe(true);
        expect(cache.status()).toMatchObject({ consecutiveErrors: 3, count: 1 });
        expect(alerts.filter(a => a.kind === 'ROUTES_READ_ERROR')).toHaveLength(1);
        expect(alerts[0]).toMatchObject({ tier: 'P2', data: { kept: 1 } });

        s.setValue([cloudRoute('s1', 'alok'), cloudRoute('s3', 'chen')]);
        expect((await cache.refresh()).ok).toBe(true);
        expect(cache.status()).toMatchObject({ consecutiveErrors: 0, lastError: null, count: 2 });
        s.setError(new Error('again'));
        await cache.refresh();
        expect(alerts.filter(a => a.kind === 'ROUTES_READ_ERROR')).toHaveLength(2); // a new streak
        cache.stop();
    });

    it('a failing first read leaves the cache empty (not loaded) until a good read', async () => {
        const s = scriptedSource();
        s.setError(new Error('EACCES'));
        const cache = new RouteCache({ source: s.source, pollMs: 0 });
        expect((await cache.start()).ok).toBe(false);
        expect(cache.status().loaded).toBe(false);
        s.setValue([cloudRoute('s1', 'a')]);
        await cache.refresh();
        expect(cache.isLive('s1')).toBe(true);
        cache.stop();
    });

    it('reports added / removed / changed sessions and notifies removals (a legitimate empty file removes everything)', async () => {
        const s = scriptedSource();
        const removed: string[] = [];
        const diffs: any[] = [];
        s.setValue([cloudRoute('s1', 'a'), cloudRoute('s2', 'b')]);
        const cache = new RouteCache({ source: s.source, pollMs: 0, onChange: d => diffs.push(d) });
        cache.onRemoved(id => removed.push(id));
        await cache.start();
        const changed = { ...cloudRoute('s2', 'b'), label: 'Renamed' };
        s.setValue([changed, cloudRoute('s4', 'd')]);
        await cache.refresh();
        expect(diffs[1]).toEqual({ added: ['s4'], removed: ['s1'], changed: ['s2'] });
        expect(removed).toEqual(['s1']);
        const gen = cache.generation;
        await cache.refresh(); // same content: no change, generation stable
        expect(cache.generation).toBe(gen);
        s.setValue([]);
        await cache.refresh();
        expect(removed.sort()).toEqual(['s1', 's2', 's4']);
        expect(cache.list()).toHaveLength(0);
        cache.stop();
    });

    it('skips unusable and duplicate entries without failing the read', async () => {
        const s = scriptedSource();
        s.setValue([cloudRoute('s1', 'a'), { junk: true }, cloudRoute('s1', 'dup'), cloudRoute('s2', 'a')]);
        const cache = new RouteCache({ source: s.source, pollMs: 0 });
        const res = await cache.start();
        expect(res).toMatchObject({ ok: true, skipped: 2 });
        expect(cache.byUser('a').map(r => r.nSesid)).toEqual(['s1', 's2']);
        cache.stop();
    });

    it('re-reads on a watch signal (debounced) and on the poll', async () => {
        const s = scriptedSource();
        s.setValue([cloudRoute('s1', 'a')]);
        const cache = new RouteCache({ source: s.source, pollMs: 40, debounceMs: 5 });
        await cache.start();
        const before = s.reads();
        s.setValue([cloudRoute('s1', 'a'), cloudRoute('s2', 'b')]);
        s.fire();
        s.fire();
        s.fire();
        await new Promise(resolve => setTimeout(resolve, 25));
        expect(cache.isLive('s2')).toBe(true);
        await new Promise(resolve => setTimeout(resolve, 120));
        expect(s.reads()).toBeGreaterThan(before + 1); // the poll kept reading
        cache.stop();
        const after = s.reads();
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(s.reads()).toBe(after);
    });

    it('coalesces concurrent refreshes', async () => {
        let resolveRead!: (v: unknown) => void;
        let reads = 0;
        const source: RoutesSource = {
            read: () => {
                reads += 1;
                return new Promise(resolve => (resolveRead = resolve));
            },
        };
        const cache = new RouteCache({ source, pollMs: 0 });
        const a = cache.refresh();
        const b = cache.refresh();
        expect(a).toBe(b);
        resolveRead([cloudRoute('s1', 'a')]);
        await a;
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(reads).toBe(2); // one coalesced re-read for the call made while in flight
        resolveRead([cloudRoute('s1', 'a')]);
    });
});

describe('fileRoutesSource', () => {
    let dir: string;
    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-ingest-routes-'));
    });
    afterEach(() => {
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it('treats a missing file as no routes, a torn file as an error, and keeps the last good routes', async () => {
        const file = path.join(dir, 'eclipse-routes.json');
        const cache = new RouteCache({ source: fileRoutesSource(file), pollMs: 0 });
        expect((await cache.start()).ok).toBe(true);
        expect(cache.list()).toHaveLength(0);
        fs.writeFileSync(file, JSON.stringify([cloudRoute('s1', 'alok')]));
        await cache.refresh();
        expect(cache.isLive('s1')).toBe(true);
        fs.writeFileSync(file, '[{"nSesid":"s1","user":"al'); // torn write
        expect((await cache.refresh()).ok).toBe(false);
        expect(cache.isLive('s1')).toBe(true);
        cache.stop();
    });

    it('notices a rewritten file through the directory watch', async () => {
        const file = path.join(dir, 'eclipse-routes.json');
        fs.writeFileSync(file, '[]');
        const cache = new RouteCache({ source: fileRoutesSource(file), pollMs: 0, debounceMs: 10 });
        await cache.start();
        fs.writeFileSync(file, JSON.stringify([cloudRoute('s9', 'z')]));
        const deadline = Date.now() + 3_000;
        while (!cache.isLive('s9') && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 20));
        expect(cache.isLive('s9')).toBe(true);
        cache.stop();
    });
});
