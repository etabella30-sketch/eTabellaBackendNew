CREATE OR REPLACE FUNCTION public.et_task_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid UUID;nMasterid UUID;cTasktype text;

BEGIN
nCaseid := (parameter ->>'nCaseid')::UUID;
nMasterid := (parameter ->>'nMasterid')::UUID;
cTasktype := parameter ->>'cTasktype';
-- select * from et_task_list ('{"nCaseid":289,"cTasktype":"FT","nMasterid":43}','r1');fetch all in "r1";
open ref for 

    select distinct t."nTaskid",t."nUserid" "nCreateId",td."cSubject",td."nPriority",
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

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
