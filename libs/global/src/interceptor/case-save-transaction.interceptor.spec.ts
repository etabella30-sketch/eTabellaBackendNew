import { defer, lastValueFrom, of } from 'rxjs';
import { DbService } from '../db/pg/db.service';
import { currentSaveTransaction } from '../db/pg/save-transaction';
import { CASE_MODE_SQL } from '@app/permissions';
import { CaseSaveTransactionInterceptor } from './case-save-transaction.interceptor';
import { TaskController } from '../../../../apps/coreapi/src/controllers/task/task.controller';
import { TaskService } from '../../../../apps/coreapi/src/services/task/task.service';
import { FactController as CoreFactController } from '../../../../apps/coreapi/src/controllers/fact/fact.controller';
import { FactController as RealtimeFactController } from '../../../../apps/realtime-server/src/controllers/fact/fact.controller';
import { KafkaGlobalService } from '../utility/kafka/kafka.shared.service';
import { DoclinkService as RealtimeDoclinkService } from '../../../../apps/realtime-server/src/services/doclink/doclink.service';
import { DocLinkController } from '@app/rt-features/doclink';

const USER = '10000000-0000-4000-8000-000000000001';
const CASE = '20000000-0000-4000-8000-000000000001';
const RECORD = '30000000-0000-4000-8000-000000000001';

function world(failedStage?: string, throws = false) {
  const db = Object.create(DbService.prototype) as DbService;
  const emit = jest.fn();
  const kafka = new KafkaGlobalService({ emit } as any);
  const client = {
    query: jest.fn(async (sql: string) => {
      if (sql === CASE_MODE_SQL) return { rows: [{ cUIMode: 'A' }] };
      if (sql.startsWith('SP:')) {
        const fn = sql.slice(3);
        if (fn === failedStage && throws) throw new Error('Database unavailable');
        return [{ command: 'SELECT', rows: [] }, { command: 'FETCH', rows: [fn === failedStage
          ? { msg: -1, value: 'Validation failed' }
          : { msg: 1, nFSid: RECORD, nTaskid: RECORD, nDocid: RECORD, color: 'green' }] }];
      }
      if (sql.includes('UPDATE "DocDetail"') && failedStage === 'published-doc-coordinates') throw new Error('Backfill unavailable');
      return { rows: [{ nCaseid: CASE, cFType: 'F', bAllowed: true, bCase: true, bMember: true, bDocInCase: true, bSessionInCase: true }] };
    }), release: jest.fn(),
  };
  (db as any).pool = { connect: jest.fn().mockResolvedValue(client), query: jest.fn().mockResolvedValue([{ command: 'FETCH', rows: [] }]) };
  (db as any).logger = { error: jest.fn(), warn: jest.fn() };
  db.queryBuilder = { buildQuery: jest.fn((_body, fn) => `SP:${fn}`) } as any;
  const interceptor = new CaseSaveTransactionInterceptor({ get: () => db } as any);
  const invoke = (path: string, save: () => Promise<any>, method = 'POST', body?: Record<string, unknown>): Promise<any> => lastValueFrom(interceptor.intercept({
    switchToHttp: () => ({ getRequest: () => ({ path, method, body, etCaller: { userId: USER, family: 'cloud-jwt' } }) }),
  } as any, { handle: () => defer(save) }));
  return { db, client, invoke, emit, kafka };
}

