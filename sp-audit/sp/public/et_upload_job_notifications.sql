CREATE OR REPLACE FUNCTION public.et_upload_job_notifications(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
Declare nUPid uuid;
BEGIN

nUPid := parameter ->>'nUPid';

/*

 select * from public.et_upload_job_notifications ('{"nUPid":"7a6dbf2a-ea86-401d-9368-37bc4bbe510b"}','r1');fetch all in "r1";
 
select * From ""Notifications"" order by 1 desc
select * From ""UploadMaster"" order by 1 desc
select * From ""UserMaster"" order by 1 desc
select * From ""CaseMaster"" order by 1 desc
select * From ""BundleMaster"" order by 1 desc
select * From ""SectionMaster"" order by 1 desc
*/

open ref for
select up."nUPid",u."nUserid",c."nCaseid",u."cToken",'Document uploaded' as "cTitle",
    'Documents uploaded in ' || (case when bm."nBundleid" IS NOT NULL then coalesce(bm."cBundlename",'') else coalesce(sm."cFolder",'') end) || ' | Case no. ' || c."cCaseno" as "cMsg",up."nUPid" as "action"
    from "UploadMaster" up
    join "TeamRelation" tr on tr."nCaseid" = up."nCaseid"
    join "CaseMaster" c on c."nCaseid" = tr."nCaseid"
    join "UserMaster" u on u."nUserid" = tr."nUserid"
    left join "BundleMaster" bm on bm."nBundleid" = up."nBundleid"
    left join "SectionMaster" sm on sm."nSectionid" = up."nSectionid"
    where up."nUPid" = nUPid and nullif(u."cToken",'') is not null
    ;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
    
    
$function$
