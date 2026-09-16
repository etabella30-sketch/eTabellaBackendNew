# gen_prod_script.py -- regenerates migrations/prod_etabella_com_uuid_<date>.sql (+ rollback + read-only pre-flight)
# from a FRESH dev schema dump diffed against the 2026-05-19 prod snapshot.
#   usage: python gen_prod_script.py <workdir> <backend-repo-root>
#   <workdir> must contain:
#     dev2/schema.sql      pg_dump -h <vultr> -U vultradmin -d etabella_tech_uuid --schema-only --no-owner --no-acl --no-comments -Fp
#     dev2/codes.sql       pg_dump ... --data-only -t '"Codemaster"' -Fp
#     prod0519/schema.sql  pg_restore --schema-only --no-owner --no-acl --no-comments -f ... docker/postgres/backup/etabella.com.uuid.backup
#     prod0519/codes.sql   pg_restore --data-only -t Codemaster -f ... (same dump)
#     roman/text_01_assistant.txt  the 2026-09-01 roman et_bundles SQL (known live body of et_bundles) -- see memory bundle-index-ordering-fixes
#   SymmetricDS objects (fsym_on_*, sym.*) are excluded by name; edit `is_sym` if that ever changes.
import re, sys, json, hashlib, collections
import re, sys, json, hashlib, collections
S, B = sys.argv[1], sys.argv[2]
rd = lambda p: open(p, encoding='utf-8', errors='replace').read()
HDR = re.compile(r'^-- Name: (?P<name>.*?); Type: (?P<type>[A-Z ]+?); Schema: (?P<schema>[^;]*); Owner: .*$')

def parse(path):
    objs = collections.OrderedDict(); cur = None; buf = []
    lines = rd(path).split('\n'); i = 0
    while i < len(lines):
        m = HDR.match(lines[i])
        if m and i > 0 and lines[i-1].strip() == '--':
            if cur: objs[cur] = '\n'.join(buf)
            cur = (m['type'].strip(), m['schema'].strip(), m['name'].strip()); buf = []; i += 2; continue
        if cur is not None: buf.append(lines[i])
        i += 1
    if cur: objs[cur] = '\n'.join(buf)
    for k, v in objs.items():
        vl = [l.rstrip() for l in v.split('\n')]
        while vl and vl[-1] in ('', '--'): vl.pop()
        objs[k] = '\n'.join(vl).strip('\n')
    return objs

norm = lambda t: '\n'.join(l.rstrip() for l in t.split('\n') if l.strip())
bmd5 = lambda body: hashlib.md5(re.sub(r'\s+', ' ', body).strip().encode('utf-8')).hexdigest()

def fn_parts(block):
    m = re.search(r'\n\s*AS (\$[A-Za-z_]*\$)', block); tag = m[1]
    head = block[:m.start()]
    body_start = m.end(); body_end = block.rfind(tag + ';')
    return head, block[body_start:body_end], tag

is_sym = lambda sc, nm: (sc == 'sym' and not nm.startswith('fn_')) or nm.startswith('fsym_on_') or nm.startswith('sym_')

dev = parse(f'{S}/dev2/schema.sql'); prod = parse(f'{S}/prod0519/schema.sql')

# ---------- known live overrides ----------
FENCE = re.compile(r'```sql\n(.*?)\n```', re.S)
t1 = [b for b in FENCE.findall(rd(f'{S}/roman/text_01_assistant.txt')) if 'CREATE OR REPLACE FUNCTION' in b]
roman_only_et_bundles = t1[1]
known_live = {('public', 'et_bundles(json, refcursor)'): re.search(r'AS (\$[A-Za-z_]*\$)(.*?)\1;', roman_only_et_bundles, re.S)[2]}

