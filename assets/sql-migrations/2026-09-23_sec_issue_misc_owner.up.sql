-- 2026-09-23_sec_issue_misc_owner (apply)
--
-- Security remediation phase 4 (same class as 2026-09-23_sec_issue_claim_owner / _rhighlight_owner): three more
-- realtime-server issue writes acted on a client-supplied id without checking the caller. Refusals come back
-- as the SP's normal row with msg = -1 and change nothing.
--
--   public.et_realtime_issue_detail_note       RIssueDetail note: owner only                    caller key nUserid
--   public.et_realtime_update_default_h_issue  jHids re-map: highlight owner or global admin (ids matched
--                                              as uuids, as the RHighlightMapid INSERT reads them);
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

-- 2026-09-23 sec: an issue detail's note is changed only by the detail's owner. nUserid is the acting user
-- (realtime-server sets it from the JWT). A missing row keeps the old outcome (msg 1, nothing updated).
IF nUserid IS NULL OR EXISTS (
        SELECT 1 FROM "RIssueDetail" sid WHERE sid."nIDid" = nIDid AND sid."nUserid" IS DISTINCT FROM nUserid) THEN
	open ref for
		select -1 as msg;
	RETURN ref;
END IF;

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

    -- 2026-09-23 sec: nUserid is the acting user (realtime-server sets it from the JWT). The jHids branch
    -- re-maps only highlights the caller owns, unless the caller is a global admin (UserMaster.isAdmin);
    -- the other branch writes the caller's own RSessionDetail row, so it needs the caller too.
    -- Refusal = the normal row with msg = -1; nothing is changed.
    -- The ids are matched as uuids (sv::uuid), the way the RHighlightMapid INSERT below reads them: a
    -- jsonb-string match (jHids @> to_jsonb(nHid)) misses an upper-case / braced / hyphen-less spelling,
    -- which the INSERT still accepts, so another user's highlight could be re-mapped past the check.
    IF nUserid IS NULL OR (jsonb_array_length(jHids) > 0 AND EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(jHids) AS sv
            JOIN "RHighlights" srh ON srh."nHid" = sv::uuid
            WHERE srh."nUserid" IS DISTINCT FROM nUserid
              AND NOT EXISTS (SELECT 1 FROM "UserMaster" su WHERE su."nUserid" = nUserid AND su."isAdmin" = true))) THEN
        OPEN ref FOR
            select -1 msg,'You are not authorized to change these highlights' message,nSessionid,nSessionid s1,nUserid;
        RETURN ref;
    END IF;

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
    v_sec_found boolean := false; -- 2026-09-23 sec
    v_sec_owner uuid;             -- 2026-09-23 sec
    v_sec_ok boolean;             -- 2026-09-23 sec
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

    -- 2026-09-23 sec: a claim is updated / deleted only by its owner, a global admin (UserMaster.isAdmin) or a
    -- Case Admin (RoleMaster.nSrno = 1) of the claim's case - et_realtime_issuelist_group's edit/delete flag.
    -- nUserid is the acting user (realtime-server sets it from the JWT). A missing row keeps the old outcome.
    IF cICtype IN ('U', 'D') THEN
        SELECT true, sic."nUserid",
               nUserid IS NOT NULL AND (sic."nUserid" = nUserid
                   OR EXISTS (SELECT 1 FROM "UserMaster" su WHERE su."nUserid" = nUserid AND su."isAdmin" = true)
                   OR EXISTS (SELECT 1 FROM "TeamRelation" tr JOIN "RoleMaster" rm ON rm."nRoleid" = tr."nRoleid"
                              WHERE tr."nUserid" = nUserid AND tr."nCaseid" = sic."nCaseid" AND rm."nSrno" = 1))
          INTO v_sec_found, v_sec_owner, v_sec_ok
          FROM "IssueCategory" sic
         WHERE sic."nICid" = nICid;
    END IF;

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
    ELSIF cICtype IN ('U', 'D') AND (nUserid IS NULL OR (coalesce(v_sec_found, false) AND NOT coalesce(v_sec_ok, false))) THEN
        msg := -1;
        msg_text := 'You are not authorized to change this claim';
    ELSIF cICtype = 'U' THEN
        -- Check if a different category with the same name already exists for the given case ID
        IF EXISTS (
            SELECT 1
            FROM "IssueCategory"
            WHERE "cCategory" = cCategory
            AND "nCaseid" = nCaseid
			and "nUserid" = coalesce(v_sec_owner, nUserid) -- 2026-09-23 sec: the claim owner's names (was the editor's)
            AND "nICid" != nICid
        ) THEN
            msg := -1;
            msg_text := 'Category already exists for the given case ID';
        ELSE
            UPDATE "IssueCategory"
            SET "cCategory" = cCategory,
                -- 2026-09-23 sec: "nUserid" (owner) is no longer overwritten with the editor
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
