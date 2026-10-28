/**
 * Characterization of realtime.et_fact_insert_team's text (R4-001, sharing-matrix QA 2026-10-28), in the style of
 * marks/mark-audience.sql.spec.ts: the SP cannot run here (no database), so the spec pins what the dev migration and
 * its sp-audit mirror say, and that they say the same thing:
 *  - the migration opens with the dev-only guard and wraps the function in BEGIN/COMMIT;
 *  - the function body in the migration IS the mirror (whitespace aside);
 *  - `bMerge` is read with a false default, so every existing caller (the creator's save, coreapi's fact insert,
 *    the old realtime fact.service) keeps the full replacement;
 *  - in merge mode nothing is DELETEd, the fact's creator never gets a row, and an existing row is re-levelled
 *    (flags AND nShareBy) only when the caller granted it himself ("nShareBy" = caller);
 *  - the legacy path keeps its unconditional DELETE and unconditional ON CONFLICT update (every merge clause starts
 *    with `NOT bMerge OR`).
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../../..');
const MIRROR = path.join(ROOT, 'sp-audit', 'sp', 'realtime', 'et_fact_insert_team.sql');
const MIGRATION = path.join(ROOT, 'migrations', 'dev_etabella_tech_uuid_2026-10-28_fact_insert_team_merge.sql');

const read = (file: string): string => fs.readFileSync(file, 'utf8');
const squash = (sql: string): string => sql.replace(/\s+/g, ' ').trim();

/** The `CREATE OR REPLACE FUNCTION ... $function$` text of a file, whitespace-normalised. */
function functionText(sql: string): string {
  const m = sql.match(/CREATE OR REPLACE FUNCTION realtime\.et_fact_insert_team[\s\S]*?\$function\$[\s\S]*?\$function\$/);
  if (!m) throw new Error('et_fact_insert_team not found');
  return squash(m[0]);
}

/** One statement of the body (from a marker up to the first `;`), whitespace-normalised. */
function statement(sql: string, start: RegExp): string {
  const m = sql.match(new RegExp(start.source + '[\\s\\S]*?;', start.flags));
  if (!m) throw new Error(`statement not found: ${start}`);
  return squash(m[0]);
}

describe('realtime.et_fact_insert_team: merge mode for a non-creator reshare (R4-001)', () => {
  const mirror = read(MIRROR);
  const migration = read(MIGRATION);

  it('the dev migration opens with the dev-only guard and wraps the CREATE OR REPLACE in BEGIN/COMMIT', () => {
    const lines = migration.split(/\r?\n/);
    expect(lines[0]).toBe(`DO $$ BEGIN IF current_database() <> 'etabella_tech_uuid' THEN RAISE EXCEPTION 'dev only'; END IF; END $$;`);
    const begin = migration.indexOf('\nBEGIN;');
    const create = migration.indexOf('CREATE OR REPLACE FUNCTION realtime.et_fact_insert_team');
    const commit = migration.indexOf('\nCOMMIT;');
    expect(begin).toBeGreaterThan(0);
    expect(create).toBeGreaterThan(begin);
    expect(commit).toBeGreaterThan(create);
    expect(migration.indexOf('CREATE OR REPLACE FUNCTION')).toBe(create);
    expect(migration.indexOf('CREATE OR REPLACE FUNCTION', create + 1)).toBe(-1);
  });

  it('the sp-audit mirror carries the same function body as the migration', () => {
    expect(functionText(mirror)).toBe(functionText(migration));
  });

  it('bMerge defaults to false and the owner is read from FactMaster, so every existing caller keeps the full replacement', () => {
    expect(squash(mirror)).toContain(`bMerge := coalesce((parameter->>'bMerge'),'false')::boolean;`);
    expect(squash(mirror)).toContain(`nOwnerid := (select "nUserid" from "FactMaster" where "nFSid" = nFSid );`);
  });

  it('merge mode deletes nothing: the DELETE runs only under IF NOT bMerge', () => {
    const body = squash(mirror);
    const deletes = body.match(/DELETE FROM "FMShared"/g) ?? [];
    expect(deletes).toHaveLength(1);
    expect(body).toContain('IF NOT bMerge THEN DELETE FROM "FMShared" f WHERE f."nFSid" = nFSid AND NOT EXISTS');
    expect(body).toMatch(/WHERE t\."nUserid" = f\."nUserid" \); END IF;/);
  });

  it('merge mode never gives the creator a row, and re-levels only the rows the caller granted himself (flags and nShareBy together)', () => {
    const insert = statement(mirror, /INSERT INTO "FMShared"/);
    expect(insert).toContain(`FROM jsonb_array_elements(jTeams) AS team WHERE NOT bMerge OR (team->>'nUserid')::uuid IS DISTINCT FROM nOwnerid ON CONFLICT ("nFSid","nUserid")`);
    expect(insert).toMatch(/DO UPDATE SET "bCanEdit" = EXCLUDED\."bCanEdit", "bCanReshare" = EXCLUDED\."bCanReshare", "bCanComment" = EXCLUDED\."bCanComment", "nShareBy" = EXCLUDED\."nShareBy" WHERE NOT bMerge OR "FMShared"\."nShareBy" = nUserid;$/);
    // Still the caller as the sharer of a row he inserts; no separate UPDATE path could rewrite nShareBy.
    expect(insert).toContain('nUserid -- the sharer (from your outer scope) FROM jsonb_array_elements');
    expect((squash(mirror).match(/"nShareBy" = EXCLUDED/g) ?? []).length).toBe(1);
    expect(squash(mirror)).not.toMatch(/UPDATE "FMShared"/);
  });

  it('the jNotify answer and the result row are the ones the service already reads', () => {
    expect(squash(mirror)).toContain(`open ref for select 1 msg,coalesce(jNotify,'[]'::jsonb) as "jNotify";`);
  });
});
