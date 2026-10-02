/**
 * A per-session rev floor that survives a crash.
 *
 * The cut `rev` is an ordering token the LAN readers rely on (D20: a snapshot older than a page's rev is ignored),
 * so it must keep growing across a box restart. A checkpoint records the rev only every 60 s, and cuts published
 * after it carry higher revs. The kernel therefore persists a floor AHEAD of the published revs
 * (`rev + REV_FLOOR_STEP`, rewritten once the rev comes within half a step of it) in
 * `<journalDir>/<nSesid>/rev-floor.json`, and a recovered cutter starts above it. The file sits beside the journal
 * segments (readers list only `seg-*.ej`), so it moves with the journal and needs no database write per cut.
 */
import * as fs from 'fs';
import * as path from 'path';

import { assertSafeSessionId } from '@app/rt-ingest';

export const REV_FLOOR_FILE = 'rev-floor.json';
export const REV_FLOOR_STEP = 1_000;

function floorFile(journalRoot: string, nSesid: string): string {
    assertSafeSessionId(nSesid);
    return path.join(journalRoot, nSesid, REV_FLOOR_FILE);
}

/** The persisted floor; 0 when none or unreadable. */
export async function readRevFloor(journalRoot: string, nSesid: string): Promise<number> {
    try {
        const parsed = JSON.parse(await fs.promises.readFile(floorFile(journalRoot, nSesid), 'utf8'));
        const floor = Number(parsed?.floor);
        return Number.isSafeInteger(floor) && floor > 0 ? floor : 0;
    } catch {
        return 0;
    }
}

/** Atomically persist the floor (tmp + fsync + rename). Rejects on I/O failure (callers log it). */
export async function writeRevFloor(journalRoot: string, nSesid: string, floor: number): Promise<void> {
    const file = floorFile(journalRoot, nSesid);
    await fs.promises.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp-${process.pid}`;
    const handle = await fs.promises.open(tmp, 'w');
    try {
        await handle.writeFile(JSON.stringify({ floor }), 'utf8');
        await handle.sync();
    } finally {
        await handle.close();
    }
    await fs.promises.rename(tmp, file);
}

/** The floor to persist after a cut at `rev`, or null when the stored `floor` is still far enough ahead. */
export function nextRevFloor(rev: number, floor: number): number | null {
    return rev + REV_FLOOR_STEP / 2 > floor ? rev + REV_FLOOR_STEP : null;
}
