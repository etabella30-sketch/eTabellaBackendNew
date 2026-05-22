CREATE OR REPLACE FUNCTION public.et_fact_highlight_delete_by_uuid(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFSid uuid; cUuid text; nIndex int; jNText jsonb;

/*
select * from ""Annotations"" where ""nFSid"" = 27
select * from et_fact_highlight_delete_by_uuid ('{""nFSid"":27,""uuid"":""bdc0c2fe-253a-476c-986d-ce1679696a14"",""nMasterid"":2}','r1');fetch all in ""r1"";
*/

BEGIN
nFSid := NULLIF(parameter->>'nFSid','')::uuid;
cUuid := parameter ->>'uuid';

/* select * from ""Annotations"" where ""nFSid"" = 67 order by 1 desc

select * from ""FactDetail"" where ""nFSid"" = 67
*/

with tbl as (
select ROW_NUMBER() OVER (ORDER BY "nAId") AS "index","uuid" 
	from "Annotations" 
	where "nFSid" = nFSid 
) select t."index"  into nIndex 
from tbl t where t."uuid" = cUuid;

if(coalesce(nIndex,0)>0)then 
	
	select jsonb_agg(value order by ORDINALITY) into jNText
	from "FactDetail",jsonb_array_elements("jOT") WITH ORDINALITY
	where "nFSid" = nFSid and ORDINALITY != nIndex;

	jNText = coalesce(jNText,'[]');

	update "FactDetail" set "jOT" = jNText where "nFSid" = nFSid;

end if;

delete from "Annotations" where "nFSid" = nFSid and "uuid" = cUuid;
	
open ref for select 1 msg;
RETURN ref;

END;
$function$
