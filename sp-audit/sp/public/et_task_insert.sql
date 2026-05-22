CREATE OR REPLACE FUNCTION public.et_task_insert(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nTaskid UUID;
    nCaseid UUID;
    nMasterid UUID;
    permission text;
BEGIN
    nTaskid := NULLIF(parameter ->> 'nTaskid','')::uuid;
    nCaseid := NULLIF(parameter ->> 'nCaseid','')::uuid;
    nMasterid := NULLIF(parameter ->> 'nMasterid','')::uuid;
    permission:= parameter ->> 'permission';
--  select * from ""TaskMaster""
   if(permission = 'N') then 
        insert into "TaskMaster" ("nCaseid","nUserid","dCreateDt")
        values(nCaseid,nMasterid,now())
        RETURNING "nTaskid" INTO nTaskid;
    else 
        update "TaskMaster" set "dUpdateDt" = now() where "nTaskid" = nTaskid;    
    end if;
    
    open ref for select 1 msg,(case when permission = 'N' then 'Created' else 'Updated' end) value,nTaskid "nTaskid";

    RETURN ref;  -- Return the cursor to the caller
END;
$function$
