CREATE OR REPLACE FUNCTION public.et_realtime_filter_last_issue(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare jIids jsonb;nUserid uuid;

BEGIN
jIids := parameter ->>'jIids';

open ref for 

/*

select * from public.et_realtime_filter_last_issue ('{"jIids":"[{\"nIid\":\"af41c571-688f-465f-b3de-dcd831fbe430\",\"nRelid\":0,\"nImpactid\":0,\"dt\":\"2025-05-20T10:16:29.634Z\",\"cColor\":\"ffa781\",\"serialno\":1},{\"nIid\":\"abba73a9-3747-48f7-9e81-438c56ca8ae7\",\"nRelid\":0,\"nImpactid\":0,\"dt\":\"2025-05-20T10:16:30.187Z\",\"cColor\":\"0e0e0e\",\"serialno\":0}]"}','r1');fetch all in "r1";

*/
select "nIid" , ROW_NUMBER() OVER (ORDER BY COALESCE(r."nSerialno", 999) asc, COALESCE(i."nSerialno", 999) asc, (t.serialno) ASC) AS serialno
from jsonb_to_recordset(jIids) as t("nRelid" int,"nImpactid" int,"nIid" uuid,serialno int,"dt" timestamp)
left join "Codemaster" r on r."nCodeid" = t."nRelid"
left join "Codemaster" i on i."nCodeid" = t."nImpactid" 
order by coalesce(r."nSerialno",999) asc,coalesce(i."nSerialno",999) asc,t."serialno" ASC
;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
