CREATE OR REPLACE FUNCTION public.et_get_filetypes(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;
jBids uuid[];
jBDids uuid[];
nSectionid uuid;
bundles uuid[];
filetypes jsonb = '["DOC", "DOCX", "XLS", "XLSX", "PPT", "PPTX", "JPG", "JPEG", "PNG", "MSG"]';
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jBids := NULLIF(parameter ->>'jBids','')::uuid[];
jBDids := NULLIF(parameter ->>'jBDids','')::uuid[];
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
-- cFiletype := coalesce((parameter ->>'cFiletype'),'ALL');

-- select * from public.et_get_filetypes ('{"nSectionid":8844,"jBids":"{4054}","jBDids":"{}","nMasterid":367}','r1');fetch all in "r1";
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

open ref1 for select distinct upper("cFiletype") type from "BundleDetail" where "nSectionid" = nSectionid  and "cStatus" = 'C' 
and ("nBundledetailid" = any(jBDids) or "nBundleid" = any(bundles))
and  filetypes @> to_jsonb(upper("cFiletype"))
--and case when coalesce(cFiletype,'ALL') = 'ALL' then true else upper("cFiletype") = upper(cFiletype) end
;

RETURN NEXT ref1;
	 
END;
$function$
