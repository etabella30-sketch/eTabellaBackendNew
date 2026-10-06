import type { Response } from 'express';
import { DomainError } from '@app/api-kernel';

import { CODE_TABLE_LEGACY_SHAPES, codeTableFailureRow } from './legacy-shapes';
import { CORE_CODE_TABLE_ROUTE_ID, REALTIME_CODE_TABLE_ROUTE_ID } from './code-tables.controllers';

/*
 * The failure bodies each live host gave before the move, kept byte for byte: coreapi a one-row list, realtime-server
 * the bare row, both HTTP 200 (plan D7).
 */

function fakeResponse() {
  const sent: { status?: number; body?: unknown } = {};
  const res = { status: (code: number) => { sent.status = code; return res; }, json: (body: unknown) => { sent.body = body; return res; } } as unknown as Response;
  return { res, sent };
}

describe('CODE_TABLE_LEGACY_SHAPES', () => {
  const upstream = new DomainError('upstream', 'Failed to fetch', { error: 'db said no' });

  it('coreapi common/getcode: 200 with the failure row in a list; realtime-server issue/dynamiccombo: 200 with the bare row', () => {
    const core = fakeResponse();
    CODE_TABLE_LEGACY_SHAPES[CORE_CODE_TABLE_ROUTE_ID](core.res, upstream, CORE_CODE_TABLE_ROUTE_ID);
    expect([core.sent.status, core.sent.body]).toEqual([200, [{ msg: -1, value: 'Failed to fetch', error: 'db said no' }]]);
    const realtime = fakeResponse();
    CODE_TABLE_LEGACY_SHAPES[REALTIME_CODE_TABLE_ROUTE_ID](realtime.res, upstream, REALTIME_CODE_TABLE_ROUTE_ID);
    expect([realtime.sent.status, realtime.sent.body]).toEqual([200, { msg: -1, value: 'Failed to fetch', error: 'db said no' }]);
  });

  it('a DomainError without an error detail carries its message under error', () => {
    expect(codeTableFailureRow(new DomainError('unavailable', 'no database'))).toEqual({ msg: -1, value: 'Failed to fetch', error: 'no database' });
  });
});
