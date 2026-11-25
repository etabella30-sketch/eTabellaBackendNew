import { QueryBuilderService } from '@app/global/db/pg/query-builder.service';

/**
 * What et_user_case_highlight_set really receives (regression, 2026-11-23). The shared query builder sends every
 * j-prefixed key of a request as JSON TEXT, so jMyOrder and jCombos reach the function as strings, not as a list and an
 * object. The first build of the function expected a list and an object and refused every save. The function now reads
 * the text back as JSON (2026-11-23_user_case_highlight_prefs.up.sql; its scratch test H18 feeds exactly this form).
 */
describe('highlight preferences: the form the database function receives', () => {
  const A = '55555555-5555-4555-8555-555555555555', B = '66666666-6666-4666-8666-666666666666';
  const sent = (body: Record<string, unknown>): Record<string, unknown> => {
    const sql = new QueryBuilderService().buildQuery(body as never, 'user_case_highlight_set', 1);
    const json = /^select \* from public\.et_user_case_highlight_set \('(.*)','r1'\);fetch all in "r1";$/s.exec(sql)?.[1];
    expect(json).toBeDefined();
    return JSON.parse(json!.replace(/''/g, "'"));
  };

  it('jMyOrder and jCombos are JSON text; the switch, the mode and the revision keep their types', () => {
    const got = sent({ nCaseid: 'c', nMasterid: 'u', bOn: true, cMode: 'M', jMyOrder: [B, A], jCombos: { [`team:${A}+${B}`]: B }, nRev: 3 });
    expect(got['jMyOrder']).toBe(JSON.stringify([B, A]));
    expect(got['jCombos']).toBe(JSON.stringify({ [`team:${A}+${B}`]: B }));
    expect(got).toMatchObject({ bOn: true, cMode: 'M', nRev: 3 });
  });

  it('"never set" stays null and "nothing saved" is the text {}', () => {
    const got = sent({ nCaseid: 'c', nMasterid: 'u', bOn: true, cMode: 'D', jMyOrder: null, jCombos: {}, nRev: 0 });
    expect(got['jMyOrder']).toBeNull();
    expect(got['jCombos']).toBe('{}');
    expect(got['nRev']).toBe(0);
  });
});
