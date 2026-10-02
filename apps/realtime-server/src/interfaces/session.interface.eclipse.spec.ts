import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EclipseSessionCreateReq } from './session.interface';

/** The global pipe of main.ts: a key the DTO does not declare is a 400. */
const PIPE = { whitelist: true, forbidNonWhitelisted: true };

async function errorsOf(body: object): Promise<Record<string, string[]>> {
  const errors = await validate(plainToInstance(EclipseSessionCreateReq, body) as object, PIPE);
  return Object.fromEntries(errors.map((e) => [e.property, Object.keys(e.constraints ?? {})]));
}

/**
 * POST session/eclipse (spec §4.2 step 2): the feed-path keys cFeedSource, nEdgeid and nHearingOpid are declared
 * (forbidNonWhitelisted would 400 them otherwise), and cEclipsePassword becomes optional ONLY for a venue-box session
 * (the server generates one, S-D17). A direct-cloud request is validated exactly as before.
 */
describe('EclipseSessionCreateReq', () => {
  const base = {
    nCaseid: 'ca5e0000-0000-4000-8000-00000000000e',
    nUserid: '11111111-1111-4111-8111-111111111111',
    cCaseno: 'CASE 1',
    cName: 'Hearing day 1',
    dStartDt: '2026-10-05T10:00:00',
    nDays: 1,
    nLines: 25,
    nPageno: 1,
    permission: 'I',
    cUnicuserid: 'browser-1',
    cProtocol: 'B',
    bRefresh: false,
    cEclipseUsername: 'court3',
  };
  const BOX = 'b0c5b0c5-0000-4000-8000-0000000000b1';

  it("today's direct request passes, and still needs its password", async () => {
    expect(await errorsOf({ ...base, cEclipsePassword: 'secret' })).toEqual({});
    expect(Object.keys(await errorsOf(base))).toEqual(['cEclipsePassword']);
    expect(Object.keys(await errorsOf({ ...base, cFeedSource: 'D' }))).toEqual(['cEclipsePassword']);
    expect(Object.keys(await errorsOf({ ...base, cEclipsePassword: '' }))).toEqual(['cEclipsePassword']);
  });

  it('a venue-box request may leave the password out, and carries its box and hearing operator', async () => {
    expect(await errorsOf({ ...base, cFeedSource: 'E', nEdgeid: BOX, nHearingOpid: '22222222-2222-4222-8222-222222222222' })).toEqual({});
    expect(await errorsOf({ ...base, cFeedSource: 'E', nEdgeid: BOX, cEclipsePassword: 'a-long-typed-password' })).toEqual({});
  });

  it('a typed venue password is still checked (no line break)', async () => {
    expect(Object.keys(await errorsOf({ ...base, cFeedSource: 'E', nEdgeid: BOX, cEclipsePassword: 'two\nlines-password' }))).toEqual(['cEclipsePassword']);
  });

  it('refuses an unknown feed source and a box id that is not an id', async () => {
    expect(Object.keys(await errorsOf({ ...base, cEclipsePassword: 'secret', cFeedSource: 'W' }))).toEqual(['cFeedSource']);
    expect(Object.keys(await errorsOf({ ...base, cFeedSource: 'E', nEdgeid: 'box-1' }))).toEqual(['nEdgeid']);
  });
});
