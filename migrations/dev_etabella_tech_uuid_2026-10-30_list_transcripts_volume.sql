DO $$ BEGIN IF current_database() <> 'etabella_tech_uuid' THEN RAISE EXCEPTION 'dev only'; END IF; END $$;

-- Drift guard (2026-10-30): checked against etabella_tech_uuid's live body (pg_get_functiondef). The function is
-- replaced only when it is still that body or already carries this change.
DO $$
DECLARE def text;
BEGIN
  SELECT pg_get_functiondef('transcript.et_list_transcripts(json,refcursor)'::regprocedure) INTO def;
  IF md5(regexp_replace(def, '\s+', '', 'g')) <> '50fe769d73c14f3ea6c0b93371ee2a60' AND position('"cTVolume"' in def) = 0 THEN
    RAISE EXCEPTION 'transcript.et_list_transcripts(json,refcursor) differs from the body this change was built on (2026-10-30): rebase on pg_get_functiondef before applying';
  END IF;
END $$;

-- D3-04 (Day 3 publish QA 2026-10-30): RT Production published rows show Volume "—".
--
-- The workspace list (GET transcript/get_transcripts) did not return "cTVolume", so the
-- frontend Volume column (rtpVolumeLabel) fell back to the empty cTitle and showed "—" for
-- Day - 01 / 02 / 03 although Properties saved "Day - 03". The column is appended at the end;
-- every existing column keeps its name and position.
-- Mirror: sp-audit/sp/transcript/et_list_transcripts.sql. Dev only; prod stays pending.

BEGIN;

CREATE OR REPLACE FUNCTION transcript.et_list_transcripts(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
BEGIN

-- select * FROM transcript."Transcripts"
    OPEN ref FOR
    SELECT
        "cTransid", "cTitle", "cCasename", "cCCaseno",
      TO_CHAR("dTranscribedDate",'DD-MM-YYYY') "dTranscribedDate", "dImportDt","nPages","cPath","cReporter","cHtmlpath","cHtmlpath4pg","nSesid",
      "cTVolume"
    FROM transcript."Transcripts"
    ORDER BY "dImportDt" DESC;

    RETURN ref;
END;
$function$;

COMMIT;
