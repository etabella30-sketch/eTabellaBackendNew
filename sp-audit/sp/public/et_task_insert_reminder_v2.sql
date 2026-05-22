CREATE OR REPLACE FUNCTION public.et_task_insert_reminder_v2(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nTaskid UUID;
    jReminder jsonb;
    email boolean;
    inapp boolean;
	dReminderDt timestamp;
    
BEGIN
nTaskid := NULLIF(parameter ->> 'nTaskid','')::uuid;
jReminder := parameter ->> 'jReminder';
email := parameter ->> 'bemail';
inapp := parameter ->> 'binapp';
dReminderDt := (parameter ->> 'dReminderDt')::timestamp;

raise notice 'dReminderDt %',dReminderDt;
   
--  select * from ""TaskReminders""

    delete from "TaskReminders" where "nTaskid" = nTaskid;

    IF dReminderDt IS NOT NULL THEN
    insert into "TaskReminders" ("nTaskid","dReminderDt")
	values(nTaskid,dReminderDt);
    -- select nTaskid,(r->>0)::text,(r->>1)::text,email,inapp,(r ->> 'dReminderDate')::timestamp from jsonb_array_elements(jReminder) r;
    end if;
    open ref for select 1 msg;
    
    RETURN ref;  -- Return the cursor to the caller
END;
$function$
