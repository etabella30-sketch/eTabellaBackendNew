-- 2026-10-06_fact_quick_update_keep_position.sql
--
-- Phase 7b of the shared-libraries plan, item 5 (approved 2026-10-06). realtime.et_fact_quick_update writes
-- FactDetail."nPage" / "nLine" from the request; a caller that sends neither (coreapi POST fact/quickfactupdate,
-- whose DTO has no nPage / nLine, already calls this realtime variant) therefore wiped both to NULL on every quick
-- update. Now an absent value keeps the stored one (COALESCE); a sent value still replaces it, so realtime-server's
-- callers, whose DTO requires both, are unchanged. Same signature and columns: CREATE OR REPLACE, no restart.
--
-- Apply to dev etabella_tech_uuid only (guard below). Idempotent. Prod is the operator's.
-- Check: 2026-10-06_fact_quick_update_keep_position.test.sql. Undo: 2026-10-06_fact_quick_update_keep_position.down.sql.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'fact_quick_update_keep_position: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
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
nPage := NULLIF(parameter->>'nPage','')::int;
nLine := NULLIF(parameter->>'nLine','')::int;

-- 2026-10-06 (7b item 5): an absent nPage / nLine keeps the stored position instead of writing NULL.
update "FactDetail" set "nColorid"=nColorid ,"jTexts" = jTexts,
"cIsNote"=coalesce(cIsNote,'N'), "nPage" = coalesce(nPage, "nPage"), "nLine" = coalesce(nLine, "nLine")
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
