CREATE OR REPLACE FUNCTION public.et_transfer_bundles(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;
jFolders uuid[];jFiles uuid[];
type text;nBundleid uuid;nSectionid uuid;inserted_ids uuid[];row RECORD;inserted_bids uuid[];
nowDt timestamp := now();
BEGIN
 -- select * from et_copy_bundles('{""nMasterid"":59,""jFolders"":""{}"",""jFiles"":""{328446}"",""nSectionid"":94,""nBundleid"":1342510,""type"":""Copy""}','r');fetch all in ""r""
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jFolders := parameter ->>'jFolders';
jFiles := parameter ->>'jFiles';
nBundleid := parameter ->>'nBundleid';
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
type := parameter ->>'type';

drop table if exists temp_bundles;
create temp table temp_bundles as 
WITH RECURSIVE ChildHierarchy AS (
    SELECT b1."nBundleid",nBundleid "nParentBundleid"
    FROM "BundleMaster" b1
    WHERE b1."nBundleid" = any (jFolders)
    UNION ALL
    SELECT bm."nBundleid",bm."nParentBundleid"
    FROM "BundleMaster" bm
    INNER JOIN ChildHierarchy ch ON bm."nParentBundleid" = ch."nBundleid"
) select "nBundleid","nParentBundleid" from ChildHierarchy
;

update "BundleMaster" b set "nSectionid" = nSectionid,"nParentBundleid" = t."nParentBundleid" from temp_bundles t where b."nBundleid" = t."nBundleid";

update "BundleDetail" b set "nSectionid" = nSectionid from temp_bundles t where b."nBundleid" = t."nBundleid";

update "BundleDetail" b set "nSectionid" = nSectionid,"nBundleid" = nBundleid where b."nBundledetailid" = any (jFiles);

open ref for select 1 as msg,'Transfered' as value;

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
