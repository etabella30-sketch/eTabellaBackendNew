CREATE OR REPLACE FUNCTION task.et_hyperlink_insert_tasks(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
	
declare nCaseid uuid; nUserid uuid; nBundledetailid uuid; nBundleid uuid; nSectionid uuid; nHid uuid; nBundleids uuid[];
cKeeptype text; cType text; isDeepscan boolean; nTid uuid; nTotal int; nRid int;

BEGIN
	
nCaseid := NULLIF(parameter ->>'nCaseid', '')::uuid;
nUserid := NULLIF(parameter ->>'nMasterid', '')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid', '')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid', '')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid', '')::uuid;
cKeeptype := parameter ->>'cKeeptype';
cType := parameter ->>'cType';
isDeepscan := nullif((parameter ->>'isDeepscan')::text,'');

/*
  select * from task.et_hyperlink_insert_tasks ('{"queueName":"","nCaseid":"53b4e221-421a-4950-8176-60bd89db8e9f","nSectionid":"cf7ace39-e0b1-42a0-ab31-c76f462e9603","nMasterid":"3a168b69-1bb8-4c7e-881f-dff78a854f80","nBundleid":null,"cType":"T","nTotal":0,"nCompleted":0,"nFailed":0,"cStatus":"P","cKeeptype":"K","isDeepscan":"","nBundledetailid":"5fa61286-3101-4ba3-b1e1-c65b9cfb5a8a"}','r1');fetch all in "r1";

select * from task.""HyperlinkMaster""

truncate table  task.""HyperlinkMaster"" restart identity cascade;
truncate table  task.""TaskMaster"" restart identity cascade;

select * from task.""TaskMaster""
select * from task.""TaskCategory""

select * from task.""TaskDetail""
 */

insert into task."TaskMaster"("nTCatid","nUserid","nCaseid")
	values(2, nUserid, nCaseid) returning "nTid" into nTid;

insert into task."HyperlinkMaster" ("nUserid","nTid","nCaseid","nSectionid","nBundleid","nBundledetailid","cKeeptype","cType","isDeepscan")
values(nUserid, nTid, nCaseid, nSectionid, nBundleid, nBundledetailid, cKeeptype, cType, isDeepscan)
returning "nHid" into nHid;

nBundleids := (array(SELECT "nBundleid" FROM get_sorted_hierarchy_bundle(nBundleid)));

WITH inserted_rows AS (
    INSERT INTO task."TaskDetail"("nTid","nBDid")
	select nTid, b."nBundledetailid" from "BundleDetail" b 
		where b."nSectionid" = nSectionid and 
		case when nBundleid IS NOT NULL then 
		b."nBundleid" = any(nBundleids)
		else true end 
		and b."cStatus" = 'C' and case when nBundledetailid IS NOT NULL then true else coalesce(b."cIsindex",false) = false end
		and case when nBundledetailid IS NOT NULL then 
		b."nBundledetailid" = nBundledetailid else true end and upper(b."cPath") LIKE '%.PDF'
    RETURNING 1
)
SELECT COUNT(*) into nTotal FROM inserted_rows;

-- select * from task."TaskRemarkDetail"

nRid = (select "nRid" From task."TaskRemarks" where "nTCatid" = 2 and "nSerial" = 1);

INSERT INTO task."TaskRemarkDetail"("nTDid","nRid")
select "nTDid", nRid from task."TaskDetail" where "nTid" = nTid;
	

update task."TaskMaster" set "nTotal" = nTotal where "nTid" = nTid;

open ref for 
select nHid as "nHid", nTid as "nTid", nTotal as "nTotal";

RETURN ref;                                                       -- Return the cursor to the caller
END;
$function$
