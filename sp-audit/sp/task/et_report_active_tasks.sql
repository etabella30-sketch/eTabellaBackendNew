CREATE OR REPLACE FUNCTION task.et_report_active_tasks(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE 
	nTCatid int; nCaseid uuid; cStatus text; nTid uuid;
BEGIN

nTCatid := NULLIF(parameter ->>'nTCatid','')::int;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
cStatus := parameter ->>'cStatus';
nTid := NULLIF(parameter ->>'nTid','')::uuid;
	
/*
SELECT * FROM task.et_report_active_tasks('{""nTCatid"": 2, ""nCaseid"": 1047, ""cStatus"": ""C""}', 'r1');
FETCH ALL IN ""r1"";

 select * from task.et_report_active_tasks ('{""nTCatid"":2,""nCaseid"":1047,""nMasterid"":366}','r1');fetch all in ""r1"";

select * from task.et_report_active_tasks ('{""nTCatid"":6,""cStatus"":""P"",""nMasterid"":366}','r1');fetch all in ""r1"";

select * from task.""TaskMaster""

select * from ""UploadMaster"" 

 */

    OPEN ref FOR 
		select t."nTid",t."nTCatid",t."nUserid",t."nCaseid",t."dCreateDt",t."nTotal",
		t."nCompleted",t."nFailed",t."dStartDt",t."dLastDt",t."cStatus",
		u."cFname",u."cLname",u."cProfile",c."cCasename",c."cCaseno",
		case when upld."nUPid" is not null then
		upld."nUPid" || to_char(upld."dCreateDt",'_yyyy_mm_dd')  end as "cUploadId"
		
		from task."TaskMaster" t 
		join "CaseMaster" c on c."nCaseid" = t."nCaseid" 
		join "UserMaster" u on u."nUserid" = t."nUserid"
		left join "UploadMaster" upld on upld."nTid" = t."nTid"
		where case when nTid IS NOT NULL then t."nTid" = nTid else false end
		or 
		(nTid IS NULL and t."nTCatid" = nTCatid --and t."cStatus" = cStatus
		and case when nCaseid IS NOT NULL then t."nCaseid" = nCaseid else true end)
		order by "dCreateDt" desc;

    RETURN ref; -- Return the cursor
END;
$function$
