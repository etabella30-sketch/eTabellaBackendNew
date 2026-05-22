CREATE OR REPLACE FUNCTION elastic.et_advance_search(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nCaseid    uuid;
    nMasterid  uuid;
    nSectionid uuid;
    jFiles     jsonb;
BEGIN
    nCaseid    := (parameter ->> 'nCaseid')::uuid;
    nMasterid  := (parameter ->> 'nMasterid')::uuid;
    nSectionid := NULLIF(parameter ->> 'nSectionid', '')::uuid;
    jFiles     := parameter ->> 'jFiles';

    OPEN ref FOR
        WITH dts AS (
            SELECT * FROM jsonb_to_recordset(jFiles)
              AS ("nBundledetailid" uuid, "matches" int)
        ), tbl AS (
            SELECT
                b."nBundledetailid",
                b."cTab",
                b."cExhibitno",
                b."cFilename" AS "cName",
                b."cPath",
                COALESCE(b."cRefpage", b."cPage") AS "cPage",
                b."cFiletype",
                b."dIntrestDt",
                b."sorted_tab",
                b."start_date",
                b."end_date",
                t."matches",
				bm."cBundletag"
            FROM "BundleDetail" b
            JOIN "SectionMaster" s ON s."nSectionid" = b."nSectionid"
            JOIN dts t ON t."nBundledetailid" = b."nBundledetailid"
			left join "BundleMaster" bm on bm."nBundleid" = b."nBundleid"
			WHERE b."cStatus" = 'C'
              AND s."nCaseid" = nCaseid
              AND CASE WHEN nSectionid IS NOT NULL
                       THEN b."nSectionid" = nSectionid
                       ELSE TRUE
                  END
        )
        SELECT
            t."nBundledetailid",
            t."cTab",
            t."cExhibitno",
            t."cName",
            t."cPath",
            t."cPage",
            t."cFiletype",
			t."cBundletag"
        FROM tbl t
        ORDER BY t.matches DESC;

    RETURN ref;
END;
$function$
