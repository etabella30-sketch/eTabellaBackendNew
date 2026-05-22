CREATE OR REPLACE FUNCTION public.et_get_fileids(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nBundleid uuid;nSectionid uuid;cFiletype text default 'ALL';
BEGIN
-- select * from et_get_fileids('{"nSectionid":8764,"nBundleid":2219,"nMasterid":59}','r');fetch all in "r"
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nBundleid := parameter ->>'nBundleid';
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
cFiletype := coalesce((parameter ->>'cFiletype'),'ALL');

open ref1 for select jsonb_agg(bd."nBundledetailid") as "nIDs" from "BundleDetail"  bd
	LEFT JOIN "BDPermission" bp ON bp."nUserid" = nMasterid AND bp."nBundledetailid" = bd."nBundledetailid"
	left join "BDAssignment" ba on ba."nBundledetailid"= bd."nBundledetailid" and ba."nUserid" = nMasterid
	where coalesce(bp."nBDPid",'00000000-0000-0000-0000-000000000000') = '00000000-0000-0000-0000-000000000000'::uuid and ((bd."nSectionid" = nSectionid and 
	 (
        (coalesce(nBundleid,'00000000-0000-0000-0000-000000000000') = '00000000-0000-0000-0000-000000000000'::uuid AND coalesce(bd."nBundleid",'00000000-0000-0000-0000-000000000000') = '00000000-0000-0000-0000-000000000000'::uuid) OR 
		(coalesce(nBundleid,'00000000-0000-0000-0000-000000000000') != '00000000-0000-0000-0000-000000000000'::uuid AND bd."nBundleid" = nBundleid)
	)
	) 
	or (ba."nSectionid" = nSectionid and 
	  (
                (coalesce(nBundleid,'00000000-0000-0000-0000-000000000000') = '00000000-0000-0000-0000-000000000000'::uuid AND coalesce(ba."nBundleid",'00000000-0000-0000-0000-000000000000') = '00000000-0000-0000-0000-000000000000'::uuid) OR 
                (coalesce(nBundleid,'00000000-0000-0000-0000-000000000000') != '00000000-0000-0000-0000-000000000000'::uuid AND ba."nBundleid" = nBundleid)
      )
	 ))
and "cStatus" = 'C' and case when coalesce(cFiletype,'ALL') = 'ALL' then true else upper("cFiletype") = upper(cFiletype) end;

RETURN NEXT ref1;
	 
END;
$function$
