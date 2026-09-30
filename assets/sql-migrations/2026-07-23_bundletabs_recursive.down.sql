CREATE OR REPLACE FUNCTION public.et_navigate_bundletabs(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nSectionid uuid;nBundleid uuid;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;
	-- select * from et_navigate_bundletabs ('{"nSectionid":92,"nBundleid":1344752,"nMasterid":59}','r1');fetch all in "r1";
OPEN ref1 FOR 

select b."cTab",b."nBundledetailid","cPage" from "BundleDetail" b
left join "BMPermission" p on p."nUserid" = nMasterid and p."nBundleid" = b."nBundleid" 
where p."nBMPid" is null  and b."nBundleid" = nBundleid and
  b."nSectionid" = nSectionid and coalesce("cTab",'') != ''  
  group by b."cTab",b."nBundledetailid","cPage",sorted_tab
order by sorted_tab; 

RETURN NEXT ref1;
    
END;
$function$
