-- READ-ONLY check of the restored copy (run against -d etabella.tech.uuid).
-- Expected from the 15-09-2026 backup:
--   functions 1042 | tables 225 | triggers 385 | sequences 53 | views 20 | extensions 2 | row counts > 0
select current_database() as db, version() as pg;

select 'functions' as what, count(*) as n
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname not in ('pg_catalog', 'information_schema')
union all select 'tables',     count(*) from pg_tables where schemaname not in ('pg_catalog', 'information_schema')
union all select 'triggers',   count(*) from pg_trigger where not tgisinternal
union all select 'sequences',  count(*) from information_schema.sequences
union all select 'views',      count(*) from pg_views where schemaname not in ('pg_catalog', 'information_schema')
union all select 'extensions', count(*) from pg_extension where extname in ('pg_trgm', 'uuid-ossp')
union all select 'rows CaseMaster',   count(*) from "CaseMaster"
union all select 'rows BundleDetail', count(*) from "BundleDetail"
union all select 'rows FactMaster',   count(*) from "FactMaster"
union all select 'rows Codemaster',   count(*) from "Codemaster";

select nspname as schema, pg_get_userbyid(nspowner) as owner
  from pg_namespace
 where nspname not like 'pg\_%' and nspname <> 'information_schema'
 order by 1;
