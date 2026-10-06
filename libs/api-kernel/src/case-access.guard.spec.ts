import { ExecutionContext } from '@nestjs/common';
import { CALLER_KEY, Caller } from './caller';
import { CaseAccess } from './case-access';
import { CASE_SCOPED_METADATA, caseCheckApplies, CaseScoped, caseScopedOf, CaseScopeGuard, namedCaseIds } from './case-access.guard';
import { DomainError } from './errors';

const ME = '11111111-1111-4111-8111-111111111111';
const CASE = 'ca5e0000-0000-4000-8000-0000000000c1';
const OTHER_CASE = 'ca5e0000-0000-4000-8000-0000000000c2';

const edge: Caller = { userId: ME, family: 'edge-online', isPlatformAdmin: false, caseScope: [CASE] };
const box: Caller = { ...edge, family: 'edge-box' };
const cloud: Caller = { userId: ME, family: 'cloud-jwt', isPlatformAdmin: false, caseScope: 'membership' };
const service: Caller = { ...cloud, family: 'service' };

class Probe {
  @CaseScoped('nCaseid')
  edgeOnly(): void {
    return;
  }

  @CaseScoped('nCaseid', { cloudCaseCheck: true })
  everyone(): void {
    return;
  }

  open(): void {
    return;
  }
}

@CaseScoped('nSesid')
class Whole {
  plain(): void {
    return;
  }
}

type Req = { params?: unknown; query?: unknown; body?: unknown; [CALLER_KEY]?: Caller };

function context(req: Req, handler: (...args: unknown[]) => unknown = Probe.prototype.edgeOnly, cls: unknown = Probe): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => ({}), getNext: () => undefined }),
    getHandler: () => handler,
    getClass: () => cls,
    getType: () => 'http',
  } as unknown as ExecutionContext;
}

describe('@CaseScoped', () => {
  it('records the field and defaults cloudCaseCheck to false (a cloud route only starts refusing when the manifest says so)', () => {
    expect(Reflect.getMetadata(CASE_SCOPED_METADATA, Probe.prototype.edgeOnly)).toEqual({ field: 'nCaseid', cloudCaseCheck: false });
    expect(Reflect.getMetadata(CASE_SCOPED_METADATA, Probe.prototype.everyone)).toEqual({ field: 'nCaseid', cloudCaseCheck: true });
  });

  it('caseScopedOf reads the handler, else the class, else null', () => {
    expect(caseScopedOf({ getHandler: () => Probe.prototype.edgeOnly, getClass: () => Probe })).toEqual({ field: 'nCaseid', cloudCaseCheck: false });
    expect(caseScopedOf({ getHandler: () => Probe.prototype.open, getClass: () => Probe })).toBeNull();
    expect(caseScopedOf({ getHandler: () => Whole.prototype.plain, getClass: () => Whole })).toEqual({ field: 'nSesid', cloudCaseCheck: false });
  });

  it('caseCheckApplies: edge callers always, cloud and service callers only with cloudCaseCheck', () => {
    expect(caseCheckApplies(edge, { cloudCaseCheck: false })).toBe(true);
    expect(caseCheckApplies(box, { cloudCaseCheck: false })).toBe(true);
    expect(caseCheckApplies(cloud, { cloudCaseCheck: false })).toBe(false);
    expect(caseCheckApplies(service, { cloudCaseCheck: false })).toBe(false);
    expect(caseCheckApplies(cloud, { cloudCaseCheck: true })).toBe(true);
    expect(caseCheckApplies(service, { cloudCaseCheck: true })).toBe(true);
  });
});

describe('namedCaseIds', () => {
  it('collects the field from params, query and body, skipping "no id" values, folding duplicates and case', () => {
    expect(namedCaseIds({ query: { nCaseid: CASE } }, 'nCaseid')).toEqual([CASE]);
    expect(namedCaseIds({ query: { nCaseid: CASE.toUpperCase() }, body: { nCaseid: CASE } }, 'nCaseid')).toEqual([CASE]);
    expect(namedCaseIds({ params: { nCaseid: CASE }, body: { nCaseid: OTHER_CASE } }, 'nCaseid')).toEqual([CASE, OTHER_CASE]);
    expect(namedCaseIds({ query: { nCaseid: 'null' }, body: { nCaseid: 0 } }, 'nCaseid')).toEqual([]);
    expect(namedCaseIds({ query: { nSesid: CASE } }, 'nCaseid')).toEqual([]);
    expect(namedCaseIds({ query: { nCaseid: 'not-an-id' } }, 'nCaseid')).toEqual(['not-an-id']);
    expect(namedCaseIds({ query: { nCaseid: 7 } }, 'nCaseid')).toEqual(['7']);
  });

  it('ignores sources that are not plain objects', () => {
    expect(namedCaseIds({ body: [CASE], query: 'nCaseid=' + CASE }, 'nCaseid')).toEqual([]);
    expect(namedCaseIds(null, 'nCaseid')).toEqual([]);
    expect(namedCaseIds(undefined, 'nCaseid')).toEqual([]);
  });
});

