CREATE OR REPLACE FUNCTION public.et_upload_report_filter(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nCaseid uuid;cStatus text;dDate timestamp;cFiletype text;nUPid uuid;pageNumber int;offsetCount int;perPage int default 10;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
cStatus := parameter ->>'cStatus';
dDate := parameter ->>'dDate';
cFiletype := parameter ->>'cFiletype';
nUPid := NULLIF(parameter ->>'nUPid','')::uuid;
pageNumber := coalesce( (parameter ->>'pageNumber')::int ,1);
offsetCount := (pageNumber - 1) * perPage;

/*

select * from et_upload_report_filter ('{""nCaseid"":266,""nMasterid"":2}','r1');fetch all in ""r1"";

select * From "UploadMaster" order by 1 desc limit 1
select * From "UploadDetail" order by 1 desc limit 1

select * From "UploadMaster" order by 1 desc limit 1

select * From "SectionMaster"

"nCompleted","nTotal"

*/

open ref for
select u."nUPid",u."nUPid" || to_char(u."dCreateDt",'_yyyy_mm_dd')  as "cUnicid",b."nBundleid",s."nSectionid",b."cBundlename",s."cFolder",jsonb_agg(d) as files,
u."nTotal" as totalfiles,u."nCompleted"  as completed,("nTotal" - "nCompleted")  as "failed" --count(d."nUDid")
from "UploadMaster" u 
left join "BundleMaster" b on b."nBundleid" = u."nBundleid"
left join "SectionMaster" s on s."nSectionid" = u."nSectionid"

/*left join (
	select "nUPid",sum(case when "cStatus"  ) From "UploadDetail" 
) d on d."nUPid" = u."nUPid"*/
--join "UploadDetail" d on d."nUPid" = u."nUPid"

join (

select d."nUPid","nUDid","cName" as "cFilename","cType" as "filetype","cSize" as "filesize","nBundledetailid","cStatus"  
from "UploadDetail" d 
where 
case when cStatus is not null then d."cStatus" = cStatus else true end and
case when cFiletype is not null then d."cType" = cFiletype else true end 
order by d."nUDid" desc

) d on d."nUPid" = u."nUPid"

where u."nCaseid" = nCaseid  and
case when nUPid is not null then u."nUPid" = nUPid else true end and 
case when dDate is not null then u."dCreateDt"::date = dDate::date else true end
group by u."nUPid",b."cBundlename",s."cFolder",b."nBundleid",s."nSectionid",u."nTotal",u."nCompleted"
order by u."nUPid" desc
      LIMIT perPage
        OFFSET offsetCount;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
