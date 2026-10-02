import { BadRequestException, ConflictException, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
import { randomBytes, scryptSync } from 'crypto';
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';

import { EclipseSessionCreateReq } from '../../interfaces/session.interface';
import { EclipseSessionService, EDGE_ROUTE_SCRYPT_N, GENERATED_PASSWORD_LENGTH, generateEclipsePassword, isEdgeRoute } from './eclipse-session.service';

/*
 * Spec §4.2 "Create, cloud-first" for a venue-box session (edge-apply.port.ts "what step 8 must provide" item 7):
 * POST session/eclipse with cFeedSource 'E' runs the same insert + running SPs with a per-session cUnicuserid (S-D10),
 * binds the session to its box (et_rtedge_session_bind), writes the DORMANT route (feedSource 'E', nEdgeid, epoch,
 * scryptN 2^15), notifies 'R' and pushes the session to the box (best effort). A direct-cloud request is untouched:
 * the last describe pins that its SP calls and route are exactly today's.
 */

const CASE = 'ca5e0000-0000-4000-8000-00000000000e';
const USER = '11111111-1111-4111-8111-111111111111';
const BOX = 'b0c5b0c5-0000-4000-8000-0000000000b1';
const OPERATOR = '22222222-2222-4222-8222-222222222222';
const NEW = '5e550000-0000-4000-8000-0000000000e1';

const direct: EclipseSessionCreateReq = {
  nSesid: '',
  nCaseid: CASE,
  nUserid: USER,
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
  cEclipsePassword: 'secret',
};

const venue = (extra: Partial<EclipseSessionCreateReq> = {}): EclipseSessionCreateReq =>
  ({ ...direct, cEclipsePassword: 'a-long-typed-password', cFeedSource: 'E', nEdgeid: BOX, ...extra }) as EclipseSessionCreateReq;

const boundRow = (extra: Record<string, any> = {}) => ({
  msg: 1, value: 'Session bound to the venue box', bAlready: false, nSesid: NEW, nCaseid: CASE, nEdgeid: BOX, nIngestEpoch: 1,
  cSyncState: 'L', cParserVer: '1.1.0+46cac54d63e5095e', nHearingOpid: null, cEdgeName: 'Court 3 box', cLanIp: '10.20.0.5',
  nCatPort: 2500, dLastSeen: '2026-10-05T09:59:00Z', bEdgeOnline: true, ...extra,
});

/** The route's hash verifies `password` with the route's own scrypt cost. */
function routeVerifies(route: any, password: string): boolean {
  const salt = Buffer.from(route.passwordSalt, 'base64');
  const expected = Buffer.from(route.passwordHash, 'base64');
  const opts = route.scryptN ? { N: route.scryptN, maxmem: 64 * 1024 * 1024 } : undefined;
  return scryptSync(password, salt, expected.length, opts as any).equals(expected);
}

describe('EclipseSessionService: venue-box sessions (cFeedSource E)', () => {
  let tempDir: string;
  let runtimePath: string;
  let service: EclipseSessionService;
  let executeRef: jest.Mock;
  let rowQuery: jest.Mock;
  let emit: jest.Mock;
  let pushSessionUpsert: jest.Mock;
  let env: Record<string, string | undefined>;
  let bind: any;
  let rebind: any;
  let alert: jest.Mock;
  let logger: { error: jest.Mock; warn: jest.Mock; log: jest.Mock };

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'etabella-eclipse-edge-'));
    runtimePath = path.join(tempDir, 'sessions.runtime.json');
    env = {
      ECLIPSE_SESSION_CONFIG: runtimePath,
      ECLIPSE_FEED_HOST: '46.202.166.124',
      ECLIPSE_AUTH_PORT: '2500',
      JWT_SECRET: 'jwt-secret-for-tests',
      EDGE_ENABLED: '1',
    };
    bind = { success: true, data: [[boundRow()]] };
    // et_rtedge_session_rebind_direct (file 09): re-binds a never-fed 'E' / 'L' session; CONFLICT when nothing is bound.
    rebind = { success: true, data: [[{ msg: 1, value: 'The session now feeds the cloud directly', nSesid: NEW, nCaseid: CASE }]] };
    executeRef = jest.fn(async (ref: string, body: any) => {
      if (ref === 'realtime_insertupdate_session') {
        return body?.permission === 'N' ? { success: true, data: [[{ msg: 1, nSesid: NEW, nCaseid: CASE }]] } : { success: true, data: [[{ msg: 1 }]] };
      }
      if (ref === 'realtime_update_running_session') return { success: true, data: [[{ msg: 1 }]] };
      if (ref === 'rtedge_session_bind') return bind;
      if (ref === 'rtedge_session_rebind_direct') return rebind;
      throw new Error(`unexpected SP ${ref}`);
    });
    rowQuery = jest.fn(async (_sql: string, params: any[]) => ({
      success: true,
      data: (params[0] as string[]).map((nSesid) => ({ nSesid, bLive: false })),
    }));
    emit = jest.fn();
    pushSessionUpsert = jest.fn(async () => ({ delivered: true }));
    alert = jest.fn();
    logger = { error: jest.fn(), warn: jest.fn(), log: jest.fn() };
    service = Object.create(EclipseSessionService.prototype) as EclipseSessionService;
    Object.assign(service as object, {
      eclipseCreateQueue: Promise.resolve(),
      config: { get: jest.fn((key: string) => env[key]) },
      logger,
      db: { executeRef, rowQuery },
      ios: { server: { emit } },
      edgeRegistry: { pushSessionUpsert, alert },
    });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const routes = async () => JSON.parse(await fs.readFile(runtimePath, 'utf8'));
  const flush = () => new Promise((resolve) => setImmediate(resolve));

  it('creates, binds, writes the dormant route, notifies R and pushes to the box, in that order', async () => {
    const res = await service.createEclipseSession(venue({ nHearingOpid: OPERATOR }));
    await flush();

    const calls = executeRef.mock.calls.map((c) => [c[0], c[1]]);
    expect(calls.map((c) => c[0])).toEqual(['realtime_insertupdate_session', 'realtime_update_running_session', 'rtedge_session_bind']);
    const [insert, running, bound] = calls.map((c) => c[1]);
    // S-D10: one per-session id on both SP calls, never the creator's browser id
    expect(insert.cUnicuserid).toMatch(/^sess:[0-9a-f-]{36}$/);
    expect(running).toEqual({ nSesid: NEW, cUnicuserid: insert.cUnicuserid, dDate: direct.dStartDt });
    expect(insert).toMatchObject({ permission: 'N', nCaseid: CASE, cName: direct.cName, cTimezone: expect.any(String) });
    for (const key of ['cEclipseUsername', 'cEclipsePassword', 'cFeedSource', 'nEdgeid', 'nHearingOpid']) expect(insert).not.toHaveProperty(key);
    expect(bound).toEqual({ nSesid: NEW, nEdgeid: BOX, nHearingOpid: OPERATOR, nMasterid: USER });

    const [route] = await routes();
    expect(route).toMatchObject({ nSesid: NEW, nCaseid: CASE, user: 'court3', feedSource: 'E', nEdgeid: BOX, epoch: 1, scryptN: EDGE_ROUTE_SCRYPT_N });
    expect(route.passwordEnc).toMatch(/^v1\./);
    expect(route).not.toHaveProperty('pass');
    expect(routeVerifies(route, 'a-long-typed-password')).toBe(true);
    expect(isEdgeRoute(route)).toBe(true);
    // the reveal keeps working on the dormant route
    await expect(service.revealEclipseCredential(NEW, 'admin')).resolves.toMatchObject({ cEclipsePassword: 'a-long-typed-password' });

    expect(emit).toHaveBeenCalledWith('on-notification', { msg: 1, nSesid: NEW, nCaseid: CASE, cStatus: 'R' });
    expect(pushSessionUpsert).toHaveBeenCalledWith(BOX, NEW);
    expect(res).toMatchObject({
      msg: 1, nSesid: NEW, nCaseid: CASE, cName: direct.cName, cEclipseUsername: 'court3',
      cHost: '10.20.0.5', nPort: 2500, cFeedSource: 'E', nEdgeid: BOX, cEdgeName: 'Court 3 box',
      cSyncState: 'L', edgeOnline: true, edgeReady: false,
    });
    expect(res).not.toHaveProperty('cEclipsePassword');
  });

  it('generates the Eclipse password when none is typed (S-D17) and shows it once in the answer', async () => {
    const body = venue();
    delete (body as any).cEclipsePassword;
    const res = await service.createEclipseSession(body);
    expect(res.bPasswordGenerated).toBe(true);
    expect(res.cEclipsePassword).toMatch(new RegExp(`^[A-Za-z2-9]{${GENERATED_PASSWORD_LENGTH}}$`));
    const [route] = await routes();
    expect(routeVerifies(route, res.cEclipsePassword)).toBe(true);
    expect(JSON.stringify(await routes())).not.toContain(res.cEclipsePassword);
  });

  it('generated passwords avoid look-alike characters and differ', () => {
    const a = generateEclipsePassword();
    expect(a).not.toMatch(/[0O1lI]/);
    expect(generateEclipsePassword()).not.toBe(a);
  });

  it('refuses a typed password shorter than 12 characters, before anything is created', async () => {
    await expect(service.createEclipseSession(venue({ cEclipsePassword: 'short-pw' }))).rejects.toBeInstanceOf(BadRequestException);
    expect(executeRef).not.toHaveBeenCalled();
  });

  it('needs the box id', async () => {
    await expect(service.createEclipseSession(venue({ nEdgeid: undefined }))).rejects.toBeInstanceOf(BadRequestException);
    expect(executeRef).not.toHaveBeenCalled();
  });

  it('is refused while the venue edge is switched off (EDGE_ENABLED, the rollback switch)', async () => {
    env.EDGE_ENABLED = '0';
    await expect(service.createEclipseSession(venue())).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(executeRef).not.toHaveBeenCalled();
  });

  it('a bind the box refuses ends the new session and leaves no route', async () => {
    bind = { success: true, data: [[{ msg: -2, value: 'This case is not assigned to the venue box', cCode: 'UNASSIGNED_CASE' }]] };
    await expect(service.createEclipseSession(venue())).resolves.toEqual({
      msg: -1, value: 'This case is not assigned to the venue box', cCode: 'UNASSIGNED_CASE',
    });
    expect(executeRef).toHaveBeenLastCalledWith('realtime_insertupdate_session', { nSesid: NEW, permission: 'C' });
    expect(await routes()).toEqual([]);
    expect(pushSessionUpsert).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
    // nothing was bound, so there is nothing to undo
    expect(executeRef.mock.calls.map((c) => c[0])).not.toContain('rtedge_session_rebind_direct');
  });

  it('a failing bind call ends the new session too (the unbind is tried, since the call may have committed; its refusal stays quiet)', async () => {
    bind = { success: false, error: 'function et_rtedge_session_bind does not exist' };
    rebind = { success: true, data: [[{ msg: -2, value: 'The session is no longer a live, never-fed session on this venue box', cCode: 'CONFLICT' }]] };
    await expect(service.createEclipseSession(venue())).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(executeRef.mock.calls.map((c) => c[0])).toEqual([
      'realtime_insertupdate_session', 'realtime_update_running_session', 'rtedge_session_bind', 'rtedge_session_rebind_direct', 'realtime_insertupdate_session',
    ]);
    expect(executeRef).toHaveBeenLastCalledWith('realtime_insertupdate_session', { nSesid: NEW, permission: 'C' });
    expect(alert).not.toHaveBeenCalled();
  });

  // Regression (review item 18): a failure after a successful bind used to end the session with the legacy SP 'C'
  // only, leaving it cFeedSource 'E', bEverEdge, nEdgeid and cSyncState 'L': its box was handed it as an upsert.
  it('a route write that fails after the bind unbinds the session first, then ends it; no route, no push, no R', async () => {
    jest.spyOn(service as any, 'writeEclipseRoute').mockRejectedValueOnce(new Error('disk full'));
    await expect(service.createEclipseSession(venue())).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(executeRef.mock.calls.map((c) => c[0])).toEqual([
      'realtime_insertupdate_session', 'realtime_update_running_session', 'rtedge_session_bind', 'rtedge_session_rebind_direct', 'realtime_insertupdate_session',
    ]);
    expect(executeRef.mock.calls[3][1]).toEqual({ nSesid: NEW, nEdgeid: BOX });
    expect(executeRef).toHaveBeenLastCalledWith('realtime_insertupdate_session', { nSesid: NEW, permission: 'C' });
    expect(await routes()).toEqual([]);
    expect(pushSessionUpsert).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();
  });

  it('a binding that cannot be undone raises an admin alert, and the session is still ended with no route', async () => {
    jest.spyOn(service as any, 'writeEclipseRoute').mockRejectedValueOnce(new Error('disk full'));
    rebind = { success: false, error: 'connection reset' };
    await expect(service.createEclipseSession(venue())).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(alert).toHaveBeenCalledWith(expect.objectContaining({
      kind: 'VENUE_CREATE_UNBIND_FAILED', tier: 'P2', nSesid: NEW, nEdgeid: BOX, data: { reason: 'connection reset' },
    }));
    expect(executeRef).toHaveBeenLastCalledWith('realtime_insertupdate_session', { nSesid: NEW, permission: 'C' });
    expect(await routes()).toEqual([]);

    // Without the edge registry it is an error line, and nothing throws.
    (service as any).edgeRegistry = undefined;
    jest.spyOn(service as any, 'writeEclipseRoute').mockRejectedValueOnce(new Error('disk full'));
    await expect(service.createEclipseSession(venue())).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('the binding could not be undone (connection reset)'));
  });

  it('a push that fails or finds the box offline never fails the create', async () => {
    pushSessionUpsert.mockRejectedValueOnce(new Error('socket gone'));
    await expect(service.createEclipseSession(venue())).resolves.toMatchObject({ msg: 1, edgeReady: false });
    await flush();
    pushSessionUpsert.mockResolvedValueOnce({ delivered: false, reason: 'NOT_CONNECTED' });
    await fs.writeFile(runtimePath, '[]');
    await expect(service.createEclipseSession(venue({ nCaseid: 'ca5e0000-0000-4000-8000-0000000000ff' }))).resolves.toMatchObject({ msg: 1 });
  });

  it('without the edge registry the session is still created (the box pulls it on its next hello)', async () => {
    (service as any).edgeRegistry = undefined;
    await expect(service.createEclipseSession(venue())).resolves.toMatchObject({ msg: 1, cFeedSource: 'E' });
  });

  it('cHost is null until the box has reported its LAN address', async () => {
    bind = { success: true, data: [[boundRow({ cLanIp: null, nCatPort: null, bEdgeOnline: false })]] };
    await expect(service.createEclipseSession(venue())).resolves.toMatchObject({ cHost: null, nPort: 2500, edgeOnline: false });
  });

  // The reporter connection typed in cloud admin (cReporterIp + nReporterPort): the box dials that address by itself.
  // It is stored by the bind (2026-10-02_rt_edge_11), never by the legacy insert SP, and echoed in the answer. Both
  // keys are optional and go together; without them every SP receives the request it received before.
  describe('reporter connection (cReporterIp + nReporterPort)', () => {
    const REPORTER = { cReporterIp: '192.168.1.20', nReporterPort: 2500 };
    const spBodies = () => executeRef.mock.calls.map((c) => c[1]);

    it('goes to the bind with the other venue keys, never to the legacy SPs or the route, and is echoed as stored', async () => {
      bind = { success: true, data: [[boundRow({ nHearingOpid: OPERATOR, ...REPORTER })]] };
      const res = await service.createEclipseSession(venue({ nHearingOpid: OPERATOR, ...REPORTER }));
      await flush();

      expect(executeRef.mock.calls.map((c) => c[0])).toEqual(['realtime_insertupdate_session', 'realtime_update_running_session', 'rtedge_session_bind']);
      const [insert, running, bound] = spBodies();
      for (const key of ['cReporterIp', 'nReporterPort']) {
        expect(insert).not.toHaveProperty(key);
        expect(running).not.toHaveProperty(key);
      }
      expect(bound).toEqual({ nSesid: NEW, nEdgeid: BOX, nHearingOpid: OPERATOR, nMasterid: USER, ...REPORTER });
      expect(res).toMatchObject({ msg: 1, nSesid: NEW, cFeedSource: 'E', cHost: '10.20.0.5', nPort: 2500, ...REPORTER });
      // The box gets it in its assignment (et_rtedge_assignments r3), not from the route file.
      const [route] = await routes();
      expect(Object.keys(route).filter((k) => /reporter/i.test(k))).toEqual([]);
      expect(pushSessionUpsert).toHaveBeenCalledWith(BOX, NEW);
    });

    it('trims the address and reads a numeric string port, as the DTO would have', async () => {
      bind = { success: true, data: [[boundRow(REPORTER)]] };
      await service.createEclipseSession(venue({ cReporterIp: ' 192.168.1.20 ', nReporterPort: '2500' as any }));
      expect(spBodies()[2]).toEqual({ nSesid: NEW, nEdgeid: BOX, nMasterid: USER, ...REPORTER });
    });

    it('without them the SPs receive the request they received before, and the answer says null', async () => {
      const strip = ({ cUnicuserid: _perSession, ...rest }: any) => rest;
      const res = await service.createEclipseSession(venue({ nHearingOpid: OPERATOR }));
      const before = spBodies();
      expect(before[2]).toEqual({ nSesid: NEW, nEdgeid: BOX, nHearingOpid: OPERATOR, nMasterid: USER });
      expect(res).toMatchObject({ msg: 1, cReporterIp: null, nReporterPort: null });

      // An empty form field ('' or null) is "not sent": the same three requests.
      for (const empty of [{ cReporterIp: '', nReporterPort: null }, { cReporterIp: null, nReporterPort: '' }, { cReporterIp: undefined, nReporterPort: undefined }]) {
        await fs.writeFile(runtimePath, '[]');
        executeRef.mockClear();
        await expect(service.createEclipseSession(venue({ nHearingOpid: OPERATOR, ...(empty as any) }))).resolves.toMatchObject({ msg: 1, cReporterIp: null, nReporterPort: null });
        const now = spBodies();
        expect(now.map(strip)).toEqual(before.map(strip));
        for (const body of now) expect(Object.keys(body).filter((k) => /reporter/i.test(k))).toEqual([]);
      }

      // And with them only the bind differs.
      await fs.writeFile(runtimePath, '[]');
      executeRef.mockClear();
      bind = { success: true, data: [[boundRow(REPORTER)]] };
      await service.createEclipseSession(venue({ nHearingOpid: OPERATOR, ...REPORTER }));
      const withKeys = spBodies();
      expect(withKeys.slice(0, 2).map(strip)).toEqual(before.slice(0, 2).map(strip));
      expect(withKeys[2]).toEqual({ ...before[2], ...REPORTER });
    });

    it.each([
      ['the address alone', { cReporterIp: '192.168.1.20' }],
      ['the port alone', { nReporterPort: 2500 }],
      ['the address with an empty port', { cReporterIp: '192.168.1.20', nReporterPort: '' }],
      ['the port with an empty address', { cReporterIp: null, nReporterPort: 2500 }],
    ])('%s is a 400 before anything is created', async (_what, keys) => {
      const attempt = service.createEclipseSession(venue(keys as any));
      await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
      await expect(attempt).rejects.toThrow('cReporterIp and nReporterPort go together: send both, or neither');
      expect(executeRef).not.toHaveBeenCalled();
      expect(pushSessionUpsert).not.toHaveBeenCalled();
    });

    it.each([
      ['a host name', { cReporterIp: 'reporter-laptop', nReporterPort: 2500 }],
      ['a leading zero', { cReporterIp: '192.168.01.20', nReporterPort: 2500 }],
      ['an IPv6 address', { cReporterIp: 'fe80::1', nReporterPort: 2500 }],
      ['port 0', { cReporterIp: '192.168.1.20', nReporterPort: 0 }],
      ['port 65536', { cReporterIp: '192.168.1.20', nReporterPort: 65536 }],
      ['a fractional port', { cReporterIp: '192.168.1.20', nReporterPort: 2500.5 }],
      ['a hex port', { cReporterIp: '192.168.1.20', nReporterPort: '0x50' }],
      ['an exponent port', { cReporterIp: '192.168.1.20', nReporterPort: '25e2' }],
    ])('%s is a 400 before anything is created (the service repeats the DTO rule)', async (_what, keys) => {
      await expect(service.createEclipseSession(venue(keys as any))).rejects.toBeInstanceOf(BadRequestException);
      expect(executeRef).not.toHaveBeenCalled();
    });

    // The box connects to a reporter address only for a session that pins its protocol ('B' Bridge, 'C' Case view) and
    // refuses the address otherwise ('protocol-unknown'), with nothing said at the create: so the create says it.
    it.each([
      ['no protocol', { cProtocol: undefined }],
      ['an empty protocol', { cProtocol: '' }],
      ['an unknown protocol', { cProtocol: 'X' }],
      ['a lower-case protocol (it is stored and sent as typed)', { cProtocol: 'b' }],
    ])('a reporter address with %s is a 400 before anything is created', async (_what, keys) => {
      const attempt = service.createEclipseSession(venue({ ...REPORTER, ...keys }));
      await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
      await expect(attempt).rejects.toThrow('Choose the protocol (Case view or Bridge) when a reporter address is given.');
      expect(executeRef).not.toHaveBeenCalled();
      expect(pushSessionUpsert).not.toHaveBeenCalled();
    });

    it.each(['B', 'C'])("a reporter address with protocol '%s' is created, and the protocol reaches the insert as before", async (cProtocol) => {
      bind = { success: true, data: [[boundRow(REPORTER)]] };
      await expect(service.createEclipseSession(venue({ ...REPORTER, cProtocol }))).resolves.toMatchObject({ msg: 1, ...REPORTER });
      expect(spBodies()[0]).toMatchObject({ permission: 'N', cProtocol });
      expect(spBodies()[2]).toEqual({ nSesid: NEW, nEdgeid: BOX, nMasterid: USER, ...REPORTER });
    });

    it('half a reporter connection without a protocol is still the "go together" 400 (the pair is checked first)', async () => {
      await expect(service.createEclipseSession(venue({ cReporterIp: '192.168.1.20', cProtocol: undefined })))
        .rejects.toThrow('cReporterIp and nReporterPort go together: send both, or neither');
      expect(executeRef).not.toHaveBeenCalled();
    });

    it.each([
      ['no protocol', { cProtocol: undefined }],
      ['an empty protocol', { cProtocol: '' }],
      ['an unknown protocol', { cProtocol: 'X' }],
    ])('a request without a reporter address needs no protocol: %s is created as before', async (_what, keys) => {
      await expect(service.createEclipseSession(venue(keys))).resolves.toMatchObject({ msg: 1, cReporterIp: null, nReporterPort: null });
      // Empty form fields are "not sent": the same answer.
      await fs.writeFile(runtimePath, '[]');
      await expect(service.createEclipseSession(venue({ ...keys, cReporterIp: '', nReporterPort: null } as any))).resolves.toMatchObject({ msg: 1, cReporterIp: null, nReporterPort: null });
      for (const body of spBodies()) expect(Object.keys(body).filter((k) => /reporter/i.test(k))).toEqual([]);
    });

    it('a bind that did not store it (a database without 2026-10-02_rt_edge_11) refuses the create and undoes it', async () => {
      // boundRow() has no cReporterIp / nReporterPort: the older SP ignores the two keys.
      await expect(service.createEclipseSession(venue(REPORTER))).resolves.toEqual({
        msg: -1, value: expect.stringContaining('could not be saved'), cCode: 'REPORTER_NOT_STORED',
      });
      expect(executeRef.mock.calls.map((c) => c[0])).toEqual([
        'realtime_insertupdate_session', 'realtime_update_running_session', 'rtedge_session_bind', 'rtedge_session_rebind_direct', 'realtime_insertupdate_session',
      ]);
      expect(executeRef.mock.calls[3][1]).toEqual({ nSesid: NEW, nEdgeid: BOX });
      expect(executeRef).toHaveBeenLastCalledWith('realtime_insertupdate_session', { nSesid: NEW, permission: 'C' });
      expect(await routes()).toEqual([]);
      expect(pushSessionUpsert).not.toHaveBeenCalled();
      expect(emit).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('did not store the reporter connection'));

      // The same database still takes a session without a reporter connection, as before.
      executeRef.mockClear();
      await expect(service.createEclipseSession(venue())).resolves.toMatchObject({ msg: 1, cReporterIp: null, nReporterPort: null });
    });

    it('a half-stored or malformed pair in the bind answer is echoed as null, never as half a connection', async () => {
      bind = { success: true, data: [[boundRow({ cReporterIp: '192.168.1.20', nReporterPort: null })]] };
      await expect(service.createEclipseSession(venue())).resolves.toMatchObject({ msg: 1, cReporterIp: null, nReporterPort: null });
      await fs.writeFile(runtimePath, '[]');
      bind = { success: true, data: [[boundRow({ cReporterIp: 'not-an-address', nReporterPort: 2500 })]] };
      await expect(service.createEclipseSession(venue())).resolves.toMatchObject({ msg: 1, cReporterIp: null, nReporterPort: null });
    });
  });

  describe('dormant routes and the pruning of leftovers', () => {
    it("never prunes a venue-box route, even when its session is no longer 'live' (it ends at its seal)", async () => {
      await fs.writeFile(runtimePath, JSON.stringify([
        { nSesid: 'venue-ending', nCaseid: 'case-9', feedSource: 'E', nEdgeid: BOX },
        { nSesid: 'direct-leftover', nCaseid: 'case-8' },
      ]));
      await service.createEclipseSession(venue());
      // only the direct route is looked up
      expect(rowQuery).toHaveBeenCalledWith(expect.stringContaining('"RSessionMaster"'), [['direct-leftover'], 18]);
      expect((await routes()).map((r: any) => r.nSesid).sort()).toEqual([NEW, 'venue-ending']);
    });

    it("a venue-box route still blocks its case: a second create is a conflict", async () => {
      await fs.writeFile(runtimePath, JSON.stringify([{ nSesid: 'venue-live', nCaseid: CASE, feedSource: 'E', nEdgeid: BOX }]));
      await expect(service.createEclipseSession(venue())).rejects.toBeInstanceOf(ConflictException);
      await expect(service.createEclipseSession(direct)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  // Review C4: spec §4.4 ends a venue session as a request (SP 'C', cSyncState 'S') and defers its route removal to the
  // seal; until then its dormant route used to block every new session of the case (hearing over, box still draining).
  describe('C4: the dormant route of an ended venue session waiting for its seal', () => {
    const OLD = '0d0d0d0d-0000-4000-8000-0000000000aa';
    const oldRoute = { nSesid: OLD, nCaseid: CASE, label: 'Hearing day 0', user: 'court3-day0', passwordSalt: 'c2FsdA==', passwordHash: 'aGFzaA==', feedSource: 'E', nEdgeid: BOX, epoch: 1, scryptN: EDGE_ROUTE_SCRYPT_N };
    const STATE_SQL = '"cSyncState"';
    /**
     * The DB answers the venue sessions' sync states from `states` (absent = no row; `next` = a split's later part
     * is live); a direct route's session is live (the leftover pruning keeps it).
     */
    const answer = (states: Record<string, string | null>, next: string[] = []) => rowQuery.mockImplementation(async (sql: string, params: any[]) => (
      sql.includes(STATE_SQL)
        ? { success: true, data: (params[0] as string[]).filter((id) => id in states).map((nSesid) => ({ nSesid, cSyncState: states[nSesid], bLiveNextPart: next.includes(nSesid) })) }
        : { success: true, data: (params[0] as string[]).map((nSesid) => ({ nSesid, bLive: true })) }));
    const stateReads = () => rowQuery.mock.calls.filter((c) => String(c[0]).includes(STATE_SQL));

    it.each(['S', 'K', 'W', 'F'])("no longer blocks a new venue or direct session of the case once it ended ('%s'), and stays until its own removal", async (state) => {
      await fs.writeFile(runtimePath, JSON.stringify([oldRoute]));
      answer({ [OLD]: state });
      await expect(service.createEclipseSession(venue())).resolves.toMatchObject({ msg: 1, nSesid: NEW });
      expect(stateReads()[0][1]).toEqual([[OLD]]);
      // The old dormant route is kept (one route per case does not apply to it): the cloud listener still holds a
      // direct stream for it, and its seal removes it by its own id.
      expect((await routes()).map((r: any) => r.nSesid)).toEqual([OLD, NEW]);
      await service.removeEclipseRoute(OLD);
      expect((await routes()).map((r: any) => r.nSesid)).toEqual([NEW]);

      // The same for a direct-cloud create.
      await fs.writeFile(runtimePath, JSON.stringify([oldRoute]));
      await expect(service.createEclipseSession({ ...direct })).resolves.toMatchObject({ msg: 1, nSesid: NEW });
      expect((await routes()).map((r: any) => r.nSesid)).toEqual([OLD, NEW]);
    });

    it("keeps blocking for a live venue session ('L'), and whenever the state is not known: no row, a failed or throwing read, a non-uuid id", async () => {
      await fs.writeFile(runtimePath, JSON.stringify([oldRoute]));
      answer({ [OLD]: 'L' });
      await expect(service.createEclipseSession(venue())).rejects.toBeInstanceOf(ConflictException);
      await expect(service.createEclipseSession({ ...direct })).rejects.toBeInstanceOf(ConflictException);
      answer({});
      await expect(service.createEclipseSession(venue())).rejects.toBeInstanceOf(ConflictException);
      answer({ [OLD]: null });
      await expect(service.createEclipseSession(venue())).rejects.toBeInstanceOf(ConflictException);
      rowQuery.mockImplementation(async (sql: string) => (sql.includes(STATE_SQL) ? { success: false, error: 'db down' } : { success: true, data: [] }));
      await expect(service.createEclipseSession(venue())).rejects.toBeInstanceOf(ConflictException);
      rowQuery.mockImplementation(async (sql: string) => {
        if (sql.includes(STATE_SQL)) throw new Error('connection reset');
        return { success: true, data: [] };
      });
      await expect(service.createEclipseSession(venue())).rejects.toBeInstanceOf(ConflictException);
      expect(executeRef).not.toHaveBeenCalled();
      expect((await routes()).map((r: any) => r.nSesid)).toEqual([OLD]);
    });

    it("keeps blocking for a split's Part 1 ('S') whose hearing goes on live as Part 2 (a failed route move left Part 1's route here)", async () => {
      await fs.writeFile(runtimePath, JSON.stringify([oldRoute]));
      answer({ [OLD]: 'S' }, [OLD]);
      await expect(service.createEclipseSession(venue())).rejects.toBeInstanceOf(ConflictException);
      await expect(service.createEclipseSession({ ...direct })).rejects.toBeInstanceOf(ConflictException);
      expect(String(stateReads()[0][0])).toContain('"nPrevPartSesid" = r."nSesid"');
      expect(executeRef).not.toHaveBeenCalled();
    });

    it('still blocks when the case also has a direct route, and reads no state when the case has no venue route', async () => {
      await fs.writeFile(runtimePath, JSON.stringify([oldRoute, { nSesid: 'direct-live', nCaseid: CASE, user: 'court3-x' }]));
      answer({ [OLD]: 'S', 'direct-live': 'S' });
      await expect(service.createEclipseSession({ ...direct })).rejects.toBeInstanceOf(ConflictException);
      expect(stateReads()).toHaveLength(0);
      await fs.writeFile(runtimePath, JSON.stringify([{ ...oldRoute, nCaseid: 'ca5e0000-0000-4000-8000-0000000000ff' }]));
      await expect(service.createEclipseSession({ ...direct })).resolves.toMatchObject({ msg: 1 });
      expect(stateReads()).toHaveLength(0);
    });

    it("an ended session's Eclipse login is still refused until its seal removes the route (open product question)", async () => {
      const salt = randomBytes(16);
      const hash = scryptSync('a-long-typed-password', salt, 32, { N: EDGE_ROUTE_SCRYPT_N, maxmem: 64 * 1024 * 1024 });
      await fs.writeFile(runtimePath, JSON.stringify([{ ...oldRoute, user: 'court3', passwordSalt: salt.toString('base64'), passwordHash: hash.toString('base64') }]));
      answer({ [OLD]: 'S' });
      await expect(service.createEclipseSession(venue())).rejects.toThrow('These Eclipse credentials are already used');
    });
  });

  it('C5: a failed create that was unbound tells the edge module its feed path changed; a refused undo (nothing bound) does not', async () => {
    const noteFeedPathChanged = jest.fn();
    (service as any).edgeRegistry = { pushSessionUpsert, alert, noteFeedPathChanged };
    jest.spyOn(service as any, 'writeEclipseRoute').mockRejectedValueOnce(new Error('disk full'));
    await expect(service.createEclipseSession(venue())).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(noteFeedPathChanged).toHaveBeenCalledWith(NEW);

    noteFeedPathChanged.mockClear();
    bind = { success: false, error: 'function et_rtedge_session_bind does not exist' };
    rebind = { success: true, data: [[{ msg: -2, value: 'nothing bound', cCode: 'CONFLICT' }]] };
    await expect(service.createEclipseSession(venue())).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(noteFeedPathChanged).not.toHaveBeenCalled();

    // A registry that throws never breaks the rollback.
    noteFeedPathChanged.mockImplementation(() => { throw new Error('boom'); });
    bind = { success: true, data: [[boundRow()]] };
    rebind = { success: true, data: [[{ msg: 1, nSesid: NEW, nCaseid: CASE }]] };
    jest.spyOn(service as any, 'writeEclipseRoute').mockRejectedValueOnce(new Error('disk full'));
    await expect(service.createEclipseSession(venue())).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(executeRef).toHaveBeenLastCalledWith('realtime_insertupdate_session', { nSesid: NEW, permission: 'C' });
  });

  describe('eclipsePasswordMatches honours the route scrypt cost', () => {
    const matches = (route: any, pass: string) => EclipseSessionService.prototype.eclipsePasswordMatches.call({}, route, pass);
    const salt = randomBytes(16);

    it('a 2^15 route matches only its password', () => {
      const route = { passwordSalt: salt.toString('base64'), scryptN: EDGE_ROUTE_SCRYPT_N, passwordHash: scryptSync('pw-1', salt, 32, { N: EDGE_ROUTE_SCRYPT_N, maxmem: 64 * 1024 * 1024 }).toString('base64') };
      expect(matches(route, 'pw-1')).toBe(true);
      expect(matches(route, 'pw-2')).toBe(false);
      // the same hash read with the default cost does not match
      expect(matches({ ...route, scryptN: undefined }, 'pw-1')).toBe(false);
    });

    it('a route without scryptN is checked exactly as before', () => {
      const route = { passwordSalt: salt.toString('base64'), passwordHash: scryptSync('pw-1', salt, 32).toString('base64') };
      expect(matches(route, 'pw-1')).toBe(true);
      expect(matches(route, 'pw-2')).toBe(false);
      expect(matches({ ...route, scryptN: 'garbage' }, 'pw-1')).toBe(false);
    });
  });

  describe("direct-cloud create ('D' or no feed source): today's request, byte for byte", () => {
    it('the SPs receive today\'s bodies (browser cUnicuserid, no bind) and the route has no edge fields', async () => {
      executeRef.mockClear();
      const res = await service.createEclipseSession({ ...direct });
      expect(executeRef.mock.calls.map((c) => c[0])).toEqual(['realtime_insertupdate_session', 'realtime_update_running_session']);
      const { cEclipseUsername: _u, cEclipsePassword: _p, ...expected } = direct;
      expect(executeRef.mock.calls[0][1]).toEqual({ ...expected, cTimezone: executeRef.mock.calls[0][1].cTimezone, permission: 'N' });
      expect(executeRef.mock.calls[1][1]).toEqual({ nSesid: NEW, cUnicuserid: 'browser-1', dDate: direct.dStartDt });
      const [route] = await routes();
      expect(Object.keys(route).sort()).toEqual(['cTimezone', 'label', 'nCaseid', 'nLines', 'nSesid', 'passwordEnc', 'passwordHash', 'passwordSalt', 'user']);
      expect(routeVerifies(route, 'secret')).toBe(true);
      expect(pushSessionUpsert).not.toHaveBeenCalled();
      expect(res).toEqual({ msg: 1, nSesid: NEW, nCaseid: CASE, cName: direct.cName, cEclipseUsername: 'court3', cHost: '46.202.166.124', nPort: 2500 });
    });

    it("an explicit cFeedSource 'D' is the same request", async () => {
      await service.createEclipseSession({ ...direct, cFeedSource: 'D' } as any);
      expect(executeRef.mock.calls[0][1]).not.toHaveProperty('cFeedSource');
      expect(executeRef.mock.calls.map((c) => c[0])).toEqual(['realtime_insertupdate_session', 'realtime_update_running_session']);
    });

    it('a box id on a direct-cloud request is refused (it would silently be ignored otherwise)', async () => {
      await expect(service.createEclipseSession({ ...direct, nEdgeid: BOX } as any)).rejects.toBeInstanceOf(BadRequestException);
      expect(executeRef).not.toHaveBeenCalled();
    });

    it.each([
      ['both', { cReporterIp: '192.168.1.20', nReporterPort: 2500 }],
      ['the address alone', { cReporterIp: '192.168.1.20' }],
      ['the port alone', { nReporterPort: 2500 }],
    ])('a reporter connection (%s) on a direct-cloud request is refused, like a box id', async (_what, keys) => {
      const attempt = service.createEclipseSession({ ...direct, ...keys } as any);
      await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
      await expect(attempt).rejects.toThrow('cReporterIp and nReporterPort are only for a venue-box session (cFeedSource E)');
      await expect(service.createEclipseSession({ ...direct, cFeedSource: 'D', ...keys } as any)).rejects.toBeInstanceOf(BadRequestException);
      expect(executeRef).not.toHaveBeenCalled();
    });

    it('empty reporter fields of the form are not a reporter connection: the SP still receives today\'s body', async () => {
      const res = await service.createEclipseSession({ ...direct, cReporterIp: '', nReporterPort: null } as any);
      const { cEclipseUsername: _u, cEclipsePassword: _p, ...expected } = direct;
      expect(executeRef.mock.calls[0][1]).toEqual({ ...expected, cTimezone: executeRef.mock.calls[0][1].cTimezone, permission: 'N' });
      expect(Object.keys(executeRef.mock.calls[0][1]).filter((k) => /reporter/i.test(k))).toEqual([]);
      expect(res).toEqual({ msg: 1, nSesid: NEW, nCaseid: CASE, cName: direct.cName, cEclipseUsername: 'court3', cHost: '46.202.166.124', nPort: 2500 });
    });

    it('works with the venue edge switched off', async () => {
      env.EDGE_ENABLED = undefined;
      await expect(service.createEclipseSession({ ...direct })).resolves.toMatchObject({ msg: 1 });
    });
  });
});
