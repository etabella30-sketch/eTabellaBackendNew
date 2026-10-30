/**
 * The counts run3.py prints at the end of a publish (2026-10-30 rule: every Mark with a
 * live time inside the hearing is placed, on its words or on the line at its time).
 */
export interface TransferCounts {
    readonly text?: number;
    readonly time?: number;
    readonly 'no-time'?: number;
    readonly 'outside-hearing'?: number;
    readonly delay?: number;
}

export interface TransferSummary {
    readonly marks: TransferCounts;
    readonly quickMarks: TransferCounts;
}

const SUMMARY_LINE = /TRANSFER SUMMARY (\{.*\})\s*$/m;

/** The last "TRANSFER SUMMARY {json}" line of run3.py's output; null when absent or unreadable. */
export function readTransferSummary(stdout: string): TransferSummary | null {
    const lines = (stdout || '').split(/\r?\n/).filter(line => line.includes('TRANSFER SUMMARY '));
    const match = lines.length ? SUMMARY_LINE.exec(lines[lines.length - 1]) : null;
    if (!match) return null;
    try {
        const parsed = JSON.parse(match[1]);
        return { marks: parsed?.marks ?? {}, quickMarks: parsed?.quickMarks ?? {} };
    } catch {
        return null;
    }
}

const n = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

/** "Published — 1,221 Marks moved (6 placed by time) · 8 need review"; "Published" without counts. */
export function publishedMessage(summary: TransferSummary | null | undefined): string {
    if (!summary) return 'Published';
    const both = [summary.marks ?? {}, summary.quickMarks ?? {}];
    const byTime = both.reduce((sum, c) => sum + n(c.time), 0);
    const moved = both.reduce((sum, c) => sum + n(c.text) + n(c.time), 0);
    const review = both.reduce((sum, c) => sum + n(c['no-time']) + n(c['outside-hearing']), 0);
    let message = `Published — ${moved.toLocaleString('en-US')} Mark${moved === 1 ? '' : 's'} moved`;
    if (byTime) message += ` (${byTime.toLocaleString('en-US')} placed by time)`;
    if (review) message += ` · ${review.toLocaleString('en-US')} need${review === 1 ? 's' : ''} review`;
    return message;
}
