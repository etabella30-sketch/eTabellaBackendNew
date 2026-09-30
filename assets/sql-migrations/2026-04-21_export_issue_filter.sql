-- 2026-04-21 — et_realtime_get_issue_annotation_highlight_export: apply jIssues/jHIssues filters
--
-- Symptom
-- -------
-- Export Transcript → Advanced Setup → "Annotation Filter → Issue = alokIssue"
-- produces a PDF that still highlights every annotation, not just the ones
-- linked to the selected issue. The filter looks applied in the UI
-- (alokIssue badge, `jAnnotationFilters` posted to backend) but the exported
-- PDF is unfiltered.
--
-- Root cause
-- ----------
-- The SP declares jIssues and jHIssues from the JSON parameter but the WHERE
-- clauses in ref1 (facts/qfacts) and ref2 (quick marks) never reference them.
-- ref1 gates only on f."nSesid" and bQfact; ref2 gates on h."nUserid" and
-- h."nSessionId". So the SP returns everything for that session regardless of
-- the user's filter selection.
--
-- Fix
-- ---
-- Add an "empty filter means no filter" guard to both refs:
--   AND (jsonb_array_length(jIssues) = 0
--        OR i."nIid"::text IN (SELECT jsonb_array_elements_text(jIssues)))
-- ref1 filters on the fact's linked issue (via d."nColorid" → i."nIid").
-- ref2 filters on the highlight's linked issue (h."nLID" / RIssueMaster.nIid).
-- Unfiltered callers (empty [] payload) behave exactly as before.

CREATE OR REPLACE FUNCTION public.et_realtime_get_issue_annotation_highlight_export(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nSessionid UUID;
    nCaseid UUID;
    nUserid UUID;
    cTranscript text;
    jIssues jsonb;
    jHIssues jsonb;
    jPages jsonb;
    bQfact boolean;
    bQmark boolean;

BEGIN

    nSessionid := NULLIF(parameter ->> 'nSessionid','')::UUID;
    nCaseid := NULLIF(parameter ->> 'nCaseid','')::UUID;
    nUserid := NULLIF(parameter ->> 'nUserid','')::UUID;
    cTranscript := (parameter ->>'cTranscript')::text;
    jIssues := coalesce((parameter ->>'jIssues')::jsonb,'[]'::jsonb);
    jHIssues := coalesce((parameter ->>'jHIssues')::jsonb,'[]'::jsonb);
    jPages := coalesce((parameter ->>'jPages')::jsonb,'[]'::jsonb);

    bQfact := NULLIF(parameter ->> 'bQfact','')::boolean;
    bQmark := NULLIF(parameter ->> 'bQmark','')::boolean;


    /* ====================== FULL FACTS ====================== */

    OPEN ref1 FOR

    WITH tbl AS (
        SELECT
            f."nFSid" AS "nIDid",
            NULL::int AS "pageIndex",
            CASE
                WHEN COALESCE(cTranscript,'N') = 'N'
                THEN d."jCordinates"
                ELSE d."jTCordinates"
            END AS "cordinates",
            i."cColor" AS "color",
            1 AS "nICount",
            NULL::text AS "cONote"
        FROM "FactMaster" f
        JOIN "FactDetail" d ON d."nFSid" = f."nFSid"
        JOIN "RIssueMaster" i ON i."nIid" = d."nColorid"
        WHERE f."nSesid" = nSessionid
          AND (bQfact IS NULL OR bQfact = true)
          AND (
              jsonb_array_length(jIssues) = 0
              OR i."nIid"::text IN (SELECT jsonb_array_elements_text(jIssues))
          )
    )

    SELECT t.*
    FROM tbl t;

    RETURN NEXT ref1;



    /* ====================== QUICK MARKS ====================== */

    OPEN ref2 FOR

    WITH tbl AS (

        /* CASE 1 — JSON based highlights */
        SELECT
            h."nHid",
            h."nLID",
            t."t" AS "cTime",
            t."text" AS "cNote",
            t."otext" AS "cFNote",
            t."identity",
            t."refreshCount",
            h."nLID"::text AS "issueids"
        FROM "RHighlights" h,
        jsonb_to_recordset(
            CASE
                WHEN COALESCE(cTranscript,'N') = 'N'
                THEN h."jCordinates"
                ELSE h."jTCordinates"
            END
        ) AS t(
            "t" text,
            "text" text,
            "otext" text,
            "identity" text,
            "refreshCount" int,
            "isMain" boolean
        )
        WHERE h."nUserid" = nUserid
          AND h."nSessionId" = nSessionid
          AND h."jCordinates" IS NOT NULL
          AND (
              jsonb_array_length(jHIssues) = 0
              OR h."nLID"::text IN (SELECT jsonb_array_elements_text(jHIssues))
          )


        UNION ALL


        /* CASE 2 — Column based highlights */
        SELECT
            h."nHid",
            h."nLID",
            CASE
                WHEN COALESCE(cTranscript,'N') = 'N'
                THEN h."cTime"
                ELSE h."cTTime"
            END AS "cTime",
            h."cNote",
            h."cNote" AS "cFNote",
            CASE
                WHEN COALESCE(cTranscript,'N') = 'N'
                THEN h."identity"
                ELSE h."tidentity"
            END AS "identity",
            0 AS "refreshCount",
            h."nLID"::text AS "issueids"
        FROM "RHighlights" h
        WHERE h."nUserid" = nUserid
          AND h."nSessionId" = nSessionid
          AND h."jCordinates" IS NULL
          AND (
              jsonb_array_length(jHIssues) = 0
              OR h."nLID"::text IN (SELECT jsonb_array_elements_text(jHIssues))
          )
    )

    SELECT t.*, m."cColor"
    FROM tbl t
    JOIN "RIssueMaster" m ON m."nIid" = t."nLID";

    RETURN NEXT ref2;

END;
$function$;
