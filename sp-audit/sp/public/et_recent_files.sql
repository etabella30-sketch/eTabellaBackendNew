CREATE OR REPLACE FUNCTION public.et_recent_files(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nSectionid uuid;nCaseid uuid; cType text;
ids uuid[];
BEGIN
-- select * from et_recent_files('{"nCaseid":22,"nMasterid":59}','r');fetch all in "r"
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
cType := parameter ->>'cType';
	
 select array_agg("nSectionid") into ids from "SectionMaster" where "nCaseid" = nCaseid;
-- select * from "RecentFiles" order by 1 desc
	
OPEN ref1 FOR
select "nBundledetailid","nBundleid","cFilename" "cName","cPage","cRefpage","cTab","cFiletype","cExhibitno" from "RecentFiles" r
join "BundleDetail" bd on bd."nBundledetailid"  = r."nBDid" 
where r."nUserid" = nMasterid
and (
case 
	when cType = 'P' then r."cType" = 'P' 
	WHEN cType = 'N' THEN r."cType" = 'N'
	else 
	(case when nSectionid IS NOT NULL then bd."nSectionid" = nSectionid else bd."nSectionid" = any(ids) end)
end
)
order by r."dCreateDt" desc limit 100;
RETURN NEXT ref1;
	 
END;
$function$
