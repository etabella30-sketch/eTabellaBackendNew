import { ForbiddenException } from '@nestjs/common';
import { FactController } from './fact.controller';
import { FactService } from '../../services/fact/fact.service';

describe('FactController', () => {
  const service = { FactDelete: jest.fn(), factUpdate: jest.fn() };
  const controller = new FactController(service as unknown as FactService);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the delete failure to the caller when the service throws', async () => {
    const error = new Error('Delete failed');
    service.FactDelete.mockRejectedValue(error);
    await expect(controller.factdelete({ nFSid: 'test-id' })).resolves.toEqual({ msg: -1, value: 'Delete failed', error });
  });

  it('preserves an authorization refusal from the fact update service', async () => {
    const refusal = new ForbiddenException('Not authorized');
    service.factUpdate.mockRejectedValue(refusal);
    await expect(controller.factupdate({} as never)).rejects.toBe(refusal);
  });
});
