-- 2026-05-20 — Rollback of BundleMaster denormalized file counts (Phase 2.3)
--
-- Drops triggers + functions, restores the pre-migration et_bundles SP,
-- drops the two file-count columns. Idempotent.

BEGIN;

-- 1. Triggers
DROP TRIGGER IF EXISTS trg_bundlemaster_delete_cascade ON "BundleMaster";
DROP TRIGGER IF EXISTS trg_bundlemaster_parent_move    ON "BundleMaster";
DROP TRIGGER IF EXISTS trg_bundledetail_filecount      ON "BundleDetail";

-- 2. Functions
DROP FUNCTION IF EXISTS fn_bundle_delete_cascade();
DROP FUNCTION IF EXISTS fn_bundle_parent_move();
DROP FUNCTION IF EXISTS fn_bundle_filecount_bd_change();

-- 3. Restore et_bundles SP — same body as the pre-2.3 version saved at
--    sp-audit/sp/public/_versions/et_bundles.before-file_counts.sql
CREATE OR REPLACE FUNCTION public.et_bundles(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;pageNumber int;offsetCount int;perPage int default 2000;nSectionid uuid;nBundleid uuid;
isAdmin boolean default false;
BEGIN
nMasterid := (parameter ->>'nMasterid')::uuid;
pageNumber := coalesce((parameter ->>'pageNumber')::int, 1);
offsetCount := (pageNumber - 1) * perPage;
nBundleid := coalesce((parameter ->>'nBundleid')::uuid, null);
nSectionid := (parameter ->>'nSectionid')::uuid;

  select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nMasterid;

OPEN ref1 FOR
with bundle as
(select ROW_NUMBER() OVER(ORDER BY split_hierarchical_sort_multi(b."cBundletag", ARRAY['.', '-']),split_hierarchical_sort_multi(b."cBundlename", ARRAY['.', '-'])) serial, b."nBundleid",coalesce(b."nParentBundleid", null) "nParentBundleid",b."cBundlename",b."cBundletag"
from "BundleMaster" b
left join "BMPermission" p on p."nUserid" = nMasterid and p."nBundleid" = b."nBundleid"
where case when isAdmin then true else p."nBMPid" is null end  and
b."nSectionid" = nSectionid and case when nBundleid is not null then b."nParentBundleid" = nBundleid else b."nParentBundleid" is null end
) select * from bundle
order by serial
LIMIT perPage
OFFSET offsetCount
;
RETURN NEXT ref1;

END;
$function$;

-- 4. Drop the columns last so the SP restore doesn't briefly reference them.
ALTER TABLE "BundleMaster"
  DROP COLUMN IF EXISTS "nFileCountDescendant",
  DROP COLUMN IF EXISTS "nFileCount";

COMMIT;
