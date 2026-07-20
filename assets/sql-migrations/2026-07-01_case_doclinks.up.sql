-- 2026-07-01 — public.et_case_doclinks (NEW)
-- Case-wide DocLink listing for the Outputs "Export Data" card. No case-wide
-- doclink SP existed (all others are per-doc/per-session), so this flattens
-- one row per link: source doc (DocMaster/DocDetail) + creator + the linked
-- target bundle. Scoped to the case via the target's bundlesource.nCaseid.
--
-- Columns/joins mirror realtime.et_marknav_doclinks (DocMaster m ⋈ DocDetail d
-- by nDocid, ⋈ UserMaster, ⋈ DMLinks l, ⋈ bundlesource by nBundledetailid).
-- VERIFY against the live schema before relying on prod output — a few column
-- names are inferred from that SP; on mismatch the export degrades to empty
-- (the caller treats a failed SP as no rows), it does not crash.

BEGIN;

CREATE OR REPLACE FUNCTION public.et_case_doclinks(parameter json, ref refcursor)
 RETURNS refcursor LANGUAGE plpgsql AS $function$
DECLARE nCaseid uuid;
BEGIN
    nCaseid := NULLIF(parameter->>'nCaseid','')::uuid;

    OPEN ref FOR
    SELECT
        m."dCreateDt",
        m."nDocid",
        u."cFname" || ' ' || COALESCE(u."cLname",'') AS "cCreateby",
        d."cType",
        d."jLinktype",
        d."nPage",
        d."nLine",
        d."jTexts",
        l."nBundledetailid" AS "nLinkedBundledetailid"
    FROM "DocMaster" m
    JOIN "DocDetail" d  ON d."nDocid" = m."nDocid"
    JOIN "UserMaster" u ON u."nUserid" = m."nUserid"
    JOIN "DMLinks" l    ON l."nDocid" = m."nDocid"
    JOIN bundlesource tgt ON tgt."nBundledetailid" = l."nBundledetailid"
    WHERE tgt."nCaseid" = nCaseid
    ORDER BY m."dCreateDt" DESC;

    RETURN ref;
END;
$function$;

COMMIT;
