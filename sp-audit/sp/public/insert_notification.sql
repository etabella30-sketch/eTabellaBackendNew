CREATE OR REPLACE FUNCTION public.insert_notification(title text, message text, userid uuid, ddate timestamp without time zone DEFAULT NULL::timestamp without time zone)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
    new_id UUID;
BEGIN
/* ,isScheduled boolean DEFAULT false 
 select insert_notification('test','sdasd',1,null)
 select * from "Notifications" 
truncate table "Notifications" restart identity
 select to_char(now(),'dd/mm/yyyy hh24:mi:ss')
*/
new_id = (select "nNTid" from "Notifications" where "nUserid" = userid and "cTitle" = title and "cMsg" = message and "dDate" = dDate limit 1);
 --RAISE NOTICE 'Inserted notification with dDate: %', dDate;
 
 if(new_id IS NULL)then
    INSERT INTO "Notifications" ("cTitle", "cMsg", "nUserid","dDate","isScheduled")
    VALUES (title, message, userid,coalesce(dDate,now()), CASE WHEN dDate IS NULL THEN false ELSE true END)
    RETURNING "nNTid" INTO new_id;
 end if;
    RETURN new_id;
END;
$function$
