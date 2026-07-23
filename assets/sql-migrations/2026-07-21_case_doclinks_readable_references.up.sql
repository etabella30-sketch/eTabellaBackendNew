-- Issue 040: expose readable source/destination document references in the
-- case-wide DocLinks report. Internal DocMaster and BundleDetail UUIDs are not
-- report data and are intentionally omitted from this cursor.

BEGIN;

CREATE OR REPLACE FUNCTION public.et_case_doclinks(parameter json, ref refcursor)
 RETURNS refcursor LANGUAGE plpgsql AS $function$
DECLARE nCaseid uuid;
BEGIN
    nCaseid := NULLIF(parameter->>'nCaseid','')::uuid;

    OPEN ref FOR
    SELECT
        m."dCreateDt",
        source."cTab" AS "cSourceTab",
        source."cFilename" AS "cSourceDocument",
        destination."cTab" AS "cDestinationTab",
        destination."cFilename" AS "cDestinationDocument",
        u."cFname" || ' ' || COALESCE(u."cLname",'') AS "cCreateby",
        d."cType",
        d."jLinktype",
        d."nPage",
        d."nLine",
        d."jTexts"
    FROM "DocMaster" m
    JOIN "DocDetail" d ON d."nDocid" = m."nDocid"
    JOIN "UserMaster" u ON u."nUserid" = m."nUserid"
    JOIN "BundleDetail" source
      ON source."nBundledetailid" = m."nBundledetailid"
    JOIN "DMLinks" l ON l."nDocid" = m."nDocid"
    JOIN "BundleDetail" destination
      ON destination."nBundledetailid" = l."nBundledetailid"
    JOIN bundlesource case_target
      ON case_target."nBundledetailid" = destination."nBundledetailid"
    WHERE case_target."nCaseid" = nCaseid
    ORDER BY m."dCreateDt" DESC;

    RETURN ref;
END;
$function$;

COMMIT;
