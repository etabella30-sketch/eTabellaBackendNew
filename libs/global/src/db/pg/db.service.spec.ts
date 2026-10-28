import { isolatedSmokeMocker } from '@app/global/testing/isolated-smoke-mocker';
import { Test, TestingModule } from '@nestjs/testing';
import { types } from 'pg';
import { getTypeParser } from 'pg-types';
import { PG_TIMESTAMP_OID, pgWallClockTimestamp } from './db-timestamp';
import { DbService } from './db.service';

describe('DbService', () => {
  let service: DbService;

  // Read BEFORE the service exists: node-pg's own default turns the digits into a Date.
  const defaultTimestamp = getTypeParser(PG_TIMESTAMP_OID)('2026-10-28 10:49:33.549');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DbService],
    }).useMocker(isolatedSmokeMocker).compile();

    service = module.get<DbService>(DbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * R3-006: FactMaster.dCreateDt (now() digits of the DB zone) left coreapi/realtime-server
   * as "…T10:49:33.549Z" — the wall clock re-read in the Node zone and sent as an instant —
   * so Mark Nav dates, the Created filter and the 18 h live rule were 5:30 off for everyone.
   */
  describe('timestamp without time zone type parser', () => {
    it('is registered on node-pg once the service is built', () => {
      expect(defaultTimestamp).toBeInstanceOf(Date);
      expect(types.getTypeParser(PG_TIMESTAMP_OID)).toBe(pgWallClockTimestamp);
    });

    it('answers the column as the stored wall clock, without a Z', () => {
      const parse = types.getTypeParser(PG_TIMESTAMP_OID) as (text: string) => unknown;
      expect(parse('2026-10-28 10:49:33.549')).toBe('2026-10-28T10:49:33.549');
      expect(parse('2026-09-29 10:00:00')).toBe('2026-09-29T10:00:00');
      expect(JSON.stringify({ dCreateDt: parse('2026-10-28 10:49:33.549') })).toBe('{"dCreateDt":"2026-10-28T10:49:33.549"}');
    });

    it('leaves timestamp with time zone as the instant it is', () => {
      const tz = (types.getTypeParser(1184) as (text: string) => Date)('2026-10-28 10:49:33.549+05:30');
      expect(tz).toBeInstanceOf(Date);
      expect(tz.toISOString()).toBe('2026-10-28T05:19:33.549Z');
    });
  });
});
