-- 2026-10-06_fact_quick_update_keep_position.down.sql
--
-- Undo of 2026-10-06_fact_quick_update_keep_position.sql: the realtime.et_fact_quick_update body that writes nPage
-- and nLine as given (NULL when absent). Dev etabella_tech_uuid only.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'fact_quick_update_keep_position down: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
END
$guard$;

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
$function$;

COMMIT;