# ---------- FUNCTIONS ----------
fn_ship = []
for (ty, sc, nm), blk in dev.items():
    if ty != 'FUNCTION' or is_sym(sc, nm.split('(')[0]): continue
    key = (ty, sc, nm); pblk = prod.get(key)
    if pblk is not None and norm(pblk) == norm(blk): continue
    head, body, tag = fn_parts(blk)
    before = None; drop_first = False
    if pblk is not None:
        phead, pbody, _ = fn_parts(pblk); before = bmd5(pbody)
        if norm(phead) != norm(head): drop_first = True
    fn_ship.append(dict(schema=sc, sig=nm, name=nm.split('(')[0], args=nm[nm.index('(')+1:-1],
                        block=blk.replace('CREATE FUNCTION', 'CREATE OR REPLACE FUNCTION', 1),
                        before=before, after=bmd5(body),
                        known=bmd5(known_live[(sc, nm)]) if (sc, nm) in known_live else None,
                        drop_first=drop_first, lang=re.search(r'LANGUAGE (\w+)', head)[1].lower(), prod_block=pblk))
fn_drop = []
for (ty, sc, nm), blk in prod.items():
    if ty != 'FUNCTION' or is_sym(sc, nm.split('(')[0]) or (ty, sc, nm) in dev: continue
    same = [k for k in dev if k[0] == 'FUNCTION' and k[1] == sc and k[2].split('(')[0] == nm.split('(')[0]]
    if same: fn_drop.append(dict(schema=sc, sig=nm, prod_block=blk))
fn_ship.sort(key=lambda f: (('refcursor' in f['args']), f['lang'] == 'sql', f['schema'], f['name']))

# ---------- TABLES / COLUMNS ----------
def cols(body):
    out = collections.OrderedDict(); inside = False
    for l in body.split('\n'):
        if l.startswith('CREATE TABLE'): inside = True; continue
        if inside:
            if l.startswith(');'): break
            s = l.strip().rstrip(',')
            if not s or re.match(r'^(CONSTRAINT|CHECK|PRIMARY KEY|UNIQUE|FOREIGN KEY|LIKE|EXCLUDE)\b', s): continue
            m = re.match(r'^"?([\w]+)"?\s+(.*)$', s)
            if m: out[m[1]] = m[2]
    return out

new_tables = []; add_cols = []
for (ty, sc, nm), blk in dev.items():
    if ty != 'TABLE' or is_sym(sc, nm): continue
    key = (ty, sc, nm)
    if key not in prod:
        new_tables.append(dict(schema=sc, name=nm, block=blk.replace('CREATE TABLE', 'CREATE TABLE IF NOT EXISTS', 1)))
    else:
        dc, pc = cols(blk), cols(prod[key])
        for c, d in dc.items():
            if c not in pc: add_cols.append(dict(schema=sc, table=nm, col=c, defn=d))
        for c in dc:
            if c in pc and dc[c] != pc[c]: print('WARN column definition differs (not migrated):', sc, nm, c, pc[c], '->', dc[c])
new_constraints = []
for (ty, sc, nm), blk in dev.items():
    if ty not in ('CONSTRAINT', 'FK CONSTRAINT') or (ty, sc, nm) in prod: continue
    tbl, cname = nm.split(' ', 1)
    if is_sym(sc, tbl): continue
    m = re.search(r'ADD CONSTRAINT "?([\w]+)"? ', blk); conname = m[1]
    stmt = ' '.join(l.strip() for l in blk.split('\n') if l.strip() and not l.startswith('--')).rstrip(';')
    new_constraints.append(dict(schema=sc, table=tbl, conname=conname, stmt=stmt))
new_indexes = []
for (ty, sc, nm), blk in dev.items():
    if ty != 'INDEX' or (ty, sc, nm) in prod or is_sym(sc, nm): continue
    stmt = blk.strip().rstrip(';')
    stmt = re.sub(r'^CREATE (UNIQUE )?INDEX ', lambda m: f'CREATE {m[1] or ""}INDEX CONCURRENTLY IF NOT EXISTS ', stmt)
    new_indexes.append(dict(schema=sc, name=nm, stmt=stmt))
new_triggers = []
for (ty, sc, nm), blk in dev.items():
    if ty != 'TRIGGER' or (ty, sc, nm) in prod: continue
    tbl, tg = nm.split(' ', 1)
    if is_sym(sc, tbl) or tg.startswith('sym_on_'): continue
    new_triggers.append(dict(schema=sc, table=tbl, name=tg, stmt=blk.strip().replace('CREATE TRIGGER', 'CREATE OR REPLACE TRIGGER', 1)))
