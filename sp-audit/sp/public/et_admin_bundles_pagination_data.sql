CREATE OR REPLACE FUNCTION public.et_admin_bundles_pagination_data(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nCaseid uuid;nBundledetailid uuid;
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
/*
select * from et_admin_bundles_pagination_data ('{""nBundleid"":1,""nMasterid"":2,""nCaseid"":22}','r1');fetch all in ""r1"";
select * From ""BundleDetail""
*/
open ref for 
select bd."cPage",bd."cRefpage",bt."jPagination","cPrefix"
From "BundleDetail" bd 
join "BDAttributes" bt on bt."nBundledetailid" = bd."nBundledetailid"
where bd."nBundledetailid" = nBundledetailid;
 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
