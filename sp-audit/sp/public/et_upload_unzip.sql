CREATE OR REPLACE FUNCTION public.et_upload_unzip(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nCaseid uuid;nSectionid uuid;nBundleid uuid;cPath text;nJobid uuid;identifier text;nUDid uuid;
converttype text;bIsconvert boolean;nUPid uuid;bIsocr boolean;nOcrtype int;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
cPath := parameter ->>'cPath';
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;
identifier := parameter ->>'identifier';
nUDid := NULLIF(parameter ->>'nUDid','')::uuid;
converttype := parameter ->>'converttype';
bIsconvert := coalesce((parameter ->>'bIsconvert'),'false')::boolean;
nOcrtype := parameter ->>'nOcrtype';
bIsocr := coalesce((parameter ->>'bIsocr'),'false')::boolean;

nJobid = (select "nJobid" from "JobMaster" where "cPath" = cPath and "nCaseid" = nCaseid limit 1);

if(nJobid IS NOT NULL)then 

    update "JobMaster" set "cStatus" = 'P',"nUDid"=nUDid where "nJobid" = nJobid;

else

insert into "JobMaster"("cPath","nUserid","nCaseid","dCreatedt","nBundleid","nSectionid","identifier","nUDid","converttype","bIsconvert","bIsocr","nOcrtype")
values(cPath,nMasterid,nCaseid,now(),nBundleid,nSectionid,identifier,nUDid,converttype,bIsconvert,bIsocr,nOcrtype)
returning "nJobid" into nJobid;

end if;

update "UploadDetail" set "isUploaded" = true,"cStatus" = 'C' where "nUDid" = nUDid;

select "nUPid" into nUPid from "UploadDetail" where "nUDid" = nUDid;
update "UploadMaster" set "nCompleted" = coalesce("nCompleted") + 1 where "nUPid" = nUPid;

open ref for select 1 as msg,'Updated' as value,nJobid as "nJobid";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