dev_ext = [k[2] for k in dev if k[0] == 'EXTENSION']; prod_ext = [k[2] for k in prod if k[0] == 'EXTENSION']
new_ext = [e for e in dev_ext if e not in prod_ext]

# ---------- CODEMASTER ----------
def copyrows(path, tab):
    L = rd(path).split('\n'); i = 0; rows = []
    while i < len(L):
        m = re.match(r'^COPY public\."' + tab + r'" \((.*)\) FROM stdin;$', L[i])
        if m:
            cn = [c.strip().strip('"') for c in m[1].split(',')]; i += 1
            while L[i] != '\\.': rows.append(dict(zip(cn, L[i].split('\t')))); i += 1
        i += 1
    return rows
dcodes = copyrows(f'{S}/dev2/codes.sql', 'Codemaster'); pcodes = copyrows(f'{S}/prod0519/codes.sql', 'Codemaster')
pby_id = {r['nCodeid']: r for r in pcodes}; pby_cn = {(r['nCategoryid'], r['cCodename']): r for r in pcodes}
code_inserts = [r for r in dcodes if (r['nCategoryid'], r['cCodename']) not in pby_cn and r['nCategoryid'] in ('23', '24', '27')
                and not (r['nCodeid'] in pby_id and pby_id[r['nCodeid']]['nCategoryid'] == r['nCategoryid'])]
code_relabels = []
for r in dcodes:
    p = pby_id.get(r['nCodeid'])
    if p and p['nCategoryid'] == r['nCategoryid'] and (p['cCodename'] != r['cCodename'] or p['nSerialno'] != r['nSerialno']):
        code_relabels.append((p, r))
NULLTOK = '\\N'
q = lambda v: 'NULL' if v == NULLTOK else "'" + v.replace("'", "''") + "'"
qn = lambda v: 'NULL' if v == NULLTOK else v

# ---------- BACKFILLS ----------
bf = {}
t = rd(f'{B}/assets/sql-migrations/2026-05-20_bundle_depth.up.sql'); bf['depth'] = t[t.index('WITH RECURSIVE tree AS'):t.index('COMMIT;')].strip()
t = rd(f'{B}/assets/sql-migrations/2026-05-20_bundle_file_counts.up.sql')
a = t.index('UPDATE "BundleMaster" bm\nSET "nFileCount" = sub.cnt')
b_ = t.index('-- ------', t.index('WHERE bm."nBundleid" = sub."nBundleid";', t.index('WITH RECURSIVE descendants')))
bf['counts'] = re.sub(r'\n-- -{10,}\n.*?\n-- -{10,}\n', '\n', t[a:b_].strip(), flags=re.S)
t = rd(f'{B}/assets/sql-migrations/2026-05-20_section_order.up.sql'); a = t.index('UPDATE "SectionMaster" SET "nSectionOrder" ='); bf['section'] = t[a:t.index(';', a)+1]
t = rd(f'{B}/assets/sql-migrations/2026-07-08_fact_annotation_nbdid.up.sql'); a = t.index('UPDATE "Annotations" a'); bf['nbdid'] = t[a:t.index(';', a)+1]

