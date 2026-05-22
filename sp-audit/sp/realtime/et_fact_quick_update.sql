CREATE OR REPLACE FUNCTION realtime.et_fact_quick_update(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

DECLARE nFSid uuid;jDate jsonb;jC jsonb;jIssue jsonb;jL jsonb;jT jsonb;jTexts jsonb;jU jsonb;
nFiletype int;nStatus int;nTZid int;nColorid uuid;nFMLid uuid;rec record;cIsNote text;Color text;
nPage int; nLine int;

BEGIN
nFSid := NULLIF(parameter ->>'nFSid','')::uuid;
jIssue := parameter ->>'jIssue';
jTexts := parameter ->>'jTexts';
nColorid := NULLIF(parameter ->>'nColorid','')::uuid;
cIsNote := parameter->>'cIsNote';

jC := parameter ->>'jContacts';
nPage := parameter->>'nPage';
nLine := parameter->>'nLine';

-- select * from public.et_fact_quick_update ('{"nFSid":"a57e547e-52e8-4ac8-b208-dbe7322fdb80","nColorid":"6154791a-9717-4183-819b-0bc84b71a0dd","jTexts":"[]","jIssue":"[[\"6154791a-9717-4183-819b-0bc84b71a0dd\",0,0]]","cIsNote":"N","nMasterid":"c67fea37-4c67-4ea4-89eb-f9d0441142a0"}','r1');fetch all in "r1";

update "FactDetail" set "nColorid"=nColorid ,"jTexts" = jTexts,
"cIsNote"=coalesce(cIsNote,'N'), "nPage" = nPage, "nLine" = nLine 
where "nFSid" = nFSid;

delete from "FMContact" where "nFSid" = nFSid;
insert into "FMContact"("nFSid","nContactid")
SELECT nFSid,t::uuid from jsonb_array_elements_text(jC) AS t;

delete from "FMIssue" where "nFSid" = nFSid;
insert into "FMIssue"("nFSid","nIssueid","nImpactid","nRelevanceid")
SELECT nFSid,(t->>0)::uuid,(t->1)::int,(t->2)::int 
from jsonb_array_elements(jIssue) AS t;

	select "cColor" into Color from "RIssueMaster" where "nIid" = nColorid;

update "Annotations" set "colorid" = coalesce(nColorid,"colorid") where "nFSid" = nFSid;

	open ref for select 1 msg,'Updated' as value,nFSid as "nFSid",Color;
    RETURN ref;

END;
$function$