describe('complete case saves keep one transaction through every stage', () => {
  it.each(['doc_insert', 'published-doc-coordinates'])('DocLink HTTP controller rolls back %s failure without returning a saved id', async stage => {
    const w = world(stage);
    const service = new RealtimeDoclinkService(w.db, { sendNotification: jest.fn() } as any);
    const controller = new DocLinkController(service as any);
    const result = await w.invoke('/doclink/insertdoc', () => controller.insert(
      { userId: USER, family: 'cloud-jwt', isPlatformAdmin: false, caseScope: 'membership' } as any,
      { nMasterid: USER, nCaseid: CASE, nSesid: RECORD, jDl: '[]' } as any,
    ));
    expect(result.msg).toBe(-1);
    expect(result.nDocid).toBeUndefined();
    expect(w.client.query).toHaveBeenLastCalledWith('ROLLBACK');
    expect(w.client.query.mock.calls.map(c => c[0])).not.toContain('COMMIT');
  });
  it.each(['task_insert', 'task_insert_detail', 'task_insert_reminder', 'task_insert_assign'])('rolls back taskBuilder on %s failure even though the legacy controller swallows that stage', async stage => {
    const w = world(stage);
    const service = new TaskService(w.db, { sendNotification: jest.fn() } as any);
    const controller = new TaskController(service);
    const result = await w.invoke('/coreapi/task/taskBuilder', () => controller.getCreate({ nMasterid: USER, nCaseid: CASE, permission: 'N' } as any));
    expect(result.msg).toBe(-1);
    expect(result.nTaskid).toBeUndefined();
    expect(w.client.query.mock.calls.map(c => c[0])).not.toContain('COMMIT');
    expect(w.client.query).toHaveBeenLastCalledWith('ROLLBACK');
    expect(w.client.release).toHaveBeenCalledTimes(1);
    expect((w.db as any).pool.query).not.toHaveBeenCalled();
  });

  it.each(['task_insert_detail_v2', 'task_insert_reminder_v2', 'task_insert_assign_V2'])('rolls back taskBuilder/v2 on %s failure', async stage => {
    const w = world(stage);
    const service = new TaskService(w.db, { sendNotification: jest.fn() } as any);
    const controller = new TaskController(service);
    expect(await w.invoke('/task/taskBuilder/v2', () => controller.taskBuilder({ nMasterid: USER, nCaseid: CASE, permission: 'N' } as any))).toMatchObject({ msg: -1 });
    expect(w.client.query).toHaveBeenLastCalledWith('ROLLBACK');
  });

  it.each(['core', 'realtime'])('%s Full Fact controller returns failure for each failed child stage', async host => {
    for (const stage of ['fact_insert_detail', 'fact_insert_links', 'fact_insert_issues', 'fact_insert_contact', 'fact_insert_task', 'fact_insert_team']) {
      const w = world(stage);
      const service: any = {
        insertFact: async (body: any) => (await w.db.executeRef('fact_insert', body)).data?.[0]?.[0],
        saveReviewStatus: async () => {}, markAsTranscriptIfPublished: async () => {},
      };
      for (const [method, fn] of Object.entries({ insertFactDetail: 'fact_insert_detail', insertFactlink: 'fact_insert_links', insertFactissues: 'fact_insert_issues', insertFactcontact: 'fact_insert_contact', insertFacttask: 'fact_insert_task', insertFactteam: 'fact_insert_team' })) {
        service[method] = (body: any) => w.db.executeRef(fn, body);
      }
      const controller = host === 'core' ? new CoreFactController(service) : new RealtimeFactController(service);
      const result = await w.invoke('/fact/insertfact', () => controller.insertfact({ nMasterid: USER, nCaseid: CASE, cFtype: 'F' } as any, {} as any));
      expect(result).toMatchObject({ msg: -1 });
      expect(result.nFSid).toBeUndefined();
      expect(w.client.query).toHaveBeenLastCalledWith('ROLLBACK');
    }
  });

  it('rolls back the complete Fact and queued notification when the final group association fails', async () => {
    const w = world('private_group_assign');
    await expect(w.invoke('/factsheet/save', async () => {
      await w.db.executeRef('factsheet_submit', { nMasterid: USER, nFSid: RECORD });
      await w.kafka.sendMessage('notification', { text: 'saved' });
      return { msg: 1, nFSid: RECORD };
    }, 'POST', { nFSid: RECORD, nPrivateGroupid: RECORD })).rejects.toThrow('Private Group could not be saved');
    expect(w.client.query).toHaveBeenLastCalledWith('ROLLBACK');
    expect(w.emit).not.toHaveBeenCalled();
    expect(w.client.query.mock.calls.map(c => c[0])).not.toContain('COMMIT');
  });

  it('applies an explicit No Private Group edit after the Fact stages and before commit', async () => {
    const w = world();
    const result = await w.invoke('/fact/factupdate', async () => {
      await w.db.executeRef('factsheet_submit', { nMasterid: USER, nFSid: RECORD });
      return { msg: 1, nFSid: RECORD };
    }, 'POST', { nFSid: RECORD, nPrivateGroupid: null });
    expect(result.msg).toBe(1);
    expect(w.client.query.mock.calls.map(c => c[0]).filter(sql => sql.startsWith('SP:')))
      .toEqual(['SP:factsheet_submit', 'SP:private_group_assign']);
    expect(w.client.query).toHaveBeenLastCalledWith('COMMIT');
  });

  it('rolls back SQL exceptions swallowed by services and does not emit notifications', async () => {
    const w = world('fact_insert_detail', true);
    const result = await w.invoke('/fact/insertfact', async () => {
      await w.db.executeRef('fact_insert', { nMasterid: USER, nCaseid: CASE });
      await w.kafka.sendMessage('notification', { text: 'created' });
      await w.db.executeRef('fact_insert_detail', { nMasterid: USER, nFSid: RECORD });
      return { msg: 1, nFSid: RECORD };
    });
    expect(result).toEqual({ msg: -1, value: 'Save failed. Your changes have not been saved.' });
    expect(w.emit).not.toHaveBeenCalled();
    expect(w.client.query).toHaveBeenLastCalledWith('ROLLBACK');
  });

  it('keeps successful response shape, closes reusable cursors, and publishes after commit', async () => {
    const w = world();
    w.emit.mockImplementation(() => expect(w.client.query).toHaveBeenLastCalledWith('COMMIT'));
    const result = await w.invoke('/factsheet/save', async () => {
      const body = { nMasterid: USER, nFSid: RECORD };
      await w.db.executeRef('factsheet_submit', body);
      await w.db.executeRef('fact_insert_team', body);
      await w.kafka.sendMessage('notification', { text: 'saved' });
      expect(w.emit).not.toHaveBeenCalled();
      return { msg: 1, value: 'Fact updated' };
    });
    expect(result).toEqual({ msg: 1, value: 'Fact updated' });
    expect(w.client.query.mock.calls.filter(c => c[0] === 'CLOSE "r1"')).toHaveLength(2);
    expect(w.client.query.mock.calls.filter(c => c[0] === 'BEGIN')).toHaveLength(1);
    expect(w.client.query.mock.calls.filter(c => c[0] === 'COMMIT')).toHaveLength(1);
    expect(w.emit).toHaveBeenCalledTimes(1);
  });

  it.each(['/fact/detail', '/issue/delete', '/claim/update', '/task/taskBuilder/updatestatus', '/team-setup/uimode'])('leaves unrelated route %s outside the composite-save transaction', async route => {
    const w = world();
    expect(await w.invoke(route, async () => ({ msg: 1 }))).toEqual({ msg: 1 });
    expect((w.db as any).pool.connect).not.toHaveBeenCalled();
  });

  it.each(['/individual/locationshare/sharetousers', '/bundles-creations/sharesectionbundle', '/comments/add'])('holds %s grant/comment writes and notices through commit', async path => {
    const w = world();
    await w.invoke(path, async () => {
      expect(currentSaveTransaction()).toBeDefined();
      await w.kafka.sendMessage('notification', { nUserid: USER, nCaseid: CASE });
      expect(w.emit).not.toHaveBeenCalled();
      return { msg: 1 };
    });
    expect(w.client.query).toHaveBeenLastCalledWith('COMMIT');
    expect(w.emit).toHaveBeenCalledTimes(1);
    expect(w.emit.mock.calls[0][1].cEventKey).toMatch(/^notification:/);
  });

  it('does not extend the transaction into another concurrent request', async () => {
    const w = world();
    let release!: () => void;
    const pending = w.invoke('/factsheet/save', async () => { await new Promise<void>(resolve => release = resolve); return { msg: 1 }; });
    await Promise.resolve(); await Promise.resolve();
    const other = await w.db.executeRef('fact_get_detail', { nFSid: RECORD });
    expect((w.db as any).pool.query).toHaveBeenCalled();
    release(); await pending;
  });
  it('inherited background work cannot reuse the released transaction client', async () => {
    const w = world();
    let resume!: () => void;
    let background!: Promise<any>;
    await w.invoke('/factsheet/save', async () => {
      background = new Promise<void>(resolve => resume = resolve).then(() => w.db.rowQuery('background read'));
      return { msg: 1 };
    });
    expect(w.client.release).toHaveBeenCalled();
    resume(); await background;
    expect((w.db as any).pool.query).toHaveBeenCalledWith('background read', undefined);
    expect(w.client.query).not.toHaveBeenCalledWith('background read', undefined);
  });
  it('notification rejection after commit does not turn a saved result into failure or an unhandled rejection', async () => {
    const w = world();
    expect(await w.invoke('/factsheet/save', async () => {
      currentSaveTransaction()!.afterCommit.push(async () => { throw new Error('Notification unavailable'); });
      return { msg: 1 };
    })).toEqual({ msg: 1 });
    await Promise.resolve();
    expect((w.db as any).logger.warn).toHaveBeenCalledWith('Post-save notification failed');
  });

  it.each(['core', 'realtime'])('%s rolls back a share recipient refusal that occurs before the child SP', async host => {
    const w = world();
    const service: any = {
      insertFact: async (body: any) => (await w.db.executeRef('fact_insert', body)).data?.[0]?.[0],
      insertFactDetail: async (body: any) => w.db.executeRef('fact_insert_detail', body),
      insertFactteam: async () => ({ msg: -1, value: 'Share recipients must be on your team' }),
      saveReviewStatus: async () => {}, markAsTranscriptIfPublished: async () => {},
      insertFactlink: async () => true, insertFactissues: async () => true,
      insertFactcontact: async () => true, insertFacttask: async () => true,
    };
    const controller = host === 'core' ? new CoreFactController(service) : new RealtimeFactController(service);
    const result = await w.invoke('/fact/insertfact', () => controller.insertfact({ nMasterid: USER, nCaseid: CASE, cFtype: 'F' } as any, {} as any));
    expect(result).toMatchObject({ msg: -1 });
    expect(result.nFSid).toBeUndefined();
    expect(w.client.query).toHaveBeenLastCalledWith('ROLLBACK');
    expect(w.client.query.mock.calls.map(c => c[0])).not.toContain('COMMIT');
  });

});
