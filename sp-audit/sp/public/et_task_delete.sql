CREATE OR REPLACE FUNCTION public.et_task_delete(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nTaskid uuid; nMasterid uuid;

BEGIN
nTaskid := NULLIF(parameter ->>'nTaskid','')::uuid;
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
-- select * from et_task_delete ('{""nTaskid"":86,""nMasterid"":43}','r');fetch all in ""r"";
-- select * from et_task_detele ('{""nTaskid"":84,""nMasterid"":43}','r');fetch all in ""r"";

    if exists(select * from "TaskMaster" where "nTaskid" = nTaskid and "nUserid" = nMasterid) then
        delete from "TaskMaster" where "nTaskid" = nTaskid;
        delete from "TaskDetail" where "nTaskid" = nTaskid;
        delete from "TaskReminders" where "nTaskid" = nTaskid;
        delete from "TaskShared" where "nTaskid" = nTaskid;
        open ref for select 1 msg,'Deleted' value;
    
    else
    
        open ref for select -1 msg,'You do not have a permission for delete' value;

    end if;
 Return ref;
 -- Return the cursor to the caller
    END;
$function$
