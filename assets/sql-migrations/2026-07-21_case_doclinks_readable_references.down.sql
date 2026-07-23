-- Revert Issue 040 readable DocLinks references to the previous ID-based shape.

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
    JOIN "DocDetail" d ON d."nDocid" = m."nDocid"
    JOIN "UserMaster" u ON u."nUserid" = m."nUserid"
    JOIN "DMLinks" l ON l."nDocid" = m."nDocid"
    JOIN bundlesource target
      ON target."nBundledetailid" = l."nBundledetailid"
    WHERE target."nCaseid" = nCaseid
    ORDER BY m."dCreateDt" DESC;

    RETURN ref;
END;
$function$;

COMMIT;
