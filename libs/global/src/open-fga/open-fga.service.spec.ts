import { Test, TestingModule } from '@nestjs/testing';
import { OpenFgaClient } from '@openfga/sdk';
import { OpenFgaService } from './open-fga.service';

jest.mock('@openfga/sdk', () => ({ OpenFgaClient: jest.fn().mockImplementation(() => ({ check: jest.fn() })) }));

describe('OpenFgaService', () => {
  let service: OpenFgaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenFgaService],
    }).compile();

    service = module.get<OpenFgaService>(OpenFgaService);
  });

  it('forwards a tuple check and returns the authorization result', async () => {
    const client = (OpenFgaClient as jest.Mock).mock.results.slice(-1)[0].value;
    client.check.mockResolvedValue({ allowed: true });
    const tuple = { user: 'user:1', relation: 'viewer', object: 'fact:1' };
    await expect(service.checkTupleExists(tuple)).resolves.toBe(true);
    expect(client.check).toHaveBeenCalledWith(tuple);
  });

  it('fails closed when the authorization service is unavailable', async () => {
    const client = (OpenFgaClient as jest.Mock).mock.results.slice(-1)[0].value;
    client.check.mockRejectedValue(new Error('unavailable'));
    const logged = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      await expect(service.checkTupleExists({ user: 'user:1', relation: 'viewer', object: 'fact:1' })).resolves.toBe(false);
    } finally { logged.mockRestore(); }
  });
});
