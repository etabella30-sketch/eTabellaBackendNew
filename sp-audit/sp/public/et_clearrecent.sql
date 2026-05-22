CREATE OR REPLACE FUNCTION public.et_clearrecent(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nSectionid uuid;nCaseid uuid; cType text;
BEGIN
-- select * from et_recent_files('{""nCaseid"":22,""nSectionid"":92,""nMasterid"":59}','r');fetch all in ""r""
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
cType := parameter ->>'cType';
	
-- select * from "BundleDetail" limit 10

-- delete from "RecentFiles" r
-- using "BundleDetail" bd where bd."nBundledetailid"  = r."nBDid" 
-- and r."nUserid" = nMasterid and
-- case cType when 'P' then r."cType" = 'P'
-- else bd."nSectionid" = nSectionid
-- end;

	DELETE FROM "RecentFiles" r
	USING "BundleDetail" bd
	JOIN "SectionMaster" sm ON sm."nSectionid" = bd."nSectionid"
	WHERE bd."nBundledetailid" = r."nBDid"
	AND r."nUserid" = nMasterid
	AND sm."nCaseid" = nCaseid
	AND r."cType" = cType
	and case when nSectionid is not null then bd."nSectionid" = nSectionid else true end;
	
OPEN ref1 FOR select 1 msg,'Clear recent files.' value;

RETURN NEXT ref1;
	 
END;
$function$
