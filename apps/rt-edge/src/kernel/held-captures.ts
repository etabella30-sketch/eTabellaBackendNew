/**
 * Held second CAT connections (orphan kind 'C', spec §3.2 capture.ts): rt-ingest's CaptureStore writes the bytes;
 * this subclass mirrors every capture into `StatePort.heldCaptures` when it opens and when it closes (sha256, end
 * time, size), so `rt-edge capture list|upload` and the uplink's `e.capture` work from the database. The capture id
 * is the capture file name without `.ej` (`C-<fromMs>-<connId>`), unique per box.
 */
import { CaptureMeta, CaptureOpenInfo, CaptureStore, CaptureStoreOptions, CaptureWriter } from '@app/rt-ingest';

import type { HeldCaptureRecord } from '../ports';

export function heldCaptureId(meta: Pick<CaptureMeta, 'file'>): string {
    return meta.file.replace(/\.ej$/, '');
}

export function heldCaptureRecord(meta: CaptureMeta, file: string): HeldCaptureRecord {
    return {
        id: heldCaptureId(meta),
        nSesid: meta.nSesid,
        kind: 'C',
        user: meta.user,
        peer: meta.peer,
        fromMs: meta.fromMs,
        toMs: meta.toMs,
        bytes: meta.bytes,
        sha256: meta.sha256,
        file,
        uploadedAtMs: null,
        nOrphanid: null,
    };
}

export class MirroredCaptureStore extends CaptureStore {
    constructor(
        opts: CaptureStoreOptions,
        private readonly mirror: (record: HeldCaptureRecord) => void,
    ) {
        super(opts);
    }

    open(info: CaptureOpenInfo): CaptureWriter {
        const writer = super.open(info);
        const file = this.filePath(writer.meta);
        this.safeMirror(heldCaptureRecord({ ...writer.meta }, file));
        const close = writer.close.bind(writer) as CaptureWriter['close'];
        writer.close = (reason?: string) =>
            close(reason).then(meta => {
                this.safeMirror(heldCaptureRecord(meta, file));
                return meta;
            });
        return writer;
    }

    /** Mirror captures already on disk (finalized by `init()` after a crash). */
    async mirrorExisting(): Promise<number> {
        let n = 0;
        for (const meta of await this.list()) {
            if (meta.kind !== 'C') continue;
            this.safeMirror(heldCaptureRecord(meta, this.filePath(meta)));
            n += 1;
        }
        return n;
    }

    private safeMirror(record: HeldCaptureRecord): void {
        try {
            this.mirror(record);
        } catch {
            /* the database must never stop a capture */
        }
    }
}
