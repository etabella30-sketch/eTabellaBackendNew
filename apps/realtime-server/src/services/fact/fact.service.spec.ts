import { FactService } from './fact.service';

describe('FactService review status', () => {
  const fact = '55555555-5555-4555-8555-555555555555';
  const db = { rowQuery: jest.fn().mockResolvedValue({ success: true, data: [] }) };
  const service = new FactService(db as never, {} as never);

  beforeEach(() => db.rowQuery.mockClear());

  it('persists a valid review status for the saved fact', async () => {
    await service.saveReviewStatus(fact, 27);
    expect(db.rowQuery).toHaveBeenCalledTimes(1);
    expect(db.rowQuery).toHaveBeenCalledWith(expect.any(String), [fact, 27]);
  });

  it.each([undefined, null, 0, -1, 1.5, '27', 2147483648])('does not write an invalid review status: %s', async value => {
    await service.saveReviewStatus(fact, value);
    expect(db.rowQuery).not.toHaveBeenCalled();
  });

  it('does not write when no fact was saved', async () => {
    await service.saveReviewStatus('', 27);
    expect(db.rowQuery).not.toHaveBeenCalled();
  });
});
