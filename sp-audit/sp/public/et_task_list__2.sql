CREATE OR REPLACE FUNCTION public.et_task_list(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid UUID;nMasterid UUID;cTasktype text;jTaskids jsonb;

BEGIN
nCaseid := (parameter ->>'nCaseid')::UUID;
nMasterid := (parameter ->>'nMasterid')::UUID;
cTasktype := parameter ->>'cTasktype';
-- jTaskids :=parameter ->>'jTaskids';

/* 
select * from public.et_task_list ('{"nCaseid":"bc669a9e-6388-42af-9a94-f438e907ea30","cTasktype":"FT","nMasterid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5","jTaskids":"[{\"task\":\"8530a85e-d018-4680-bd29-dd061ac093aa\",\"can_view\":true,\"can_edit_status\":true,\"can_edit_all\":true}]"}','r1','r2','r3');
fetch all in "r1";
fetch all in "r2";
fetch all in "r3";
*/

-- drop table if exists temp_tasks;
-- create temp table temp_tasks as 
-- select * from jsonb_to_recordset(jTaskids) as t("task" uuid,"can_view" boolean,"can_edit_status" boolean,"can_edit_all" boolean);

open ref1 for 

    select distinct t."nTaskid",t."nUserid" "nCreateId",td."cSubject",td."cDesc",td."nPriority",
    td."nProgress",td."jTimeline",pr."cCodename" "cPriority",
	cm."cCodename" "cStatustext",
	td."dStartDt",
	td."dEndDt",
	-- tmp."can_view",tmp."can_edit_status" ,tmp."can_edit_all"
	true "can_view",
	true "can_edit_status",
	t."nUserid" = nMasterid as "can_edit_all",
	t."nUserid" = nMasterid as "can_delete"
    from "TaskMaster" t
    join "TaskDetail" td on td."nTaskid" = t."nTaskid"
	-- join "temp_tasks" tmp on tmp."task" = t."nTaskid"
    left join "Codemaster" pr on pr."nCodeid" = td."nPriority" 
	left join "Codemaster" cm on cm."nCodeid"= "nStatus"
	left join "TaskShared" ts on ts."nTaskid" = t."nTaskid" 
    where "nCaseid" = nCaseid 
	and (
		(t."nUserid" = nMasterid or ts."nUserid" = nMasterid) 
		and  td."cTasktype" = coalesce(cTasktype,'F')
		)
	order by td."cSubject";
		
-- select * from "TaskShared" order by 1 desc
-- select * from "TaskDetail" order by 1 desc

 RETURN next ref1;     
 

    open ref2 for select distinct ts."nTaskid",ts."nUserid","cFname","cLname","cProfile"
    from  "TaskShared" ts 
    join "TaskMaster" t on t."nTaskid" = ts."nTaskid"
    join "UserMaster" u on u."nUserid" = ts."nUserid"
	-- join "temp_tasks" tmp on tmp."task" = t."nTaskid"
    where "nCaseid" = nCaseid  and (t."nUserid" = nMasterid or ts."nUserid" = nMasterid)
	;
    RETURN next ref2;

	
    -- select * from "TaskReminders"
 open ref3 for 
    select tr."nTaskid",jsonb_agg(jsonb_build_object('nm',"nm",'value',value)) "jReminders",
	"dReminderDt"
    from "TaskReminders" tr
    join "TaskMaster" t on t."nTaskid" = tr."nTaskid"
    join  "TaskShared" ts  on t."nTaskid" = ts."nTaskid"
	-- join "temp_tasks" tmp on tmp."task" = t."nTaskid"
    where "nCaseid" = nCaseid and (t."nUserid" = nMasterid or ts."nUserid" = nMasterid)
    group by tr."nTaskid", "dReminderDt";
 RETURN next ref3;   
    -- select * from "TaskShared"
 
 -- Return the cursor to the caller
    END;
$function$
