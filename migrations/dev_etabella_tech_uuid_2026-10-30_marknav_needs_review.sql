DO $$ BEGIN IF current_database() <> 'etabella_tech_uuid' THEN RAISE EXCEPTION 'dev only'; END IF; END $$;

-- Needs Review (100% transfer plan, 2026-10-30): a Mark the publish could not place (no live time, or a
-- time outside the hearing) is kept with cTransferStatus 'O' and was hidden everywhere. These two
-- functions let its OWNER list it and place it on a chosen line of the published transcript. The Mark
-- keeps its type and table: QFact / Fact in FactDetail, DocLink in DocDetail, Quick Mark in RHighlights.
--
--   realtime.et_marknav_needs_review({nCaseid, nSesid, nMasterid})   -> the caller's own 'O' Marks
--   realtime.et_marknav_place_mark({nCaseid, nSesid, nMasterid, id, kind, jT, nTPage, nTLine, cTTime, tidentity})
--                                                                   -> { msg, nPlaced }
-- nMasterid is the JWT user (MarkNavNeedsReviewController); a row is touched only when it belongs to that
-- user, to that session of that case, and is still 'O'. New functions: no earlier body to guard against.
-- Mirrors: sp-audit/sp/realtime/et_marknav_needs_review.sql, et_marknav_place_mark.sql.

BEGIN;

CREATE OR REPLACE FUNCTION realtime.et_marknav_needs_review(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
  nCaseid   uuid := (parameter->>'nCaseid')::uuid;
  nSesid    uuid := (parameter->>'nSesid')::uuid;
  nMasterid uuid := (parameter->>'nMasterid')::uuid;
BEGIN
  OPEN ref FOR
  SELECT m."nFSid" AS id, m."cFType"::text AS kind, d."jCordinates", d."jOT" AS "jTexts", m."dCreateDt",
         CASE WHEN d."jCordinates" IS NULL OR jsonb_typeof(d."jCordinates") <> 'array' OR jsonb_array_length(d."jCordinates") = 0
                OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(d."jCordinates") c WHERE coalesce(c->>'t', '') <> '')
              THEN 'no-time' ELSE 'outside-hearing' END AS reason
    FROM "FactMaster" m JOIN "FactDetail" d ON d."nFSid" = m."nFSid"
   WHERE m."nSesid" = nSesid AND m."nCaseid" = nCaseid AND m."nUserid" = nMasterid AND d."cTransferStatus" = 'O'
  UNION ALL
  SELECT m."nDocid", 'D', d."jCordinates", d."jOText", m."dCreateDt",
         CASE WHEN d."jCordinates" IS NULL OR jsonb_typeof(d."jCordinates") <> 'array' OR jsonb_array_length(d."jCordinates") = 0
                OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(d."jCordinates") c WHERE coalesce(c->>'t', '') <> '')
              THEN 'no-time' ELSE 'outside-hearing' END
    FROM "DocMaster" m JOIN "DocDetail" d ON d."nDocid" = m."nDocid"
   WHERE m."nSesid" = nSesid AND m."nCaseid" = nCaseid AND m."nUserid" = nMasterid AND d."cTransferStatus" = 'O'
  UNION ALL
  SELECT h."nHid", 'QM', h."jCordinates", to_jsonb(ARRAY[h."cNote"]), h."dCreatedt",
         CASE WHEN coalesce(h."cTime", '') = '' THEN 'no-time' ELSE 'outside-hearing' END
    FROM "RHighlights" h
   WHERE h."nSessionId" = nSesid AND h."nCaseid" = nCaseid AND h."nUserid" = nMasterid AND h."cTransferStatus" = 'O'
   ORDER BY 5;
  RETURN ref;
END;
$function$;

CREATE OR REPLACE FUNCTION realtime.et_marknav_place_mark(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
  nCaseid   uuid := (parameter->>'nCaseid')::uuid;
  nSesid    uuid := (parameter->>'nSesid')::uuid;
  nMasterid uuid := (parameter->>'nMasterid')::uuid;
  nId       uuid := (parameter->>'id')::uuid;
  cKind     text := parameter->>'kind';
  jT        jsonb := (parameter->>'jT')::jsonb;
  nPage     integer := (parameter->>'nTPage')::integer;
  nLine     integer := (parameter->>'nTLine')::integer;
  n         integer := 0;
BEGIN
  IF cKind IN ('QF', 'F') THEN
    UPDATE "FactDetail" d SET "jTCordinates" = jT, "nTPage" = nPage, "nTLine" = nLine, "cTransferStatus" = 'T'
      FROM "FactMaster" m
     WHERE d."nFSid" = nId AND m."nFSid" = d."nFSid" AND m."nSesid" = nSesid AND m."nCaseid" = nCaseid
       AND m."nUserid" = nMasterid AND d."cTransferStatus" = 'O';
  ELSIF cKind = 'D' THEN
    UPDATE "DocDetail" d SET "jTCordinates" = jT, "nTPage" = nPage, "nTLine" = nLine, "cTransferStatus" = 'T'
      FROM "DocMaster" m
     WHERE d."nDocid" = nId AND m."nDocid" = d."nDocid" AND m."nSesid" = nSesid AND m."nCaseid" = nCaseid
       AND m."nUserid" = nMasterid AND d."cTransferStatus" = 'O';
  ELSIF cKind = 'QM' THEN
    UPDATE "RHighlights" h SET "cTPageno" = nPage::text, "cTLineno" = nLine::text, "cTTime" = parameter->>'cTTime',
           "tidentity" = parameter->>'tidentity', "jTCordinates" = jT, "cTransferStatus" = 'T'
     WHERE h."nHid" = nId AND h."nSessionId" = nSesid AND h."nCaseid" = nCaseid
       AND h."nUserid" = nMasterid AND h."cTransferStatus" = 'O';
  END IF;
  GET DIAGNOSTICS n = ROW_COUNT;
  OPEN ref FOR SELECT CASE WHEN n > 0 THEN 1 ELSE -1 END AS msg,
                      CASE WHEN n > 0 THEN 'Placed' ELSE 'Mark not found or already placed' END AS value,
                      n AS "nPlaced";
  RETURN ref;
END;
$function$;

COMMIT;
