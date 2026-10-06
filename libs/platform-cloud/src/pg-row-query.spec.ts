import { DomainError } from '@app/api-kernel';
import { PgRowQuery, ROW_QUERY_FAILED } from './pg-row-query';

const SQL = `SELECT 1 FROM "TeamRelation" t WHERE t."nCaseid" = $1 AND t."nUserid" = $2 LIMIT 1`;

describe('PgRowQuery', () => {
  let rowQuery: jest.Mock;
  let query: PgRowQuery;

  beforeEach(() => {
    rowQuery = jest.fn(async () => ({ success: true, data: [{ '?column?': 1 }] }));
    query = new PgRowQuery({ rowQuery });
  });

  it('answers the rows of a successful query, called with the SQL and a copy of the params', async () => {
    const params: readonly unknown[] = Object.freeze(['case', 'user']);
    await expect(query.rows(SQL, params)).resolves.toEqual([{ '?column?': 1 }]);
    expect(rowQuery).toHaveBeenCalledTimes(1);
    expect(rowQuery).toHaveBeenCalledWith(SQL, ['case', 'user']);
    expect(rowQuery.mock.calls[0][1]).not.toBe(params);
  });

  it('answers no rows for a successful query without an array', async () => {
    rowQuery.mockResolvedValue({ success: true });
    await expect(query.rows(SQL, [])).resolves.toEqual([]);
  });

  it('throws DomainError(upstream) for a failed query and keeps the database text in detail only', async () => {
    rowQuery.mockResolvedValue({ success: false, error: 'private database diagnostic' });
    const thrown = await query.rows(SQL, []).catch((e: unknown) => e);
    expect(thrown).toBeInstanceOf(DomainError);
    expect(thrown).toMatchObject({ code: 'upstream', message: ROW_QUERY_FAILED, detail: { error: 'private database diagnostic' } });
  });

  it('throws DomainError(upstream) when the host answers nothing usable', async () => {
    rowQuery.mockResolvedValue(undefined);
    await expect(query.rows(SQL, [])).rejects.toMatchObject({ code: 'upstream', message: ROW_QUERY_FAILED });
  });

  it('throws DomainError(upstream) when rowQuery itself throws (a fake, or a host without DbService)', async () => {
    rowQuery.mockRejectedValue(new Error('DbService is not provided by this host'));
    await expect(query.rows(SQL, [])).rejects.toMatchObject({
      code: 'upstream',
      message: ROW_QUERY_FAILED,
      detail: { error: 'DbService is not provided by this host' },
    });
  });
});
