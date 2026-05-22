CREATE OR REPLACE FUNCTION public.et_delete_bundles(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;jFolders uuid[];jFiles uuid[];jDelfiles jsonb;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jFolders := parameter ->>'jFolders';
jFiles := parameter ->>'jFiles';

/*

select * from et_delete_bundles ('{"jFolders":"{}","jFiles":"{327484-uuid-format}","nMasterid":"2-uuid-format"}','r1');fetch all in "r1";
select * from et_delete_bundles ('{"jFolders":"{}","jFiles":"{167463-uuid-format}","nMasterid":"366-uuid-format"}','r1');fetch all in "r1";
select count(*) from "BundleDetail"

select count(*) from "BundleMaster" 
1342379
select * From temp_bundles
select * From temp_bundledetail

*/

/*

WITH RECURSIVE ChildHierarchy AS (
    SELECT b1."nBundleid", b1."nParentBundleid"
    FROM "BundleMaster" b1
    WHERE b1."nBundleid"  = any (jFolders)
    UNION ALL
    SELECT bm."nBundleid",bm."nParentBundleid"
    FROM "BundleMaster" bm
    INNER JOIN ChildHierarchy ch ON bm."nParentBundleid" = ch."nBundleid"
),temp_bundles AS (
        SELECT "nBundleid" FROM ChildHierarchy
),temp_bundledetail AS (
        SELECT DISTINCT bd."nBundledetailid", bd."cPath"
        FROM temp_bundles t
        JOIN "BundleDetail" bd ON bd."nBundleid" = t."nBundleid" OR bd."nBundledetailid" = ANY(jFiles)
)

        INSERT INTO "DeleteBundleDetail" ("nBundledetailid", "cPath", "nUserid")
        SELECT "nBundledetailid", "cPath", nMasterid FROM temp_bundledetail;

        DELETE FROM "BMPermission" WHERE "nBundleid" IN (SELECT "nBundleid" FROM temp_bundles);
        DELETE FROM "BundleMaster" WHERE "nBundleid" IN (SELECT "nBundleid" FROM temp_bundles);
        DELETE FROM "BDPermission" WHERE "nBundledetailid" IN (SELECT "nBundledetailid" FROM temp_bundledetail);
        DELETE FROM "BundleDetail" WHERE "nBundledetailid" IN (SELECT "nBundledetailid" FROM temp_bundledetail);

        OPEN ref FOR SELECT 1 AS msg, 'Updated' AS value;
        RETURN ref;
*/

drop table if exists temp_bundles;
create temp table temp_bundles as 
WITH RECURSIVE ChildHierarchy AS (
    SELECT b1."nBundleid", b1."nParentBundleid"
    FROM "BundleMaster" b1
    WHERE b1."nBundleid"  = any (jFolders)
    UNION ALL
    SELECT bm."nBundleid",bm."nParentBundleid"
    FROM "BundleMaster" bm
    INNER JOIN ChildHierarchy ch ON bm."nParentBundleid" = ch."nBundleid"
) select "nBundleid" from ChildHierarchy
;

drop table if exists temp_bundledetail;
create temp table temp_bundledetail as
select distinct bd."nBundledetailid",bd."cPath"
From temp_bundles t
join "BundleDetail" bd on bd."nBundleid" = t."nBundleid" or bd."nBundledetailid" = any (jFiles);

if not exists (select * from "temp_bundles") then
    insert into temp_bundledetail("nBundledetailid","cPath")
    select distinct bd."nBundledetailid",bd."cPath"
    from "BundleDetail" bd where bd."nBundledetailid" = any (jFiles);
end if;

-- select * from "DeleteBundleDetail" order by 1 desc limit 10
insert into "DeleteBundleDetail" ("nBundledetailid","cPath","nUserid")
select "nBundledetailid","cPath",nMasterid from temp_bundledetail;

delete from "BMPermission" bp
using temp_bundles t where t."nBundleid" = bp."nBundleid";

delete from "BundleMaster" bp
using temp_bundles t where t."nBundleid" = bp."nBundleid";

delete from "BDPermission" bp
using temp_bundledetail t where t."nBundledetailid" = bp."nBundledetailid";

delete from "BundleDetail" bp
using temp_bundledetail t where t."nBundledetailid" = bp."nBundledetailid";

delete from "BDAttributes" bp
using temp_bundledetail t where t."nBundledetailid" = bp."nBundledetailid";

select jsonb_agg(t."cPath") into jDelfiles t 
from temp_bundledetail t;

open ref for 
    select 1 as msg,'Updated' as value,coalesce(jDelfiles,'[]'::jsonb) as "jDelfiles"
--select * from jsonb_to_recordset(jFolders) as t("id" int)

;

 

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
