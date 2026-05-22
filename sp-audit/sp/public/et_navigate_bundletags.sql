CREATE OR REPLACE FUNCTION public.et_navigate_bundletags(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nSectionid uuid;
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
	-- select * from et_navigate_bundles('{"nSectionid":92,"nUserid":2}','r');fetch all in "r"
OPEN ref1 FOR 
select distinct b."cBundletag",b."nBundleid" from "BundleMaster" b
left join "BMPermission" p on p."nUserid" = nMasterid and p."nBundleid" = b."nBundleid"
where p."nBMPid" is null  and 
  b."nSectionid" = nSectionid and coalesce("cBundletag",'') != ''  
order by b."cBundletag";
RETURN NEXT ref1;
    
	
	
	
	
	 
END;
$function$
