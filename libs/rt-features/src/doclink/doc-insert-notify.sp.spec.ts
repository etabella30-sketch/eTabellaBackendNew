/**
 * Characterization of the share-notification SPs' text (R3-003 + R4-004, RT QA 2026-10-28, Phase B item B3), in the
 * style of factsheet/fact-insert-team.sp.spec.ts: the SPs cannot run here (no database), so the spec pins what the dev
 * migration and its sp-audit mirrors say, and that they say the same thing:
 *  - the migration opens with the dev-only guard and wraps both CREATE OR REPLACE in one BEGIN/COMMIT;
 *  - each function body in the migration IS its mirror (whitespace aside);
 *  - realtime.et_doc_insert's jNotify never names the creator (`s."nUserid" <> nMasterid`), stays empty for a private
 *    DocLink (jsonb_agg over no DMShared row, coalesced to '[]'), and the DS copy names the sharer and the place;
 *  - public.nt_resolve_target's annotation result carries page, line and the actor's level, and a Mark on a live
 *    session (the shared 18 h rule of LIVE_SESSIONS_SQL) resolves to the case, never to the annotation.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(__dirname, '../../../..');
const DOC_MIRROR = path.join(ROOT, 'sp-audit', 'sp', 'realtime', 'et_doc_insert.sql');
const NT_MIRROR = path.join(ROOT, 'sp-audit', 'sp', 'public', 'nt_resolve_target.sql');
const MIGRATION = path.join(ROOT, 'migrations', 'dev_etabella_tech_uuid_2026-10-28_share_notifications.sql');

const read = (file: string): string => fs.readFileSync(file, 'utf8');
const squash = (sql: string): string => sql.replace(/\s+/g, ' ').trim();

/** The `CREATE OR REPLACE FUNCTION <name> ... <tag>` text of a file, whitespace-normalised. */
function functionText(sql: string, name: string, tag: string): string {
  const quoted = tag.replace(/\$/g, '\\$');
  const m = sql.match(new RegExp(`CREATE OR REPLACE FUNCTION ${name.replace('.', '\\.')}[\\s\\S]*?${quoted}[\\s\\S]*?${quoted}`));
  if (!m) throw new Error(`${name} not found`);
  return squash(m[0]);
}

