/**
 * `GET /edge/local/metrics` (LAN only; spec §12): Prometheus text exposition format 0.0.4. Labels carry session ids,
 * never case or session names. Pure; specs beside.
 */

export type MetricType = 'gauge' | 'counter';

export interface MetricSample {
    readonly labels?: Readonly<Record<string, string>>;
    readonly value: number | null;
}

export interface MetricFamily {
    readonly name: string;
    readonly help: string;
    readonly type: MetricType;
    readonly samples: readonly MetricSample[];
}

const NAME_RE = /^[a-zA-Z_:][a-zA-Z0-9_:]*$/;
const LABEL_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/** Label value escaping (backslash, double quote, newline). */
export function escapeLabelValue(value: string): string {
    return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

const escapeHelp = (help: string): string => help.replace(/\\/g, '\\\\').replace(/\n/g, '\\n');

function formatValue(value: number): string {
    if (Number.isNaN(value)) return 'NaN';
    if (value === Number.POSITIVE_INFINITY) return '+Inf';
    if (value === Number.NEGATIVE_INFINITY) return '-Inf';
    return String(value);
}

/** Render the families; samples with a null value are skipped (a family with none keeps its HELP/TYPE). */
export function renderMetrics(families: readonly MetricFamily[]): string {
    const lines: string[] = [];
    for (const family of families) {
        if (!NAME_RE.test(family.name)) throw new Error(`metrics: invalid name "${family.name}"`);
        lines.push(`# HELP ${family.name} ${escapeHelp(family.help)}`);
        lines.push(`# TYPE ${family.name} ${family.type}`);
        for (const sample of family.samples) {
            if (sample.value === null || sample.value === undefined) continue;
            const labels = Object.entries(sample.labels ?? {});
            for (const [key] of labels) if (!LABEL_RE.test(key)) throw new Error(`metrics: invalid label "${key}"`);
            const labelText = labels.length ? `{${labels.map(([k, v]) => `${k}="${escapeLabelValue(v)}"`).join(',')}}` : '';
            lines.push(`${family.name}${labelText} ${formatValue(sample.value)}`);
        }
    }
    return `${lines.join('\n')}\n`;
}

export const bool = (v: boolean | null | undefined): number | null => (v === null || v === undefined ? null : v ? 1 : 0);
