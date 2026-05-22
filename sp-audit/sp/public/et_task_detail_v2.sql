CREATE OR REPLACE FUNCTION public.et_task_detail_v2(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

declare nTaskid uuid; nMasterid uuid;

BEGIN
nTaskid := NULLIF(parameter ->>'nTaskid','')::uuid;
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
-- select * from et_get_taskdetail ('{""nTaskid"":86,""nMasterid"":43}','r1','r2','r3');fetch all in ""r3"";
open ref1 for 

-- 	select distinct  t."nTaskid",t."nUserid" "nCreateId",td."cSubject",td."cDesc",td."jEmailnotify",td."nPriority",
-- td."nProgress",td."jTimeline",pr."cCodename" "cPriority",td."cTasktype",td."cTasktype"
-- 	from "TaskMaster" t
-- 	join "TaskDetail" td on td."nTaskid" = t."nTaskid"
-- 	left join "Codemaster" pr on pr."nCodeid" = td."nPriority" 
-- 	where t."nTaskid" = nTaskid;

select distinct  t."nTaskid",t."nUserid" "nCreateId",td."cSubject",td."cDesc",td."nPriority",
td."nProgress",td."cTasktype", td."nStatus", td."dStartDt",
td."dEndDt", td."cAssign", td."cRemind",td."cStatusChange"
	from "TaskMaster" t
	join "TaskDetail" td on td."nTaskid" = t."nTaskid"
	-- left join "Codemaster" pr on pr."nCodeid" = td."nPriority" 
	where t."nTaskid" = nTaskid;
	
 RETURN next ref1;    
 
 open ref2 for 
	select distinct  t."nUserid", "bCanComment", "bCanCopy", "bCanEdit", "bCanReshare"
	from "TaskShared" t
	where t."nTaskid" = nTaskid 
	;
 RETURN next ref2;   
 
 open ref3 for 
	select "nTRid","dReminderDt"
	from "TaskReminders" t
	where t."nTaskid" = nTaskid;
 RETURN next ref3;   
 
 -- Return the cursor to the caller
    END;
$function$
