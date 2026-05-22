CREATE OR REPLACE FUNCTION public.et_upload_deletefiles(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;jFiles jsonb;nCaseid uuid;--jFolders jsonb;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jFiles := parameter ->>'jFiles';
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
--jFolders := parameter ->>'jFolders';

insert into "DeleteBundleDetail"("nBundledetailid","nUserid","cPath")
select ud."nBundledetailid",nMasterid,bd."cPath" 
from "UploadDetail" ud 
join "BundleDetail" bd on bd."nBundledetailid" = ud."nBundledetailid"
where jFiles @> to_jsonb(ud."nUDid") --or jFolders @> to_jsonb(ud."nUPid")
;

DELETE FROM "BundleDetail" bd
WHERE EXISTS (
    SELECT *
    FROM "UploadDetail" ud
    WHERE ud."nBundledetailid" = bd."nBundledetailid"
      AND jFiles @> to_jsonb(ud."nUDid") -- OR jFolders @> to_jsonb(ud."nUPid"))
);

delete from "UploadDetail" where jFiles @> to_jsonb("nUDid") --or jFolders @> to_jsonb("nUPid")
;

delete from "UploadMaster" 	um
WHERE "nCaseid" = nCaseid and not EXISTS (
 SELECT *
    FROM "UploadDetail" ud
    WHERE ud."nUPid" = um."nUPid"
	 --AND jFiles @> to_jsonb(ud."nUDid") 
)
/*
delete from "UploadMaster" 	um
WHERE EXISTS (
 SELECT 1
    FROM "UploadDetail" ud
    WHERE ud."nUPid" = um."nUPid"
	 AND jFiles @> to_jsonb(ud."nUDid") 
)*/

	
	--where jFolders @> to_jsonb("nUPid")
	
;

with dtl as (
select d."nUPid" ,sum(case when "cStatus" = 'C' then 1 else 0 end) as "totalCompelte",count(d."nUDid") as "TotalFiles"
	from "UploadDetail" d 
	group by d."nUPid"
)
update "UploadMaster" m set "nTotal" = t."TotalFiles","nCompleted" = t."totalCompelte" from dtl t where m."nCaseid" = nCaseid and t."nUPid" = m."nUPid";

open ref for select 1 as msg,'Files Deleted' as value ;
		
 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
