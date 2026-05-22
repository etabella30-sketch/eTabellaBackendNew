CREATE OR REPLACE FUNCTION public.et_assign_task_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;jBDids jsonb;
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jBDids := parameter ->>'jBDids';
-- select * from "TaskDetail" order by 1 desc
open ref for select distinct t."nTaskid",td."cSubject",td."cDesc",td."nPriority",td."nProgress",td."jTimeline","cCodename" "cPriority",'[]'::jsonb teamlist 
from "BDTasks" bc
join "TaskMaster" t on t."nTaskid" = bc."nTaskid"
join "TaskDetail" td on td."nTaskid" = bc."nTaskid"
left join "TaskShared" ts on ts."nTaskid" = bc."nTaskid" 
left join "Codemaster" c on c."nCodeid"= "nPriority"
where jBDids @> to_jsonb(bc."nBundledetailid"::text) --  and bc."nUserid" =nMasterid
and (t."nUserid" = nMasterid or ts."nUserid" = nMasterid);
 
RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