# ================= EMIT =================
today = '2026-09-15'; out = []; E = out.append
n_new = sum(1 for f in fn_ship if f['before'] is None); n_chg = len(fn_ship) - n_new
idx_names = ", ".join("'" + i['name'] + "'" for i in new_indexes)
E(f"""-- =====================================================================================
--  eTabella 3.0  --  dev (etabella_tech_uuid, Vultr)  ->  LIVE (etabella.com.uuid, DigitalOcean)
--  Generated {today} from the LIVE dev catalog (pg_dump --schema-only) diffed against the
--  2026-05-19 prod snapshot. Plan: migrations/PROD-MIGRATION-PLAN-2026-09-15.md
--
--  WHAT IT DOES (all additive, idempotent, re-run safe):
--    functions  : {len(fn_ship)} CREATE OR REPLACE ({n_new} new, {n_chg} changed), {len(fn_drop)} old overload dropped
--    tables     : {len(new_tables)} CREATE TABLE IF NOT EXISTS ({", ".join(t["name"] for t in new_tables)})
--    columns    : {len(add_cols)} ADD COLUMN IF NOT EXISTS on {len({(c["schema"], c["table"]) for c in add_cols})} tables
--    indexes    : {len(new_indexes)} CREATE INDEX CONCURRENTLY IF NOT EXISTS (after COMMIT)
--    triggers   : {len(new_triggers)} CREATE OR REPLACE TRIGGER
--    extensions : {", ".join(new_ext) or "none"}
--    lookup data: Codemaster {len(code_inserts)} new rows (fresh ids via nextval), {len(code_relabels)} relabels (guarded on old label)
--    backfills  : BundleMaster depth/counts, SectionMaster order, Annotations nBDid (recomputed / NULL-only)
--  EXCLUDED on purpose: every SymmetricDS object (fsym_on_* / sym.*), RTConnectivityLogs truncate.
--
--  RUN (from your terminal; password via %APPDATA%\\postgresql\\pgpass.conf, never on the command line):
--    export PGSSLMODE=require
--    psql -h db-pgsql-sgp1-42479-do-user-17736953-0.a.db.ondigitalocean.com -p 25060 -U doadmin \\
--         -d etabella.com.uuid -v ON_ERROR_STOP=1 -f migrations/prod_etabella_com_uuid_{today}.sql \\
--         2>&1 | tee migrations/apply_log_prod_$(date +%Y%m%d_%H%M%S).log
--  OPTIONS (append -v name=1):  preflight_only=1  allow_drift=1  skip_relabel=1  skip_backfill=1  skip_indexes=1
--  SAFETY : refuses any DB other than etabella.com.uuid; aborts BEFORE the transaction if a live
--           function matches neither its expected old body nor the new one (DRIFT) unless allow_drift=1.
--  ROLLBACK: migrations/rollback_prod_etabella_com_uuid_{today}.sql (restores pre-migration bodies).
-- =====================================================================================
\\set ON_ERROR_STOP on
\\pset pager off
\\if :{{?allow_drift}}
\\else
\\set allow_drift 0
\\endif
\\if :{{?skip_relabel}}
\\else
\\set skip_relabel 0
\\endif
\\if :{{?skip_backfill}}
\\else
\\set skip_backfill 0
\\endif
\\if :{{?skip_indexes}}
\\else
\\set skip_indexes 0
\\endif
\\if :{{?preflight_only}}
\\else
\\set preflight_only 0
\\endif

-- ---------- 01 GUARD ----------
DO $g$ BEGIN
  IF current_database() <> 'etabella.com.uuid' THEN
    RAISE EXCEPTION 'ABORT: this script targets etabella.com.uuid only, connected to %', current_database();
  END IF;
END $g$;
SELECT current_database() AS db, current_user AS usr, version() AS pg, now() AS started_at;
""")
exp_rows = []
for f in fn_ship: exp_rows.append(('FUNCTION', f['schema'], f['name'], f['args'], f['before'], f['after'], f['known']))
for f in fn_drop: exp_rows.append(('DROPPED-FUNCTION', f['schema'], f['sig'].split('(')[0], f['sig'][f['sig'].index('(')+1:-1], None, None, None))
for t_ in new_tables: exp_rows.append(('TABLE', t_['schema'], t_['name'], '', None, None, None))
for c in add_cols: exp_rows.append(('COLUMN', c['schema'], c['table'], c['col'], None, None, None))
for i in new_indexes: exp_rows.append(('INDEX', i['schema'], i['name'], '', None, None, None))
for t_ in new_triggers: exp_rows.append(('TRIGGER', t_['schema'], t_['table'], t_['name'], None, None, None))
for e in new_ext: exp_rows.append(('EXTENSION', '', e, '', None, None, None))
for r in code_inserts: exp_rows.append(('CODEMASTER', '', r['nCategoryid'], r['cCodename'], None, None, None))
def sq(v): return 'NULL' if v is None else "'" + v.replace("'", "''") + "'"
def vals():
    return ',\n'.join(f"  ('{k}','{sc}','{nm}',{sq(arg)},{sq(b)},{sq(a)},{sq(kn)})" for k, sc, nm, arg, b, a, kn in exp_rows)
