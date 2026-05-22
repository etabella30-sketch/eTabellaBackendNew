CREATE OR REPLACE FUNCTION public.et_realtime_issue_detail_note(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nIDid uuid;nUserid uuid;cNote text;
-- select * from "RIssueDetail" limit 0

BEGIN
nIDid := NULLIF(parameter->>'nIDid','')::uuid;
nUserid := NULLIF(parameter->>'nUserid','')::uuid;
cNote := parameter->>'cNote';

update "RIssueDetail" set "cNote" = cNote
where "nIDid" = nIDid;

open ref for
 	select 1 as msg;

RETURN ref;
	 
END;
$function$
