import { bool, escapeLabelValue, renderMetrics } from './metrics';

describe('renderMetrics (Prometheus text 0.0.4)', () => {
    it('writes HELP, TYPE and samples with escaped labels; skips null samples', () => {
        const text = renderMetrics([
            { name: 'rt_edge_up', help: 'Up.', type: 'gauge', samples: [{ value: 1 }] },
            {
                name: 'rt_edge_session_total_lines',
                help: 'Lines\nper session',
                type: 'gauge',
                samples: [
                    { labels: { nsesid: 's"1\\x\ny' }, value: 1018 },
                    { labels: { nsesid: 's2' }, value: null },
                ],
            },
            { name: 'rt_edge_bytes_total', help: 'Bytes.', type: 'counter', samples: [{ value: Number.POSITIVE_INFINITY }, { value: Number.NaN }] },
        ]);
        expect(text).toBe(
            [
                '# HELP rt_edge_up Up.',
                '# TYPE rt_edge_up gauge',
                'rt_edge_up 1',
                '# HELP rt_edge_session_total_lines Lines\\nper session',
                '# TYPE rt_edge_session_total_lines gauge',
                'rt_edge_session_total_lines{nsesid="s\\"1\\\\x\\ny"} 1018',
                '# HELP rt_edge_bytes_total Bytes.',
                '# TYPE rt_edge_bytes_total counter',
                'rt_edge_bytes_total +Inf',
                'rt_edge_bytes_total NaN',
                '',
            ].join('\n'),
        );
    });

    it('refuses invalid metric and label names', () => {
        expect(() => renderMetrics([{ name: '1bad', help: 'x', type: 'gauge', samples: [] }])).toThrow(/invalid name/);
        expect(() => renderMetrics([{ name: 'ok', help: 'x', type: 'gauge', samples: [{ labels: { 'bad-label': 'v' }, value: 1 }] }])).toThrow(/invalid label/);
    });

    it('bool maps to 1 / 0 / null', () => {
        expect([bool(true), bool(false), bool(null), bool(undefined)]).toEqual([1, 0, null, null]);
        expect(escapeLabelValue('plain')).toBe('plain');
    });
});
