CREATE OR REPLACE FUNCTION public.et_get_ocrdata_multi(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nSectionid uuid;nBundleid uuid;cTab text;nCaseid uuid; cType text;
BEGIN
-- select * from et_get_ocrdata_multi('{"nSectionid":9374,"cTab":"A1","nCaseid":289,"nMasterid":59}','r');fetch all in "r"
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

	-- select * from "BDAttributes"
OPEN ref1 FOR 

select "cPath" as "cPath","cFilename" ,b."nBundledetailid"
	from "BundleDetail" b
	JOIN "BDAttributes"  ba on ba."nBundledetailid" =b."nBundledetailid"
	where b."cStatus" = 'C' and "cFiletype" ='PDF'  and b."nSectionid" = nSectionid and b."cIsindex" = false ; -- and CASE WHEN nBundleid IS NOT NULL THEN "nBundleid" = nBundleid ELSE true END and b."nBundledetailid" not in (272897,272997,273014,273010,273030,272906,272907,272909,272910);

RETURN NEXT ref1;
	 
END;
$function$
