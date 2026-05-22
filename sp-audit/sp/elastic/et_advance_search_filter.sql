CREATE OR REPLACE FUNCTION elastic.et_advance_search_filter(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nCaseid    uuid;
    nMasterid  uuid;
    nSectionid uuid;
    jIssues    jsonb;
    jImpact    jsonb;
    jRelevance jsonb;
    jMarkup    jsonb;
BEGIN
    nCaseid    := (parameter ->> 'nCaseid')::uuid;
    nMasterid  := (parameter ->> 'nMasterid')::uuid;
    nSectionid := NULLIF(parameter ->> 'nSectionid', '')::uuid;
    jIssues    := parameter ->> 'jIssues';
    jImpact    := parameter ->> 'jImpact';
    jRelevance := parameter ->> 'jRelevance';
    jMarkup    := parameter ->> 'jMarkup';

    OPEN ref FOR
        WITH fct AS (
            SELECT
                f."nFSid",
                f."nBundledetailid",
                i."nIssueid",
                i."nImpactid",
                i."nRelevanceid",
                f."cFType"
            FROM "FactMaster" f
            JOIN "FMIssue" i ON i."nFSid" = f."nFSid"
            WHERE f."nUserid" = nMasterid
              AND coalesce(jIssues, '[]'::jsonb) @> to_jsonb(i."nIssueid")
              AND jMarkup @> to_jsonb(ARRAY[f."cFType"])
			  AND (case when (jsonb_array_length(coalesce(jImpact,'[]'::jsonb))  >0) then coalesce(jImpact,'[]'::jsonb) @> to_jsonb(i."nImpactid") else true end and case when (jsonb_array_length(coalesce(jRelevance,'[]'::jsonb)) > 0) then coalesce(jRelevance,'[]'::jsonb) @> to_jsonb(i."nRelevanceid") else true end)
        ), doc AS (
            SELECT d."nDocid", d."nBundledetailid"
            FROM "DocMaster" d
            WHERE d."nUserid" = nMasterid
              AND coalesce(jMarkup, '[]'::jsonb) @> to_jsonb(ARRAY['D'])
        ), web AS (
            SELECT w."nWebid", w."nBundledetailid"
            FROM "WebMaster" w
            WHERE w."nUserid" = nMasterid
              AND coalesce(jMarkup, '[]'::jsonb) @> to_jsonb(ARRAY['W'])
        )
        SELECT DISTINCT b."nBundledetailid"
        FROM "BundleDetail" b
        JOIN "SectionMaster" s ON s."nSectionid" = b."nSectionid"
        LEFT JOIN fct f ON f."nBundledetailid" = b."nBundledetailid"
        LEFT JOIN doc d ON d."nBundledetailid" = b."nBundledetailid"
        LEFT JOIN web w ON w."nBundledetailid" = b."nBundledetailid"
        WHERE b."cStatus" = 'C'
          AND b."cFiletype" = 'PDF'
          AND s."nCaseid" = nCaseid
          AND CASE WHEN nSectionid IS NOT NULL THEN b."nSectionid" = nSectionid ELSE TRUE END
          AND CASE WHEN (jIssues IS NOT NULL OR jImpact IS NOT NULL OR jRelevance IS NOT NULL)
                   THEN f."nBundledetailid" IS NOT NULL ELSE TRUE
              END
          AND CASE WHEN jMarkup @> '["D"]'::jsonb THEN d."nBundledetailid" IS NOT NULL ELSE TRUE END
          AND CASE WHEN jMarkup @> '["W"]'::jsonb THEN w."nBundledetailid" IS NOT NULL ELSE TRUE END;

    RETURN ref;
END;
$function$
