CREATE OR REPLACE FUNCTION public.et_get_file_metadata(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;
jBDids jsonb;jBDidArr uuid[];
BEGIN

raise notice 'jBDidArr %',jBDidArr;
-- select * from et_get_file_metadata('{"nSectionid":8764,"nBundledetailid":"03ed2081-e1ba-4a80-b609-893f7a8ea3b5","nMasterid":"ba561c55-81f5-4180-8934-2ce6dcaa096c"}','r');fetch all in "r"
nMasterid := parameter ->>'nMasterid';
jBDids := parameter ->>'jBDids';

jBDidArr := ARRAY(
  SELECT jsonb_array_elements_text(jBDids)
);
-- select * from "BundleDetail" limit 1
open ref1 for select bd."nBundledetailid","cFilename","cDesc","dIntrestDt","cExhibitno" from "BundleDetail"  bd
        LEFT JOIN "BDPermission" bp ON bp."nUserid" =  nMasterid AND bp."nBundledetailid" = bd."nBundledetailid"	
	where bd."nBundledetailid" = ANY(jBDidArr)
	and  coalesce("nBDPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid
and "cStatus" = 'C' ;

RETURN NEXT ref1;
	 
END;
$function$
