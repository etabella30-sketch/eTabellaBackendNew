-- 2026-09-23_sec_issue_misc_owner (ROLLBACK - restores the exact dev bodies dumped 2026-09-23)
--
-- Security remediation phase 4 (same class as 2026-09-23_sec_issue_claim_owner / _rhighlight_owner): three more
-- realtime-server issue writes acted on a client-supplied id without checking the caller. Refusals come back
-- as the SP's normal row with msg = -1 and change nothing.
--
--   public.et_realtime_issue_detail_note       RIssueDetail note: owner only                    caller key nUserid
--   public.et_realtime_update_default_h_issue  jHids re-map: highlight owner or global admin;
--                                              session-default branch writes the caller's own
--                                              RSessionDetail row, so it needs the caller too     caller key nUserid
--   public.et_realtime_handle_issue_category   'U' / 'D': owner, global admin (UserMaster.isAdmin)
--                                              or Case Admin (RoleMaster.nSrno = 1) of the case   caller key nUserid
--                                              'U' no longer sets the owner to the editor, and its
--                                              duplicate-name check uses the owner's names ('I' untouched)
--
-- SERVICE: realtime-server IssueService already sends nUserid = JWT user for all three (updateIssueDetailNote,
-- updateHighlightIssueIds, handleIssueCategory / deleteIssueCategory). 'D' also needs nCaseid (unchanged SP
-- logic: DELETE ... WHERE nICid AND nCaseid); DeleteIssueCategoryParam carries only nICid, so that route
-- deletes nothing today, with or without this migration. apps/realtime (venue app) calls these SPs too.
--
-- OPERATOR: run against the intended database only. Check first:
--     SELECT current_database();   -- dev = etabella_tech_uuid, prod = etabella.com.uuid
-- No hard current_database() guard on purpose: this file is meant to be applied to dev first and to
-- prod later by the operator. Before applying anywhere, re-dump each function (pg_get_functiondef)
-- and diff it against the .down.sql file; if it differs, rebuild both files from that dump.
--
-- Drafted 2026-09-23 from the live dev bodies (etabella_tech_uuid). NOT applied anywhere.

BEGIN;

-- ============ public.et_realtime_issue_detail_note ============
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
$function$;

