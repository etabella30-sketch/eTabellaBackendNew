CREATE OR REPLACE FUNCTION public.et_assign_custom_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nSectionid uuid;nMasterid uuid;
jBDids jsonb;

BEGIN
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jBDids := parameter ->>'jBDids';

	select s."nSectionid" into nSectionid from "SectionMaster" s
	where "nCaseid" = nCaseid and "cFoldertype" = 'CB' and "nUserid" = nMasterid;
 
open ref for
	select ba."nBundleid",case when ba."nBundleid" IS NOT NULL then bm."cBundlename" else s."cFolder" end "cBundlename",
	ba."nSectionid" -- ,jsonb_agg(ba."nBundledetailid") "jBDids"
	from "BDAssignment" ba 
	left join "BundleMaster" bm on bm."nBundleid" = ba."nBundleid"
	left Join "SectionMaster" s on s."nSectionid" = ba."nSectionid"
	where ba."nSectionid" = nSectionid and case when ba."nBundleid" IS NOT NULL then ba."nBundleid" = bm."nBundleid" else true end and ba."nUserid" = nMasterid
	and jBDids @> to_jsonb(ba."nBundledetailid")
	group by ba."nBundleid",ba."nSectionid",bm."cBundlename",s."cFolder"
	order by bm."cBundlename" desc;
	
 Return ref;
 -- Return the cursor to the caller
    END;
$function$