CLASSIFY = r"""
SELECT e.kind, e.schema_name AS schema, e.obj_name AS name, e.detail,
  CASE e.kind
    WHEN 'FUNCTION' THEN
      CASE WHEN l.live_md5 IS NULL THEN CASE WHEN e.before_md5 IS NULL THEN 'PENDING (new)' ELSE 'MISSING-ON-LIVE?' END
           WHEN l.live_md5 = e.after_md5 THEN 'DONE'
           WHEN l.live_md5 = e.before_md5 THEN 'PENDING'
           WHEN l.live_md5 = e.known_md5  THEN 'PENDING (known live version)'
           ELSE 'DRIFT' END
    WHEN 'DROPPED-FUNCTION' THEN CASE WHEN l.live_md5 IS NULL THEN 'DONE' ELSE 'PENDING' END
    WHEN 'TABLE'     THEN CASE WHEN to_regclass(format('%I.%I', e.schema_name, e.obj_name)) IS NULL THEN 'PENDING' ELSE 'DONE' END
    WHEN 'COLUMN'    THEN CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema=e.schema_name AND c.table_name=e.obj_name AND c.column_name=e.detail) THEN 'DONE' ELSE 'PENDING' END
    WHEN 'INDEX'     THEN CASE WHEN EXISTS (SELECT 1 FROM pg_indexes i WHERE i.schemaname=e.schema_name AND i.indexname=e.obj_name) THEN 'DONE' ELSE 'PENDING' END
    WHEN 'TRIGGER'   THEN CASE WHEN EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=e.schema_name AND c.relname=e.obj_name AND t.tgname=e.detail) THEN 'DONE' ELSE 'PENDING' END
    WHEN 'EXTENSION' THEN CASE WHEN EXISTS (SELECT 1 FROM pg_extension x WHERE x.extname=e.obj_name) THEN 'DONE' ELSE 'PENDING' END
    WHEN 'CODEMASTER' THEN CASE WHEN EXISTS (SELECT 1 FROM public."Codemaster" cm WHERE cm."nCategoryid"=e.obj_name::int AND cm."cCodename"=e.detail) THEN 'DONE' ELSE 'PENDING' END
  END AS status
FROM etab_expect e
LEFT JOIN LATERAL (
  SELECT md5(btrim(regexp_replace(p.prosrc, '\s+', ' ', 'g'))) AS live_md5
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE e.kind IN ('FUNCTION','DROPPED-FUNCTION') AND n.nspname = e.schema_name AND p.proname = e.obj_name
    AND oidvectortypes(p.proargtypes) = e.detail
  LIMIT 1
) l ON true"""
E(f"""-- ---------- 02 PRE-FLIGHT (read-only) ----------
DROP TABLE IF EXISTS etab_expect;
CREATE TEMP TABLE etab_expect (kind text, schema_name text, obj_name text, detail text, before_md5 text, after_md5 text, known_md5 text);
INSERT INTO etab_expect VALUES
{vals()};
DROP TABLE IF EXISTS etab_preflight;
CREATE TEMP TABLE etab_preflight AS {CLASSIFY};
\\echo
\\echo ==================== PRE-FLIGHT: per-object state on LIVE ====================
SELECT kind, schema, name, detail, status FROM etab_preflight ORDER BY (status LIKE 'DRIFT%') DESC, kind, schema, name, detail;
SELECT status, count(*) FROM etab_preflight GROUP BY status ORDER BY status;
SELECT set_config('etab.allow_drift', :'allow_drift', false) AS allow_drift, set_config('etab.preflight_only', :'preflight_only', false) AS preflight_only, set_config('etab.skip_indexes', :'skip_indexes', false) AS skip_indexes;
DO $p$
DECLARE n_drift int; n_missing int;
BEGIN
  SELECT count(*) FILTER (WHERE status = 'DRIFT'), count(*) FILTER (WHERE status = 'MISSING-ON-LIVE?') INTO n_drift, n_missing FROM etab_preflight;
  IF n_drift > 0 AND current_setting('etab.allow_drift') <> '1' THEN
    RAISE EXCEPTION 'ABORT before any change: % live function(s) changed on prod since the baseline AND differ from dev (DRIFT). Review the list above; re-run with -v allow_drift=1 to overwrite them with the dev bodies.', n_drift;
  END IF;
  IF n_missing > 0 THEN RAISE WARNING '% function(s) expected on live are missing; they will be created.', n_missing; END IF;
  IF current_setting('etab.preflight_only') = '1' THEN RAISE EXCEPTION 'preflight_only=1: stopping here, nothing changed.'; END IF;
END $p$;

-- ---------- 03 TRANSACTION ----------
BEGIN;
""")
for e in new_ext: E(f'CREATE EXTENSION IF NOT EXISTS "{e}";')
E('\n-- ---------- 04 NEW TABLES ----------')
for t_ in new_tables: E(t_['block'] + '\n')
for c in new_constraints:
    E(f"""DO $c$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '{c['conname']}') THEN
    EXECUTE $s$ {c['stmt']} $s$;
  END IF;
END $c$;""")
E('\n-- ---------- 05 NEW COLUMNS ----------')
for c in add_cols: E(f'ALTER TABLE {c["schema"]}."{c["table"]}" ADD COLUMN IF NOT EXISTS "{c["col"]}" {c["defn"]};')
E('\n-- ---------- 06 FUNCTIONS ----------')
for f in fn_drop: E(f'DROP FUNCTION IF EXISTS {f["schema"]}.{f["sig"]};   -- replaced by a new signature below')
for f in fn_ship:
    E(f'\n-- ===== {f["schema"]}.{f["sig"]}  [{"NEW" if f["before"] is None else "CHANGED"}] =====')
    if f['drop_first']: E(f'DROP FUNCTION IF EXISTS {f["schema"]}.{f["sig"]};   -- header/return type changed; CREATE OR REPLACE would fail')
    E(f['block'])
