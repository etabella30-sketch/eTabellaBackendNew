CREATE OR REPLACE FUNCTION public.et_upload_report_detail_export(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid; nUPid uuid; cStatus text; dDate timestamp; cFiletype text;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nUPid := NULLIF(parameter ->>'nUPid','')::uuid;
cStatus := parameter ->>'cStatus';
dDate := parameter ->>'dDate';
cFiletype := parameter ->>'cFiletype';

/*

select * from et_upload_report_detail_export ('{""nUPid"":1}','r1','r2'); FETCH All in ""r1""; FETCH All in ""r2"";

select * From ""UploadDetail"" limit 1
select * From ""SectionMaster"" limit 1

*/

	
    OPEN ref1 FOR 

select u."nUPid",u."nUPid" || to_char(u."dCreateDt",'_yyyy_mm_dd')  as "cUnicid",b."cBundlename",s."cFolder",u."dCreateDt",('[]')::jsonb as files,count(d."nUDid") as totalfiles
from "UploadMaster" u 
left join "BundleMaster" b on b."nBundleid" = u."nBundleid"
left join "SectionMaster" s on s."nSectionid" = u."nSectionid"
join "UploadDetail" d on d."nUPid" = u."nUPid"
where  u."nUPid" = nUPid 
group by u."nUPid",b."cBundlename",s."cFolder",u."dCreateDt"
order by u."nUPid" desc;

    RETURN NEXT ref1;
    
	
	
	
	
    OPEN ref2 FOR 
select d."cName" as "File name",

 CASE 
            WHEN COALESCE(NULLIF(d."cSize", ''), '0')::bigint >= 1024*1024*1024 THEN 
                ROUND(COALESCE(NULLIF(d."cSize", ''), '0')::bigint / (1024*1024*1024)::numeric, 2) || ' GB'
            WHEN COALESCE(NULLIF(d."cSize", ''), '0')::bigint >= 1024*1024 THEN 
                ROUND(COALESCE(NULLIF(d."cSize", ''), '0')::bigint / (1024*1024)::numeric, 2) || ' MB'
            WHEN COALESCE(NULLIF(d."cSize", ''), '0')::bigint >= 1024 THEN 
                ROUND(COALESCE(NULLIF(d."cSize", ''), '0')::bigint / 1024::numeric, 2) || ' KB'
            ELSE 
                COALESCE(NULLIF(d."cSize", ''), '0') || ' Bytes'
        END AS "Size",

--""cSize"" as ""Size"",
case d."cStatus" when 'C' then 'Complete' when 'F' then 'Failed' else 'Pending' end  "Status" ,d."cType" "Type",
		to_char(u."dCreateDt", 'dd/mm/yyyy hh:mi AM' ) as "Uploaded at", (coalesce("cFname",'') || ' ' || coalesce("cLname",'')) as  "Upload by"
from "UploadDetail" d 
join "UploadMaster" u on u."nUPid" = d."nUPid"
join "UserMaster" m on m."nUserid" = u."nUserid"
where d."nUPid" = nUPid and
case when cStatus is not null then d."cStatus" = cStatus else true end and
case when cFiletype is not null then d."cType" = cFiletype else true end 
order by d."nUDid" desc;

/*

select * from ""UploadMaster""
select * from ""UserMaster""

select * from ""UploadDetail""

*/	
 	RETURN NEXT ref2;
	
	
	
	
	 
END;
$function$
