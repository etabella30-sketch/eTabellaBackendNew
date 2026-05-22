CREATE OR REPLACE FUNCTION public.et_fact_get_task(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFSid uuid;nMasterid uuid;
-- select * from "FactMaster" limit 0
-- select * from "TaskMaster" order by 1 desc limit 1
-- select * from "FMTasks" order by 1 desc limit 1
-- select * from "TaskDetail" order by 1 desc limit 1
-- select * from "TaskReminders" order by 1 desc limit 1

BEGIN
nFSid := NULLIF(parameter->>'nFSid','')::uuid;
nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;

    
    open ref1 for
       
    with ts AS (select ft."nFSid",ft."nFMTsid",ft."nTaskid",td."cSubject","cDesc",td."nPriority",pr."cCodename" "cPriority",td."nProgress",td."jTimeline"
         from "FMTasks" ft
    join "TaskDetail" td on td."nTaskid" = ft."nTaskid"
    left join "Codemaster" pr on pr."nCodeid" = td."nPriority"
     where ft."nFSid"  = nFSid),
     reminder as (select tr."nTRid",tr."nTaskid",tr."nm",tr."time",tr."tType",tr."value" from "TaskReminders" tr
                  join ts on ts."nTaskid" = tr."nTaskid"
                 )
                select t.*,json_agg(r) filter (where r."nTRid" is not null) "jReminders" from ts t
                left join reminder r on r."nTaskid" = t."nTaskid"
                group by t."nFSid",t."nFMTsid",t."nTaskid",t."cSubject",t."cDesc",t."nPriority",t."cPriority",t."nProgress",t."jTimeline"
     ;
     
     
     RETURN next ref1;
     -- select * from "FMTasks"
     open ref2 for
       
    select jsonb_agg(ft."nTaskid") "jTaskid",ts."nUserid","cFname","cLname","cProfile"
         from "FMTasks" ft
    join "TaskShared" ts on ts."nTaskid" = ft."nTaskid"
    join "UserMaster" um on um."nUserid" = ts."nUserid"
    where ft."nFSid"  = nFSid
     group by ts."nUserid","cFname","cLname","cProfile";
     
     
     RETURN next ref2;
     
END;
$function$
