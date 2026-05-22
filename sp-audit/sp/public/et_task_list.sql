CREATE OR REPLACE FUNCTION public.et_task_list(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nMasterid uuid;cTasktype text;

BEGIN
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
cTasktype := parameter ->>'cTasktype';
-- select * from et_task_list ('{"nCaseid":289,"cTasktype":"FT","nMasterid":2}','r1','r2');fetch all in "r1";fetch all in "r2";
open ref1 for 

	select distinct t."nTaskid",t."nUserid" "nCreateId",td."cSubject",td."cDesc",td."nPriority",
	td."nProgress",td."jTimeline",pr."cCodename" "cPriority"
	from "TaskMaster" t
	join "TaskDetail" td on td."nTaskid" = t."nTaskid"
	left join "Codemaster" pr on pr."nCodeid" = td."nPriority" 
	left join "TaskShared" ts on ts."nTaskid" = t."nTaskid" 
	where "nCaseid" = nCaseid and (t."nUserid" = nMasterid or ts."nUserid" = nMasterid) and
	td."cTasktype" = coalesce(cTasktype,'F')
	;

-- select * from "TaskMaster" order by 1 desc
-- select * from "TaskDetail" order by 1 desc

 RETURN next ref1;     
 

	open ref2 for select distinct ts."nTaskid",ts."nUserid","cFname","cLname","cProfile"
	from "TaskShared" ts 
	join "TaskMaster" t on t."nTaskid" = ts."nTaskid"
	join "UserMaster" u on u."nUserid" = ts."nUserid"
	where "nCaseid" = nCaseid and (t."nUserid" = nMasterid or ts."nUserid" = nMasterid) ;
    RETURN next ref2;
	-- select * from "TaskShared"
 
 -- Return the cursor to the caller
    END;
$function$