describe('CaseScopeGuard', () => {
  let access: jest.Mocked<CaseAccess>;
  let guard: CaseScopeGuard;

  beforeEach(() => {
    access = { assertMember: jest.fn(async (_caller: Caller, nCaseid: string) => {
      if (nCaseid !== CASE) throw new DomainError('forbidden', 'Not a member.');
    }) };
    guard = new CaseScopeGuard(access);
  });

  it('passes a route without @CaseScoped untouched', async () => {
    await expect(guard.canActivate(context({ query: { nCaseid: OTHER_CASE } }, Probe.prototype.open))).resolves.toBe(true);
    expect(access.assertMember).not.toHaveBeenCalled();
  });

  it('refuses a scoped route with no verified caller (CallerGuard missing) as unauthenticated', async () => {
    await expect(guard.canActivate(context({ query: { nCaseid: CASE } }))).rejects.toMatchObject({ code: 'unauthenticated' });
    expect(access.assertMember).not.toHaveBeenCalled();
  });

  it.each([edge, box])('checks an edge caller ($family) against every case it names', async (caller) => {
    await expect(guard.canActivate(context({ query: { nCaseid: CASE }, [CALLER_KEY]: caller }))).resolves.toBe(true);
    expect(access.assertMember).toHaveBeenCalledWith(caller, CASE);
    await expect(guard.canActivate(context({ query: { nCaseid: CASE }, body: { nCaseid: OTHER_CASE }, [CALLER_KEY]: caller })))
      .rejects.toMatchObject({ code: 'forbidden', message: 'Not a member.' });
  });

  it('refuses an edge caller that names no case, or a case that is not an id, before asking the adapter', async () => {
    await expect(guard.canActivate(context({ query: { nCaseid: 'null' }, [CALLER_KEY]: edge })))
      .rejects.toMatchObject({ code: 'forbidden', detail: { field: 'nCaseid' } });
    await expect(guard.canActivate(context({ query: {}, [CALLER_KEY]: edge }))).rejects.toMatchObject({ code: 'forbidden' });
    await expect(guard.canActivate(context({ query: { nCaseid: 'not-an-id' }, [CALLER_KEY]: edge })))
      .rejects.toMatchObject({ code: 'forbidden', detail: { field: 'nCaseid' } });
    expect(access.assertMember).not.toHaveBeenCalled();
  });

  it.each([cloud, service])('skips a $family caller unless the route says cloudCaseCheck (today\'s cloud behaviour)', async (caller) => {
    await expect(guard.canActivate(context({ query: { nCaseid: OTHER_CASE }, [CALLER_KEY]: caller }))).resolves.toBe(true);
    await expect(guard.canActivate(context({ query: {}, [CALLER_KEY]: caller }))).resolves.toBe(true);
    expect(access.assertMember).not.toHaveBeenCalled();
    await expect(guard.canActivate(context({ query: { nCaseid: OTHER_CASE }, [CALLER_KEY]: caller }, Probe.prototype.everyone)))
      .rejects.toMatchObject({ code: 'forbidden' });
    await expect(guard.canActivate(context({ query: { nCaseid: CASE }, [CALLER_KEY]: caller }, Probe.prototype.everyone))).resolves.toBe(true);
    expect(access.assertMember).toHaveBeenCalledWith(caller, CASE);
  });

  it('reads the field the class-level @CaseScoped names', async () => {
    await expect(guard.canActivate(context({ body: { nSesid: CASE }, [CALLER_KEY]: edge }, Whole.prototype.plain, Whole))).resolves.toBe(true);
    expect(access.assertMember).toHaveBeenCalledWith(edge, CASE);
  });

  it('lets the adapter decide platform admins: no exemption in the guard itself', async () => {
    const admin: Caller = { ...edge, isPlatformAdmin: true };
    await expect(guard.canActivate(context({ query: { nCaseid: OTHER_CASE }, [CALLER_KEY]: admin }))).rejects.toMatchObject({ code: 'forbidden' });
    expect(access.assertMember).toHaveBeenCalledWith(admin, OTHER_CASE);
  });
});