E('\n-- ---------- 07 TRIGGERS ----------')
for t_ in new_triggers: E(t_['stmt'])
E('\n-- ---------- 08a LOOKUP DATA: Codemaster relabels (ids stable; applied only while the live label is still the old one) ----------')
E('\\if :skip_relabel\n\\echo skip_relabel=1: Codemaster relabels skipped\n\\else')
for p, r in code_relabels:
    E(f"""UPDATE public."Codemaster" SET "cCodename" = {q(r['cCodename'])}, "nSerialno" = {qn(r['nSerialno'])}
 WHERE "nCodeid" = {r['nCodeid']} AND "nCategoryid" = {r['nCategoryid']} AND "cCodename" = {q(p['cCodename'])}
   AND ("cCodename" IS DISTINCT FROM {q(r['cCodename'])} OR "nSerialno" IS DISTINCT FROM {qn(r['nSerialno'])});   -- was: {p['cCodename']} #{p['nSerialno']}""")
E('\\endif')
E("""
-- ---------- 08b LOOKUP DATA: Codemaster new rows ----------
-- new codes get FRESH ids (dev used 60-69, which are timezone rows on live); matched by (category, label)
SELECT setval('public."Codemaster_nCodeid_seq"', GREATEST((SELECT max("nCodeid") FROM public."Codemaster"), (SELECT last_value FROM public."Codemaster_nCodeid_seq")));""")
for r in code_inserts:
    E(f"""INSERT INTO public."Codemaster" ("nCategoryid","cCodename","nSerialno","nParentcodeid","jOther","jParents")
SELECT {r['nCategoryid']}, {q(r['cCodename'])}, {qn(r['nSerialno'])}, {qn(r['nParentcodeid'])}, {q(r['jOther'])}::jsonb, {q(r['jParents'])}::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public."Codemaster" WHERE "nCategoryid" = {r['nCategoryid']} AND "cCodename" = {q(r['cCodename'])});""")
E(f"""
-- ---------- 09 BACKFILLS ----------
\\if :skip_backfill
\\echo skip_backfill=1: backfills skipped
\\else
-- 09a BundleMaster.nHierarchyDepth (full recompute, idempotent) -- from 2026-05-20_bundle_depth
{bf['depth']}
-- 09b BundleMaster.nFileCount / nFileCountDescendant (full recompute, idempotent) -- from 2026-05-20_bundle_file_counts
{bf['counts']}
-- 09c SectionMaster.nSectionOrder (only NULL rows) -- from 2026-05-20_section_order
{bf['section']}
-- 09d Annotations.nBDid (only NULL rows) -- from 2026-07-08_fact_annotation_nbdid
{bf['nbdid']}
\\endif

COMMIT;

-- ---------- 10 INDEXES (outside the transaction, no table locks) ----------
\\if :skip_indexes
\\echo skip_indexes=1: indexes skipped
\\else""")
for i in new_indexes: E(i['stmt'] + ';')
E(f"""\\endif

-- ---------- 11 VERIFY ----------
DROP TABLE IF EXISTS etab_verify;
CREATE TEMP TABLE etab_verify AS {CLASSIFY};
\\echo
\\echo ==================== VERIFY: per-object state after apply ====================
SELECT kind, schema, name, detail, CASE WHEN status LIKE 'DONE%' THEN 'PASS' ELSE 'FAIL ('||status||')' END AS result
FROM etab_verify ORDER BY (status NOT LIKE 'DONE%') DESC, kind, schema, name, detail;
SELECT 'invalid index' AS check_name, c.relname AS obj FROM pg_class c JOIN pg_index x ON x.indexrelid=c.oid
 WHERE NOT x.indisvalid AND c.relname IN ({idx_names});
SELECT 'Codemaster cat '||"nCategoryid" AS check_name, string_agg("cCodename"||' #'||coalesce("nSerialno"::text,'-'), ', ' ORDER BY "nSerialno" NULLS LAST) AS obj
  FROM public."Codemaster" WHERE "nCategoryid" IN (4,5,23,24,27) GROUP BY "nCategoryid" ORDER BY 1;
SELECT count(*) FILTER (WHERE status LIKE 'DONE%') AS pass, count(*) FILTER (WHERE status NOT LIKE 'DONE%') AS fail, count(*) AS total FROM etab_verify;
DO $v$
DECLARE n_fail int; n_bad_idx int;
BEGIN
  SELECT count(*) FILTER (WHERE status NOT LIKE 'DONE%' AND NOT (kind = 'INDEX' AND current_setting('etab.skip_indexes', true) = '1')) INTO n_fail FROM etab_verify;
  SELECT count(*) INTO n_bad_idx FROM pg_class c JOIN pg_index x ON x.indexrelid=c.oid WHERE NOT x.indisvalid AND c.relname IN ({idx_names});
  IF n_fail > 0 OR n_bad_idx > 0 THEN
    RAISE EXCEPTION 'VERIFY FAILED: % object(s) not in the expected state, % invalid index(es). The transaction above already COMMITTED; see the FAIL rows.', n_fail, n_bad_idx;
  END IF;
  RAISE NOTICE '==================== ALL CHECKS PASSED ====================';
END $v$;
""")
script = '\n'.join(out)
open(f'{B}/migrations/prod_etabella_com_uuid_{today}.sql', 'w', encoding='utf-8', newline='\n').write(script)