-- ============ public.et_realtime_update_default_h_issue ============
CREATE OR REPLACE FUNCTION public.et_realtime_update_default_h_issue(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nSessionid uuid;nUserid uuid;cDefHIssues jsonb;nLID uuid;jHids jsonb;nSDid uuid;
BEGIN
nSessionid := NULLIF(parameter->>'nSessionid','')::uuid;
nUserid := NULLIF(parameter->>'nUserid','')::uuid;
cDefHIssues := parameter->>'cDefHIssues';
nLID := NULLIF(parameter->>'nLID','')::uuid;
jHids := parameter->>'jHids';

/*

 select * from public.et_realtime_update_default_h_issue ('{"nSessionid":"05f03702-dad9-48c1-bb47-2e5ed02d4dc8","nUserid":"3a168b69-1bb8-4c7e-881f-dff78a854f80","nCaseid":"53b4e221-421a-4950-8176-60bd89db8e9f","cDefHIssues":[{"nIid":"c0d4e4ef-2bf9-4b02-8d4a-e77d387785ff","serialno":"1"},{"nIid":"c90f35a0-bd0d-4346-8e01-5f1cb1fad4fd","serialno":"2"}],"nLID":"c0d4e4ef-2bf9-4b02-8d4a-e77d387785ff","jHids":"[\"c3a946cb-32c5-4d28-8df1-b571726f3627\",\"82288892-cd67-435c-ab79-a33948270e7f\"]"}','r1');fetch all in "r1";

 
*/

    if(jsonb_array_length(jHids)>0)then 
    
        delete from "RHighlightMapid" where jHids @> to_jsonb("nHid");
    
        INSERT INTO "RHighlightMapid" ("nHid", "nIid")    
        SELECT f::uuid, i."nIid" from jsonb_array_elements_text(jHids) f, jsonb_to_recordset(cDefHIssues) as i("nIid" uuid);

        update "RHighlights" set "nLID" = nLID where jHids @> to_jsonb("nHid");

    else

        nSDid = (select "nSDid" from "RSessionDetail" where "nSesid" = nSessionid and "nUserid" = nUserid limit 1);

        if (nSDid is null) then --coalesce(nSDid,0) = 0
            insert into "RSessionDetail"("nSesid","nUserid","cDefHIssues","nLID")
            values(nSessionid,nUserid,cDefHIssues,nLID)
            returning "nSDid" into nSDid;    
        else
            update "RSessionDetail" set "cDefHIssues" = cDefHIssues,"nLID" = nLID
            where "nSDid" = nSDid;
        end if;
    end if;
    
    OPEN ref FOR
        select 1 msg,'Highlight Issues Updated' message,nSessionid,nSessionid s1,nUserid;

    RETURN ref;
END;
$function$;

-- ============ public.et_realtime_handle_issue_category ============
CREATE OR REPLACE FUNCTION public.et_realtime_handle_issue_category(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nICid UUID;
    nCaseid UUID;
    cCategory VARCHAR(200);
    nUserid UUID;
    dCreateDt TIMESTAMP;
    dUpdateDt TIMESTAMP;
    cICtype CHAR(1);
    cColor VARCHAR(6);
    cParty VARCHAR(200);
    cDescription VARCHAR(2000);
    inserted_id UUID;
    msg_text TEXT;
    msg SMALLINT;
BEGIN
    nICid := NULLIF(parameter ->> 'nICid','')::UUID;
    nCaseid := NULLIF(parameter ->> 'nCaseid','')::UUID;
    cCategory := parameter ->> 'cCategory';
    nUserid := NULLIF(parameter ->> 'nUserid','')::UUID;
    dCreateDt := (parameter ->> 'dCreateDt')::TIMESTAMP;
    dUpdateDt := (parameter ->> 'dUpdateDt')::TIMESTAMP;
    cICtype := (parameter ->> 'cICtype')::CHAR(1);
    -- optional claim details (2026-09-07): colour (hex, no #), asserting party (free text), description
    cColor := NULLIF(regexp_replace(coalesce(parameter ->> 'cColor',''), '^#', ''), '');
    cParty := NULLIF(btrim(parameter ->> 'cParty'), '');
    cDescription := NULLIF(btrim(parameter ->> 'cDescription'), '');
    msg := 1;

    IF cICtype = 'I' THEN
        -- Check if the category already exists for the given case ID
        IF EXISTS (
            SELECT 1
            FROM "IssueCategory"
            WHERE "cCategory" = cCategory
            AND "nCaseid" = nCaseid
			 and "nUserid" =nUserid
        ) THEN
            msg := -1;
            msg_text := 'Category already exists for the given case ID';
        ELSE
            INSERT INTO "IssueCategory" ("nCaseid", "cCategory", "nUserid", "dCreateDt", "cColor", "cParty", "cDescription")
            VALUES (nCaseid, cCategory, nUserid, dCreateDt, cColor, cParty, cDescription)
            RETURNING "nICid" INTO inserted_id;
            msg_text := 'Inserted';
        END IF;
    ELSIF cICtype = 'U' THEN
        -- Check if a different category with the same name already exists for the given case ID
        IF EXISTS (
            SELECT 1
            FROM "IssueCategory"
            WHERE "cCategory" = cCategory
            AND "nCaseid" = nCaseid
			and "nUserid" =nUserid
            AND "nICid" != nICid
        ) THEN
            msg := -1;
            msg_text := 'Category already exists for the given case ID';
        ELSE
            UPDATE "IssueCategory"
            SET "cCategory" = cCategory,
                "nUserid" = nUserid,
                "dUpdateDt" = dUpdateDt,
                -- only touch the details when the caller sent the key (legacy clients post the old body)
                "cColor" = CASE WHEN (parameter::jsonb) ? 'cColor' THEN cColor ELSE "cColor" END,
                "cParty" = CASE WHEN (parameter::jsonb) ? 'cParty' THEN cParty ELSE "cParty" END,
                "cDescription" = CASE WHEN (parameter::jsonb) ? 'cDescription' THEN cDescription ELSE "cDescription" END
            WHERE "nICid" = nICid;
            msg_text := 'Updated';
        END IF;
    ELSIF cICtype = 'D' THEN
        -- Check if the category exists for the given case ID and category ID
        DELETE FROM "IssueCategory"
        WHERE "nICid" = nICid
        AND "nCaseid" = nCaseid;
        msg_text := 'Deleted';
    ELSE
        msg := -1;
        msg_text := 'Invalid operation type';
    END IF;

    OPEN ref FOR
        SELECT msg, msg_text AS message, inserted_id AS "nICid";
    RETURN ref;
END;
$function$;

COMMIT;
