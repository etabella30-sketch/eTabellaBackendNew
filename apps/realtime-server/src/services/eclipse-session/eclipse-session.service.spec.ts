import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { scryptSync } from 'crypto';
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';

import { EclipseSessionCreateReq } from '../../interfaces/session.interface';
import { EclipseSessionService } from './eclipse-session.service';

const request: EclipseSessionCreateReq = {
  nSesid: '',
  nCaseid: 'case-1',
  nUserid: 'user-1',
  cCaseno: 'CASE 1',
  cName: 'Hearing day 1',
  dStartDt: '2026-07-20T14:00:00',
  nDays: 1,
  nLines: 25,
  nPageno: 1,
  permission: 'I',
  cUnicuserid: 'browser-1',
  cProtocol: 'B',
  bRefresh: false,
  cEclipseUsername: 'alok',
  cEclipsePassword: 'secret',
};

describe('EclipseSessionService', () => {
  let tempDir: string;
  let runtimePath: string;
  let service: EclipseSessionService;
  let executeRef: jest.Mock;

  const createdRow = { msg: 1, nSesid: 'new-session', dStartDt: request.dStartDt, cUnicuserid: request.cUnicuserid };

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'etabella-eclipse-session-'));
    runtimePath = path.join(tempDir, 'sessions.runtime.json');
    executeRef = jest.fn(async (ref: string) => {
      if (ref === 'realtime_insertupdate_session') return { success: true, data: [[createdRow]] };
      return { success: true, data: [[{ msg: 1 }]] };
    });
    service = Object.create(EclipseSessionService.prototype) as EclipseSessionService;
    Object.assign(service as object, {
      eclipseCreateQueue: Promise.resolve(),
      config: {
        get: jest.fn((key: string) => {
          if (key === 'ECLIPSE_SESSION_CONFIG') return runtimePath;
          if (key === 'ECLIPSE_FEED_HOST') return '46.202.166.124';
          if (key === 'ECLIPSE_AUTH_PORT') return '2500';
          return undefined;
        }),
      },
      logger: { error: jest.fn(), warn: jest.fn() },
      db: { executeRef },
      ios: { server: { emit: jest.fn() } },
    });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('creates the session as N, marks it running and writes the bridge route', async () => {
    await expect(service.createEclipseSession(request)).resolves.toMatchObject({
      msg: 1,
      nSesid: 'new-session',
      nCaseid: request.nCaseid,
      cEclipseUsername: request.cEclipseUsername,
      cHost: '46.202.166.124',
      nPort: 2500,
    });
    expect(executeRef).toHaveBeenCalledWith(
      'realtime_insertupdate_session',
      expect.objectContaining({ cCaseno: request.cCaseno, permission: 'N' }),
    );
    expect(executeRef).toHaveBeenCalledWith(
      'realtime_update_running_session',
      expect.objectContaining({ nSesid: 'new-session', cUnicuserid: request.cUnicuserid }),
    );
    const createBody = executeRef.mock.calls.find(c => c[0] === 'realtime_insertupdate_session')[1];
    expect(createBody).not.toHaveProperty('cEclipseUsername');
    expect(createBody).not.toHaveProperty('cEclipsePassword');

    const routes = JSON.parse(await fs.readFile(runtimePath, 'utf8'));
    expect(routes).toEqual([expect.objectContaining({
      nSesid: 'new-session',
      nCaseid: request.nCaseid,
      user: request.cEclipseUsername,
    })]);
    expect(routes[0].passwordHash).toBeDefined();
    expect(routes[0]).not.toHaveProperty('pass');
  });

  it('blocks a second live session for the same case after a service restart', async () => {
    await fs.writeFile(runtimePath, JSON.stringify([{
      nSesid: 'live-session',
      nCaseid: request.nCaseid,
    }]));

    await expect(service.createEclipseSession(request)).rejects.toBeInstanceOf(ConflictException);
    expect(executeRef).not.toHaveBeenCalled();
  });

  it('allows another case with the same username and a different password without replacing the first route', async () => {
    const salt = Buffer.alloc(16, 7);
    await fs.writeFile(runtimePath, JSON.stringify([{
      nSesid: 'other-session',
      nCaseid: 'case-2',
      label: 'Other hearing',
      user: request.cEclipseUsername,
      passwordSalt: salt.toString('base64'),
      passwordHash: scryptSync('different-secret', salt, 32).toString('base64'),
    }]));

    await expect(service.createEclipseSession(request)).resolves.toMatchObject({
      msg: 1,
      nSesid: 'new-session',
      nCaseid: request.nCaseid,
    });

    const routes = JSON.parse(await fs.readFile(runtimePath, 'utf8'));
    expect(routes).toHaveLength(2);
    expect(routes).toEqual(expect.arrayContaining([
      expect.objectContaining({ nSesid: 'other-session', nCaseid: 'case-2' }),
      expect.objectContaining({ nSesid: 'new-session', nCaseid: request.nCaseid }),
    ]));
  });

  it('rejects an identical Eclipse credential pair because the shared port could not distinguish the sessions', async () => {
    const salt = Buffer.alloc(16, 9);
    await fs.writeFile(runtimePath, JSON.stringify([{
      nSesid: 'other-session',
      nCaseid: 'case-2',
      user: request.cEclipseUsername,
      passwordSalt: salt.toString('base64'),
      passwordHash: scryptSync(request.cEclipsePassword, salt, 32).toString('base64'),
    }]));

    await expect(service.createEclipseSession(request)).rejects.toBeInstanceOf(ConflictException);
    expect(executeRef).not.toHaveBeenCalled();
  });

  it('ends the session and leaves no route behind when the running update fails', async () => {
    executeRef.mockImplementation(async (ref: string, body: any) => {
      if (ref === 'realtime_insertupdate_session') {
        return body?.permission === 'N'
          ? { success: true, data: [[createdRow]] }
          : { success: true, data: [[{ msg: 1 }]] };
      }
      return { success: false, error: 'boom' };
    });

    await expect(service.createEclipseSession(request)).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(executeRef).toHaveBeenCalledWith(
      'realtime_insertupdate_session',
      { nSesid: 'new-session', permission: 'C' },
    );
    const routes = JSON.parse(await fs.readFile(runtimePath, 'utf8'));
    expect(routes).toEqual([]);
  });

  it('removes only the ended session route', async () => {
    await fs.writeFile(runtimePath, JSON.stringify([
      { nSesid: 'a', nCaseid: 'case-a' },
      { nSesid: 'b', nCaseid: 'case-b' },
    ]));

    await service.removeEclipseRoute('a');

    const routes = JSON.parse(await fs.readFile(runtimePath, 'utf8'));
    expect(routes).toEqual([{ nSesid: 'b', nCaseid: 'case-b' }]);
  });
});
