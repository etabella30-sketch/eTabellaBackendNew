import { CALLER_KEY } from '@app/api-kernel';
import { DraftRecoveryController } from './draft-recovery.controller';

describe('DraftRecoveryController authentication', () => {
  const actor = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const service = { issue: jest.fn(), recover: jest.fn(), remove: jest.fn() };
  const controller = new DraftRecoveryController(service as any);

  beforeEach(() => jest.clearAllMocks());

  it('uses only the verified JWT subject and browser, never a client-supplied actor', () => {
    const req = { [CALLER_KEY]: { family: 'cloud-jwt', userId: actor }, verifiedBrowserId: 'verified-browser', verifiedTokenHash: 'hash' } as any;
    const body = { caseId: 'case', sourceKind: 'pdf', sourceId: 'doc', nMasterid: 'forged' } as any;
    controller.issue(req, body);
    expect(service.issue).toHaveBeenCalledWith(actor, 'verified-browser', 'hash', { caseId: 'case', sourceKind: 'pdf', sourceId: 'doc' });
  });

  it('rejects missing or non-cloud callers without touching the key service', () => {
    expect(() => controller.recover({} as any, 'id')).toThrow();
    expect(() => controller.recover({ [CALLER_KEY]: { family: 'edge-token', userId: actor } } as any, 'id')).toThrow();
    expect(service.recover).not.toHaveBeenCalled();
  });

  it.each(['issue', 'recover', 'remove'] as const)('%s prevents caching sensitive responses', name => {
    const headers = Reflect.getMetadata('__headers__', DraftRecoveryController.prototype[name]);
    expect(headers).toContainEqual({ name: 'Cache-Control', value: 'no-store' });
  });
});