# ---------- ROLLBACK FILE ----------
rb = [f"""-- ROLLBACK for migrations/prod_etabella_com_uuid_{today}.sql  (generated {today})
-- Restores every replaced function to its pre-migration body (2026-05-19 snapshot, or the known live
-- version for et_bundles), drops new functions/triggers/indexes. New TABLES and COLUMNS are KEPT
-- (dropping them would destroy data written after the migration) -- drop by hand if really wanted.
-- Codemaster: relabels are reversed (guarded); inserted codes are left in place (harmless, may be referenced).
\\set ON_ERROR_STOP on
DO $g$ BEGIN IF current_database() <> 'etabella.com.uuid' THEN RAISE EXCEPTION 'ABORT wrong DB %', current_database(); END IF; END $g$;
BEGIN;"""]
for t_ in new_triggers: rb.append(f'DROP TRIGGER IF EXISTS {t_["name"]} ON {t_["schema"]}."{t_["table"]}";')
for f in fn_ship:
    if f['before'] is None: rb.append(f'DROP FUNCTION IF EXISTS {f["schema"]}.{f["sig"]};')
for f in fn_ship:
    if f['before'] is not None:
        if (f['schema'], f['sig']) in known_live:
            rb.append(f'\n-- ===== {f["schema"]}.{f["sig"]} (known live version: roman-only, 2026-09-01) =====\n' + roman_only_et_bundles)
        else:
            if f['drop_first']: rb.append(f'DROP FUNCTION IF EXISTS {f["schema"]}.{f["sig"]};')
            rb.append(f'\n-- ===== {f["schema"]}.{f["sig"]} (2026-05-19 body) =====\n' + f['prod_block'].replace('CREATE FUNCTION', 'CREATE OR REPLACE FUNCTION', 1))
