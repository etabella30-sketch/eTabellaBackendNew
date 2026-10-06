-- 2026-10-06_qmark_handler_complete.sql
--
-- Phase 7b of the shared-libraries plan, item 6 / decision D8 (approved 2026-10-06): ONE quick-mark write path.
-- Two SPs wrote RHighlights: public.et_realtime_handle_rhighlights (issue/insertHighlights, the legacy app) stores
-- the row WITH its issue map row (RHighlightMapid: nHid -> nLID, the case's default issue), its jCordinates
-- ([{t, text, otext, identity, refreshCount, isMain}]) and answers pageData; realtime.et_qmark_handler
-- (fact/insertHighlights, the current app) stored the bare row only. Every reader that joins RHighlightMapid (issue
-- quick-mark list, issue counts, fact list, export annotation summary, RT sync) therefore missed every quick mark
-- made since the current app went live (1,325 of 11,858 on dev on 2026-10-06), while realtime.et_annotations and
-- realtime.et_navigate_quick_mark (what the current app reads) showed them.
--
-- Fix: realtime.et_qmark_handler gets the complete body (the public one, word for word: map row, jCordinates,
-- pageData), so both routes write the same row; realtime-server collapses the two code paths onto it in the same
-- commit. Same signature; the answer gains the pageData column the public variant always had.
-- The existing bare rows are completed by 2026-10-06_qmark_backfill_map_and_coordinates.sql.
--
-- Apply to dev etabella_tech_uuid only (guard below). Idempotent. Prod is the operator's.
-- Check: 2026-10-06_qmark_handler_complete.test.sql. Undo: 2026-10-06_qmark_handler_complete.down.sql.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'qmark_handler_complete: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
    END IF;
END
$guard$;

CREATE OR REPLACE FUNCTION realtime.et_qmark_handler(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nHid UUID;
    nCaseid UUID;
    cNote TEXT;
    jCordinates JSONB;
    nSessionId UUID;
    nUserid UUID;
    dCreatedt TIMESTAMP;
    cPageno VARCHAR(10);
    cLineno VARCHAR(5);
    permission CHAR(1);
    inserted_id UUID;
    msg_text TEXT;
    msg SMALLINT;
    cTime text;
    cIidStr jsonb;
    nLID uuid;
    pageData jsonb;
    cTranscript char(1);
    oP int;
    oL int;
        identity text;
BEGIN
    nHid := NULLIF(parameter ->> 'nHid','')::UUID;
    nCaseid := NULLIF(parameter ->> 'nCaseid','')::UUID;
    cNote := parameter ->> 'cNote';
    nSessionId := NULLIF(parameter ->> 'nSessionid','')::UUID;
    nUserid := NULLIF(parameter ->> 'nUserid','')::UUID;
    dCreatedt := (parameter ->> 'dCreatedt')::TIMESTAMP;
    cPageno := parameter ->> 'cPageno';
    cLineno := parameter ->> 'cLineno';
    permission := (parameter ->> 'permission')::CHAR(1);
    cTime := parameter ->>'cTime';
    msg := 1;
    nLID := NULLIF(parameter ->> 'nLID','')::UUID;
    cIidStr := (parameter ->> 'cIidStr')::jsonb;
    cTranscript := (parameter ->> 'cTranscript')::CHAR(1);
    oP := nullif((parameter ->> 'oP'),'');
    oL := nullif((parameter ->> 'oL'),'');
        identity := parameter ->>'identity';

    -- 2026-10-06 (7b item 6, D8): the body of public.et_realtime_handle_rhighlights, so both quick-mark routes write
    -- the map row, the coordinates and answer pageData.
    IF permission = 'I' THEN

        if (nLID is null)then
                    select "nIid" into nLID From "RIssueMaster" where "nCaseid" = nCaseid and "nUserid" is null;
        end if;
                jCordinates := jsonb_agg(jsonb_build_object('t',cTime,'text',cNote,'otext',cNote,'identity',identity,'refreshCount',0,'isMain',true));
        INSERT INTO "RHighlights" ("cNote", "nCaseid", "nSessionId", "nUserid", "dCreatedt", "cPageno", "cLineno","cTime","nLID","cTPageno",
                                  "cTLineno","cTTime","oP","oL","identity","jCordinates")
        VALUES (cNote,  nCaseid, nSessionId, nUserid, now(),
                case when cTranscript ='N' then cPageno else null end,
                case when cTranscript ='N' then cLineno else null end,
                case when cTranscript ='N' then cTime else null end,

                nLID,

                case when cTranscript ='Y' then cPageno else null end,
                case when cTranscript ='Y' then cLineno else null end,
                case when cTranscript ='Y' then cTime else null end,
                oP,oL,identity,jCordinates
               )
        RETURNING "nHid" INTO inserted_id;

        INSERT INTO "RHighlightMapid" ("nHid", "nIid")
        SELECT inserted_id, nLID;

        msg_text := 'Inserted';
        nHid := inserted_id;
    ELSIF permission = 'D' THEN

        select "nSessionId",case when cTranscript ='N' then "cPageno" else "cTPageno" end, "nUserid"
        into nSessionId,cPageno,nUserid
        from "RHighlights" where "nHid" = nHid;

        DELETE FROM "RHighlights" WHERE "nHid" = nHid;

        msg_text := 'Deleted';
    ELSE
        msg := -1;
        msg_text := 'Invalid operation type';
    END IF;

    if(cTranscript ='N') then

    select jsonb_agg(t) into pageData from (
        select dt."nHid",dt."unique_no" as "nGroupid",dt."cLineno",dt.i as "issueids" from (
        select *, grp, DENSE_RANK() OVER (ORDER BY i,"cPageno",grp) AS unique_no From (
        SELECT "cLineno"::bigint - ROW_NUMBER() OVER (PARTITION BY "cPageno"::int,jsonb_agg(m."nIid" order by m."serialno",m."nIid") ORDER BY "cLineno"::int) AS grp, "cPageno", "cLineno",m."nHid",string_agg(m."nIid"::text,',') i
              FROM "RHighlights" h
        JOIN "RHighlightMapid" m ON h."nHid" = m."nHid"
            where h."nSessionId" = nSessionId and h."nUserid" = nUserid and h."cPageno" = cPageno
        group by "cPageno","cLineno",m."nHid"
            order by m."nHid"
        ) dt order by "cPageno","cLineno","nHid",i
        ) dt order by "unique_no")t;
    else

    select jsonb_agg(t) into pageData from (
        select dt."nHid",dt."unique_no" as "nGroupid",dt."cTLineno",dt.i as "issueids" from (
        select *, grp, DENSE_RANK() OVER (ORDER BY i,"cTPageno",grp) AS unique_no From (
        SELECT "cTLineno"::bigint - ROW_NUMBER() OVER (PARTITION BY "cTPageno"::int,jsonb_agg(m."nIid" order by m."serialno",m."nIid") ORDER BY "cTLineno"::int) AS grp, "cTPageno", "cTLineno",m."nHid",string_agg(m."nIid"::text,',') i
              FROM "RHighlights" h
        JOIN "RHighlightMapid" m ON h."nHid" = m."nHid"
            where h."nSessionId" = nSessionId and h."nUserid" = nUserid and h."cTPageno" = cPageno
        group by "cTPageno","cTLineno",m."nHid"
            order by m."nHid"
        ) dt order by "cTPageno","cTLineno","nHid",i
        ) dt order by "unique_no")t;

    end if;

    OPEN ref FOR
        SELECT msg, msg_text AS message, inserted_id AS "nHid",nSessionId,nHid, coalesce(pageData,'[]'::jsonb) as "pageData";

    RETURN ref;
END;
$function$;

COMMIT;
