CREATE OR REPLACE FUNCTION task.et_elasticsearch_insert_tasks(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
    
declare nCaseid uuid;nUserid uuid;nBundledetailid uuid;nBundleid uuid;nSectionid uuid;nESid uuid; nBundleids uuid[];
nTid uuid;nTotal int;

BEGIN
    
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;

    
/*
  select * from task.et_elasticsearch_insert_tasks ('{"nSectionid":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","nBundleid":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","nBundledetailid":"00000000-0000-0000-0000-000000000000","nCaseid":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","nMasterid":"a1b2c3d4-e5f6-7890-abcd-ef1234567890"}','r1');fetch all in "r1";

select * from task."ElasticSearchMaster"

truncate table  task."ElasticSearchMaster" restart identity cascade;
truncate table  task."TaskMaster" restart identity cascade;

select * from task."TaskMaster"
select * from task."TaskRemarkDetail"
select * from task."TaskCategory"

select * from task."TaskDetail"
select * from task."TaskRemarks"
 */
/*
insert into task."TaskMaster"("nTCatid","nUserid","nCaseid")
    values(6,nUserid,nCaseid) returning "nTid" into nTid;

insert into task."ElasticSearchMaster" ("nUserid","nTid","nCaseid","nSectionid","nBundleid","nBundledetailid")
values(nUserid,nTid,nCaseid,nSectionid,nBundleid,nBundledetailid)
returning "nESid" into nESid;

nBundleids := (array(SELECT  "nBundleid" FROM get_sorted_hierarchy_bundle(nBundleid)));

WITH inserted_rows AS (
    INSERT INTO task."TaskDetail"("nTid","nBDid")
    select nTid,b."nBundledetailid" from "BundleDetail" b 
        where b."nSectionid" = nSectionid and 
        case when nBundleid IS NOT NULL then 
        b."nBundleid" = any(nBundleids)
        else true end 
        and  b."cStatus" = 'C' 
        and case when nBundledetailid IS NOT NULL then 
        b."nBundledetailid" = nBundledetailid else true end 
        and upper(b."cPath") LIKE '%.PDF'
    RETURNING 1
)
SELECT COUNT(*) into nTotal FROM inserted_rows;

-- select * from task."TaskRemarkDetail"

 INSERT INTO task."TaskRemarkDetail"("nTDid","nRid")
select "nTDid",8 from task."TaskDetail" where "nTid" = nTid;
    

update task."TaskMaster" set "nTotal" = nTotal where "nTid" = nTid;

open ref for 
select nESid as "nESid" ,nTid as "nTid",nTotal as "nTotal"
;*/
    /*
nBundleids := (array(SELECT  "nBundleid" FROM get_sorted_hierarchy_bundle(nBundleid)));

open ref for 
    select nTid,b."nBundledetailid" from "BundleDetail" b 
        where b."nSectionid" = nSectionid and 
        case when nBundleid IS NOT NULL then 
        b."nBundleid" = any(nBundleids || nBundleid)
        else true end 
        and  b."cStatus" = 'C' 
        and case when nBundledetailid IS NOT NULL then 
        b."nBundledetailid" = nBundledetailid else true end 
    --    and upper(b."cPath") LIKE '%.PDF'
    ;

*/

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
