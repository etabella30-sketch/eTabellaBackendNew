import { SfuController } from './sfu.controller';
import { SfuService } from './sfu.service';

describe('SfuController health', () => {
  it('returns the health response and checks service statistics', () => {
    const service = { getStats: jest.fn().mockReturnValue({}) };
    const result = new SfuController(service as unknown as SfuService).getHealth();
    expect(result).toMatchObject({ status: 'ok', message: 'SFU service is running', version: '1.0.0' });
    expect(Number.isNaN(Date.parse((result as { timestamp: string }).timestamp))).toBe(false);
    expect(service.getStats).toHaveBeenCalledTimes(1);
  });
});
