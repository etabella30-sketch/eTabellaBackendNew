CREATE OR REPLACE FUNCTION public.et_batchfile_log_summery(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
-- select * from "BundleDetail" 
declare nUserid uuid;nCaseid uuid;nSectionid uuid;
-- select * from "et_batchfile_log_summery"('{""nMasterid"":59,""nCaseid"":268,""nSectionid"":820}','r');fetch all in "r"
BEGIN
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
-- select * from "Batchlog"
-- alter table "Batchlog" add column "nUpdateid" int

open ref for
select to_char(b."dUpdateDt",'yyyy_mon_yy') || '_' || b."nBlogid"::text "cBatchno",b."nBlogid","cFilename","cColumn",b."cStatus",b."dUpdateDt",
count(distinct bd."nBundledetailid") filter (where "isChange" = true) "nRcount",
 count(distinct bd."column_name") filter (where "isChange" = true) as "nCcount",
 um."cFname",um."cLname",um."cProfile" from "Batchlog" b

left join "UserMaster" um on um."nUserid" = b."nUpdateid"
left join "BatchlogDetail" bd on bd."nBlogid" = b."nBlogid" where b."cStatus" = 'C' and b."nCaseid" = nCaseid --and "nSectionid" = nSectionid 

-- and "nCreateId" = nUserid
group by b."dUpdateDt",b."nBlogid","cBatchno","cFilename","cColumn",b."cStatus", um."cFname",um."cLname",um."cProfile"
order by "nBlogid" desc;

  
   return ref;-- Return the cursor to the caller
    END;
$function$
