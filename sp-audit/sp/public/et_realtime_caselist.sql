CREATE OR REPLACE FUNCTION public.et_realtime_caselist(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare cUnicuserid text;pageNumber int;offsetCount int;perPage int default 20;
BEGIN

cUnicuserid := parameter ->>'cUnicuserid';
pageNumber := coalesce( (parameter ->>'pageNumber')::int ,1);
offsetCount := (pageNumber - 1) * perPage;
/*
select * From "RSessionMaster" order by 1 desc
select * From "RSessionDetail" order by 1 desc

alter table "RSessionDetail" add column "cNotifytype" character varying(2)

alter table "RSessionDetail" drop column "cUsertype"

select * From "CaseMaster" order by 1 desc

select * from et_realtime_caselist ('{""pageNumber"":1,""cUnicuserid"":""cg43rg4uac"",""dDate"":""2024-05-03T16:55:04+05:30""}','r1');fetch all in ""r1"";

select * From "RSessionMaster"  order by 1 desc
select * From "BundleDetail" limit 1
*/
open ref for 
select distinct c."nCaseid" ,c."cCasename",s."nSectionid",max(b."dCreateDt") "dUploadDt"
From "CaseMaster" c
join "RSessionMaster" r on c."nCaseid" = r."nCaseid"
join "SectionMaster" s on s."nCaseid" = r."nCaseid" and "cFoldertype" = 'TS'
left join "BundleDetail" b on b."nSectionid" = s."nSectionid"  
where r."cUnicuserid" = cUnicuserid and r."cSType" != 'D'
group by c."nCaseid" ,c."cCasename",s."nSectionid" order by c."cCasename" 
LIMIT perPage
OFFSET offsetCount;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
