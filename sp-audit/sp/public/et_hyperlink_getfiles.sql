CREATE OR REPLACE FUNCTION public.et_hyperlink_getfiles(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;nBundledetailid uuid;nSectionid uuid;cType text; nBundleid uuid; nBundleids uuid[];
BEGIN
nMasterid := NULLIF(parameter ->> 'nMasterid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
cType = parameter ->>'cType';
nBundleid = NULLIF(parameter ->>'nBundleid','')::uuid;

 

/*
select * from et_hyperlink_getfiles('{"nSectionid":857,"nMasterid":2}','r','r2');fetch all in "r";fetch all in "r2";

select * from et_hyperlink_getfiles ('{"nBundledetailid":555372,"nSectionid":857,"nCaseid":289,"cType":"T","nMasterid":2}','r1','r2');fetch all in "r1";fetch all in "r2";

select * from et_hyperlink_getfiles ('{"nSectionid":9348,"nCaseid":1097,"cType":"T","nMasterid":2,"cKeeptype":"K","isDeepscan":"Y"}','r1','r2');fetch all in "r1";fetch all in "r2";

select * From "BundleDetail" group by "cFiletype"
*/

nBundleids := (array(SELECT "nBundleid" FROM get_sorted_hierarchy_bundle(nBundleid)));

open ref1 for 
select b."nBundledetailid" as id,b."nBundledetailid",b."cFilename",b."cPath" from "BundleDetail" b 
		where b."nSectionid" = nSectionid and 
		case when nBundleid IS NOT NULL then 
		b."nBundleid" = any(nBundleids)
		else true end 
		and b."cStatus" = 'C' and case when nBundledetailid IS NOT NULL then true else coalesce(b."cIsindex",false) = false end
		and case when nBundledetailid IS NOT NULL then 
		b."nBundledetailid" = nBundledetailid else true end and upper(b."cPath") LIKE '%.PDF' -- and "cFiletype" = 'PDF'
	;

RETURN next ref1;     

open ref2 for 
select 1 as msg;
RETURN next ref2;

    END;
$function$
