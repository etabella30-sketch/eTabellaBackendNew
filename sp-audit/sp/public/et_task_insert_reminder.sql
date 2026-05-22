CREATE OR REPLACE FUNCTION public.et_task_insert_reminder(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nTaskid UUID;
    jReminder jsonb;
    email boolean;
    inapp boolean;
    
BEGIN
nTaskid := NULLIF(parameter ->> 'nTaskid','')::uuid;
jReminder := parameter ->> 'jReminder';
email := parameter ->> 'bemail';
inapp := parameter ->> 'binapp';
   
--  select * from ""TaskReminders""

    delete from "TaskReminders" where "nTaskid" = nTaskid;
   
    insert into "TaskReminders" ("nTaskid","nm","value","email","inapp")
    select nTaskid,(r->>0)::text,(r->>1)::text,email,inapp from jsonb_array_elements(jReminder) r;
    
    open ref for select 1 msg;
    
    RETURN ref;  -- Return the cursor to the caller
END;
$function$
