CREATE OR REPLACE FUNCTION public.et_convert_files_byids(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;
jBids uuid[];
jBDids uuid[];
jFtypes jsonb;
nSectionid uuid;
bundles uuid[];
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jBids := (parameter ->>'jBids')::uuid[];
jBDids := (parameter ->>'jBDids')::uuid[];
jFtypes:= (parameter ->>'jFtypes');
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
-- cFiletype := coalesce((parameter ->>'cFiletype'),'ALL');

-- select * from public.et_get_filetypes ('{"nSectionid":"8844","jBids":"{4054}","jBDids":"{}","nMasterid":"367"}','r1');fetch all in "r1";
bundles := (array (
		WITH RECURSIVE bdl_tree AS (
            SELECT bm."nBundleid", bm."nParentBundleid"
            FROM "BundleMaster" bm
			join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
            WHERE  bm."nBundleid" = ANY(jBids)  AND bm."nSectionid" = nSectionid
            UNION ALL
            SELECT c."nBundleid", c."nParentBundleid"
            FROM "BundleMaster" c
            JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"			
        )
		select "nBundleid" from "bdl_tree"));

open ref1 for select distinct "cPath" as "cPath","cPage","cRefpage","cFiletype","cFilename" ,"nBundledetailid","nBundledetailid" identifier,"nSectionid","nBundleid" from "BundleDetail"  where "nSectionid" = nSectionid  and "cStatus" = 'C' 
and ("nBundledetailid" = any(jBDids) or "nBundleid" = any(bundles))
and  jFtypes @> to_jsonb(upper("cFiletype"))
;

RETURN NEXT ref1;
	 
END;
$function$
