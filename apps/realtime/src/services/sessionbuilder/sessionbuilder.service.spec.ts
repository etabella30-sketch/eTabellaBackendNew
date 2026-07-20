import { ConflictException } from '@nestjs/common';
import { scryptSync } from 'crypto';
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';

import { EclipseSessionCreateReq } from '../../interfaces/session.interface';
import { SessionbuilderService } from './sessionbuilder.service';

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

describe('SessionbuilderService Eclipse sessions', () => {
  let tempDir: string;
  let runtimePath: string;
  let service: SessionbuilderService;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'etabella-eclipse-session-'));
    runtimePath = path.join(tempDir, 'sessions.runtime.json');
    service = Object.create(SessionbuilderService.prototype) as SessionbuilderService;
    Object.assign(service as object, {
      eclipseCreateQueue: Promise.resolve(),
      schema: 'realtime',
      config: {
        get: jest.fn((key: string) => {
          if (key === 'ECLIPSE_SESSION_CONFIG') return runtimePath;
          if (key === 'ECLIPSE_FEED_HOST') return '192.168.1.7';
          if (key === 'ECLIPSE_AUTH_PORT') return '2500';
          return undefined;
        }),
      },
      logger: { error: jest.fn(), warn: jest.fn() },
      db: { executeRef: jest.fn().mockResolvedValue({ success: true }) },
    });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('ignores an unrelated legacy live row when no managed Eclipse route exists', async () => {
    const legacyLookup = jest
      .spyOn(service, 'getlivesessionbycaseid')
      .mockResolvedValue({ msg: 1, nSesid: 'stale-session', nCaseid: 'other-case' });
    const create = jest.spyOn(service, 'sessionCreation').mockResolvedValue({
      msg: 1,
      nSesid: 'new-session',
      nCaseid: request.nCaseid,
    });
    jest.spyOn(service as any, 'writeEclipseRoute').mockResolvedValue(undefined);

    await expect(service.createEclipseSession(request)).resolves.toMatchObject({
      msg: 1,
      nSesid: 'new-session',
      nCaseid: request.nCaseid,
    });
    expect(legacyLookup).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      nCaseid: request.nCaseid,
      permission: 'N',
    }));
    expect((service as any).db.executeRef).toHaveBeenCalledWith(
      'sessions_manage_status',
      { nSesid: 'new-session', cStatus: 'R' },
      'realtime',
    );
  });

  it('blocks a second live session for the same case after a service restart', async () => {
    await fs.writeFile(runtimePath, JSON.stringify([{
      nSesid: 'live-session',
      nCaseid: request.nCaseid,
    }]));
    const create = jest.spyOn(service, 'sessionCreation');

    await expect(service.createEclipseSession(request)).rejects.toBeInstanceOf(ConflictException);
    expect(create).not.toHaveBeenCalled();
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
    jest.spyOn(service, 'sessionCreation').mockResolvedValue({
      msg: 1,
      nSesid: 'new-session',
      nCaseid: request.nCaseid,
    });

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
    const create = jest.spyOn(service, 'sessionCreation');

    await expect(service.createEclipseSession(request)).rejects.toBeInstanceOf(ConflictException);
    expect(create).not.toHaveBeenCalled();
  });
});
