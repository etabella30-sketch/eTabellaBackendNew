CREATE OR REPLACE FUNCTION public.et_upload_clearcompletes(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nCaseid uuid;--jFolders jsonb;
nSectionid uuid;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid:= NULLIF(parameter ->>'nSectionid','')::uuid;

/*

select * from et_upload_clearcompletes ('{""jFiles"":""[1,2]"",""nMasterid"":2}','r1');fetch all in ""r1"";

select * from ""UploadMaster""
*/

delete from "UploadDetail" ud
WHERE ud."cStatus" = 'C' and EXISTS (
 SELECT *
    FROM "UploadMaster" um
    WHERE ud."nUPid" = um."nUPid" and um."nCaseid" = nCaseid and case when nSectionid is not null then "nSectionid" = nSectionid else true end
);

delete from "UploadMaster" um where um."nCaseid" = nCaseid 
and 
not exists (
select * From "UploadDetail" ud where ud."nUPid" = um."nUPid"
);

with dtl as (
select d."nUPid" ,sum(case when "cStatus" = 'C' then 1 else 0 end) as "totalCompelte",count(d."nUDid") as "TotalFiles"
	from "UploadDetail" d 
	group by d."nUPid"
)
update "UploadMaster" m set "nTotal" = t."TotalFiles","nCompleted" = t."totalCompelte" from dtl t where m."nCaseid" = nCaseid and t."nUPid" = m."nUPid";

open ref for select 1 as msg,'Files Cleared' as value ;
		
 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