for f in fn_drop: rb.append(f'\n-- ===== restore dropped overload {f["schema"]}.{f["sig"]} =====\n' + f['prod_block'].replace('CREATE FUNCTION', 'CREATE OR REPLACE FUNCTION', 1))
for p, r in code_relabels:
    rb.append(f"""UPDATE public."Codemaster" SET "cCodename" = {q(p['cCodename'])}, "nSerialno" = {qn(p['nSerialno'])} WHERE "nCodeid" = {r['nCodeid']} AND "nCategoryid" = {r['nCategoryid']} AND "cCodename" = {q(r['cCodename'])};""")
rb.append('COMMIT;')
for i in new_indexes: rb.append(f'DROP INDEX CONCURRENTLY IF EXISTS {i["schema"]}."{i["name"]}";')
open(f'{B}/migrations/rollback_prod_etabella_com_uuid_{today}.sql', 'w', encoding='utf-8', newline='\n').write('\n'.join(rb) + '\n')

# ---------- READ-ONLY PRE-FLIGHT ----------
ro = f"""-- READ-ONLY pre-flight for etabella.com.uuid: plain SELECTs (no temp tables). Safe to run any time.
\\pset pager off
SET default_transaction_read_only = on;
SELECT current_database() AS db, current_user AS usr, version() AS pg, now() AS at;
WITH etab_expect(kind, schema_name, obj_name, detail, before_md5, after_md5, known_md5) AS (VALUES
{vals()}
), etab_preflight AS ({CLASSIFY}
)
SELECT kind, schema, name, detail, status FROM etab_preflight ORDER BY (status LIKE 'DRIFT%') DESC, kind, schema, name, detail;
WITH etab_expect(kind, schema_name, obj_name, detail, before_md5, after_md5, known_md5) AS (VALUES
{vals()}
), etab_preflight AS ({CLASSIFY}
)
SELECT status, count(*) FROM etab_preflight GROUP BY status ORDER BY status;
"""
open(f'{B}/migrations/preflight_readonly_prod_{today}.sql', 'w', encoding='utf-8', newline='\n').write(ro)
json.dump(dict(fn_ship=[{k: v for k, v in f.items() if k not in ('block', 'prod_block')} for f in fn_ship], fn_drop=[f['sig'] for f in fn_drop],
               new_tables=[t_['name'] for t_ in new_tables], add_cols=add_cols, new_indexes=[i['name'] for i in new_indexes],
               new_triggers=[t_['name'] for t_ in new_triggers], new_ext=new_ext, code_inserts=code_inserts,
               code_relabels=[(p['nCodeid'], p['cCodename'], r['cCodename'], p['nSerialno'], r['nSerialno']) for p, r in code_relabels]),
          open(f'{S}/prod_manifest.json', 'w'), indent=1)
print(f'functions ship={len(fn_ship)} (new={n_new}, drop_first={sum(1 for f in fn_ship if f["drop_first"])}, sql-lang={[f["name"] for f in fn_ship if f["lang"]=="sql"]}) drop={[f["sig"] for f in fn_drop]}')
print(f'tables={[t_["name"] for t_ in new_tables]} constraints={[c["conname"] for c in new_constraints]} cols={len(add_cols)} idx={len(new_indexes)} trg={[t_["name"] for t_ in new_triggers]} ext={new_ext}')
print(f'codemaster inserts={[(r["nCategoryid"], r["cCodename"]) for r in code_inserts]}')
print(f'codemaster relabels={[(p["nCodeid"], p["cCodename"], "->", r["cCodename"]) for p, r in code_relabels]}')
print('script lines:', script.count(chr(10)))
