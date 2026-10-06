-- 2026-10-06_qmark_handler_complete.down.sql
--
-- Undo of 2026-10-06_qmark_handler_complete.sql: the bare realtime.et_qmark_handler body (no map row, no
-- jCordinates, no pageData). The backfill of 2026-10-06_qmark_backfill_map_and_coordinates.sql is NOT undone: a
-- quick mark with its map row and coordinates is what every reader expects. Dev etabella_tech_uuid only.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'qmark_handler_complete down: refusing to run on database % (dev etabella_tech_uuid only)', current_database();
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

    IF permission = 'I' THEN

        if (nLID is null)then
                    select "nIid" into nLID From "RIssueMaster" where "nCaseid" = nCaseid and "nUserid" is null;
        end if;
        INSERT INTO "RHighlights" ("cNote", "nCaseid", "nSessionId", "nUserid", "dCreatedt", "cPageno", "cLineno","cTime","nLID","cTPageno",
                                  "cTLineno","cTTime","oP","oL","identity")
        VALUES (cNote,  nCaseid, nSessionId, nUserid, now(),
                case when cTranscript ='N' then cPageno else null end,
                case when cTranscript ='N' then cLineno else null end,
                case when cTranscript ='N' then cTime else null end,

                nLID,

                case when cTranscript ='Y' then cPageno else null end,
                case when cTranscript ='Y' then cLineno else null end,
                case when cTranscript ='Y' then cTime else null end,
                oP,oL,identity
               )
        RETURNING "nHid" INTO inserted_id;

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

    OPEN ref FOR
        SELECT msg, msg_text AS message, inserted_id AS "nHid",nSessionId,nHid;

    RETURN ref;
END;
$function$;

COMMIT;
