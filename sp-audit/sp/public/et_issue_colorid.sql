CREATE OR REPLACE FUNCTION public.et_issue_colorid(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare jIids jsonb;nUserid uuid;
BEGIN
jIids := parameter ->>'jIids';
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
-- select * from et_issue_colorid ('{"jIids":"[{\"nIid\":79,\"nRelid\":13,\"nImpactid\":19,\"dt\":\"2024-06-25T10:48:51.538Z\",\"cColor\":\"e864ff\"},{\"nIid\":78,\"nRelid\":16,\"nImpactid\":18,\"dt\":\"2024-06-25T10:48:55.404Z\",\"cColor\":\"89ff77\"},{\"nIid\":32,\"nRelid\":0,\"nImpactid\":0,\"dt\":\"2024-06-25T10:48:46.908Z\",\"cColor\":\"ffc7af\"},{\"nIid\":31,\"nRelid\":14,\"nImpactid\":0,\"dt\":\"2024-06-25T10:48:57.370Z\",\"cColor\":\"ffbb9f\"}]"}','r1');fetch all in "r1";
open ref for 
select "nIid" 
from jsonb_to_recordset(jIids) as t("nRelid" int,"nImpactid" int,"nIid" uuid,"dt" timestamp,"nSerial" int)
left join "Codemaster" r on r."nCodeid" = t."nRelid"
left join "Codemaster" i on i."nCodeid" = t."nImpactid" 
	
order by coalesce(r."nSerialno",999),coalesce(i."nSerialno",999),t."nSerial" desc,t."dt" desc limit 1
;
 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