describe('share-notification SPs (R3-003, R4-004): realtime.et_doc_insert and public.nt_resolve_target', () => {
  const migration = read(MIGRATION);
  const docMirror = read(DOC_MIRROR);
  const ntMirror = read(NT_MIRROR);

  it('the dev migration opens with the dev-only guard and wraps both functions in one BEGIN/COMMIT', () => {
    const lines = migration.split(/\r?\n/);
    expect(lines[0]).toBe(`DO $$ BEGIN IF current_database() <> 'etabella_tech_uuid' THEN RAISE EXCEPTION 'dev only'; END IF; END $$;`);
    const begin = migration.indexOf('\nBEGIN;');
    const doc = migration.indexOf('CREATE OR REPLACE FUNCTION realtime.et_doc_insert');
    const nt = migration.indexOf('CREATE OR REPLACE FUNCTION public.nt_resolve_target');
    const commit = migration.indexOf('\nCOMMIT;');
    expect(begin).toBeGreaterThan(0);
    expect(doc).toBeGreaterThan(begin);
    expect(nt).toBeGreaterThan(doc);
    expect(commit).toBeGreaterThan(nt);
    expect((migration.match(/CREATE OR REPLACE FUNCTION/g) ?? []).length).toBe(2);
  });

  it('the sp-audit mirrors carry the same function bodies as the migration', () => {
    expect(functionText(docMirror, 'realtime.et_doc_insert', '$function$')).toBe(functionText(migration, 'realtime.et_doc_insert', '$function$'));
    expect(functionText(ntMirror, 'public.nt_resolve_target', '$fn$')).toBe(functionText(migration, 'public.nt_resolve_target', '$fn$'));
  });

  it('et_doc_insert: jNotify is built from the DMShared rows of the new DocLink, minus the creator, and coalesced to [] for a private link', () => {
    const body = squash(docMirror);
    const notify = body.slice(body.indexOf('with tbl as'), body.indexOf('select jsonb_agg(t) into jNotify'));
    expect(notify).toContain(`join "DMShared" s on s."nUserid" = u."nUserid"`);
    expect(notify).toContain(`where s."nDocid" = nDocid`);
    expect(notify).toContain(`and s."nUserid" <> nMasterid`);
    expect(notify).toContain(`'DS' as "cType"`);
    expect(notify).toContain(`'DocLink shared with you' as "cTitle"`);
    expect(notify).toContain(`' shared a DocLink with you' || coalesce(' (p' || nPage::text || ':' || nLine::text || ')','') as "cMsg"`);
    expect(body).toContain(`open ref for select 1 msg,nDocid "nDocid",coalesce(jNotify,'[]'::jsonb) as "jNotify";`);
    // The share rows themselves are written as the client sent them: the exclusion is on the notice only.
    expect(body).toContain(`FROM jsonb_array_elements(jTeams) AS team;`);
  });

  it('nt_resolve_target: the annotation result carries page, line and the actor\'s level, read live from FactDetail/DocDetail and FMShared/DMShared', () => {
    const body = squash(ntMirror);
    expect(body).toContain(`mark_page int; mark_line int; mark_level text;`);
    expect(body).toContain(`COALESCE(d."nTPage",d."nPage"),COALESCE(d."nTLine",d."nLine"), CASE WHEN f."nUserid"=actor THEN 'owner' ELSE (SELECT CASE WHEN sh."bCanReshare" THEN 'share' WHEN sh."bCanEdit" THEN 'edit' WHEN sh."bCanComment" THEN 'comment' ELSE 'read' END FROM public."FMShared" sh WHERE sh."nFSid"=f."nFSid" AND sh."nUserid"=actor LIMIT 1) END INTO actual_case,doc_id,session_id,allowed,mark_page,mark_line,mark_level FROM public."FactMaster" f LEFT JOIN public."FactDetail" d ON d."nFSid"=f."nFSid" WHERE f."nFSid"=annotation_id;`);
    expect(body).toContain(`FROM public."DMShared" sh WHERE sh."nDocid"=d."nDocid" AND sh."nUserid"=actor LIMIT 1) END INTO actual_case,doc_id,session_id,allowed,mark_page,mark_line,mark_level FROM public."DocMaster" d LEFT JOIN public."DocDetail" dd ON dd."nDocid"=d."nDocid" WHERE d."nDocid"=annotation_id;`);
    expect(body).toContain(`'sourceType',source_type,'documentId',doc_id,'sessionId',session_id,'page',mark_page,'line',mark_line,'level',mark_level));`);
  });

  it('nt_resolve_target: a Mark on a live session (status R/A/L, started within 18 h in the session zone) resolves to the case, after the entry check', () => {
    const body = squash(ntMirror);
    const entry = body.indexOf(`AND r."nCaseid"=actual_case AND r."dDelDt" IS NULL AND public.rt_entry_eligible(r."nSesid",actor)) THEN RETURN NULL; END IF;`);
    const live = body.indexOf(`IF session_id IS NOT NULL AND EXISTS (SELECT 1 FROM public."RSessionMaster" r WHERE r."nSesid"=session_id AND r."cStatus" IN ('R','A','L')`);
    expect(entry).toBeGreaterThan(0);
    expect(live).toBeGreaterThan(entry);
    expect(body).toContain(`(SELECT z.name FROM pg_timezone_names z WHERE z.name=r."cTimezone" LIMIT 1),current_setting('TimeZone'))) > now() - make_interval(hours => 18))) THEN result:=jsonb_build_object('type','case','caseId',actual_case); ELSE result:=jsonb_strip_nulls(jsonb_build_object('type','annotation'`);
    // The final case-visibility check still runs for both branches.
    expect(body.indexOf(`IF actual_case IS NULL OR NOT public.nt_case_visible(actor,actual_case)`)).toBeGreaterThan(live);
  });
});
