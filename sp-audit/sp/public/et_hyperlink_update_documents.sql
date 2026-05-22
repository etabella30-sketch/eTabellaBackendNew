CREATE OR REPLACE FUNCTION public.et_hyperlink_update_documents(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$DECLARE
    nMasterid UUID;
    nBundledetailid UUID;
    cHyperlinktype TEXT;
    file_path TEXT;
    cPath TEXT;
    nHLid UUID;
    cStatus TEXT;
    nSectionid UUID;
    cKeeptype TEXT;
    nTotaldata INT;
    nCaseid UUID;
    ZeroUUID UUID := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
    -- Apply P-1: Blank string → NULL conversion with explicit UUID casting
    nMasterid := NULLIF(parameter ->>'nMasterid', '')::uuid;
    nBundledetailid := NULLIF(parameter ->>'nBundledetailid', '')::uuid;
    cHyperlinktype := parameter ->>'cType';
    cPath := parameter ->>'cPath';
    cStatus := parameter ->>'cStatus';
    nSectionid := NULLIF(parameter ->>'nSectionid', '')::uuid;
    cKeeptype := parameter ->>'cKeeptype';

    -- Get case ID from section
    SELECT "nCaseid" INTO nCaseid FROM "SectionMaster" WHERE "nSectionid" = nSectionid;

    -- Check if hyperlink exists
    SELECT "nHLid" INTO nHLid
    FROM "HyperLink"
    WHERE "nBundledetailid" = nBundledetailid AND "cType" = cHyperlinktype;

    -- Apply P-11: Replace integer zero checks with IS NULL
    IF nHLid IS NULL THEN
        INSERT INTO "HyperLink"("nBundledetailid", "nUserid", "cStatus", "cType")
        VALUES(nBundledetailid, nMasterid, cStatus, cHyperlinktype)
        RETURNING "nHLid" INTO nHLid;
    ELSE
        UPDATE "HyperLink"
        SET "cStatus" = cStatus, "dUpdateDt" = now(), "nUpdateid" = nMasterid
        WHERE "nHLid" = nHLid;
    END IF;

    IF cStatus = 'C' THEN
        IF COALESCE(cKeeptype,'R') = 'R' THEN
            DELETE FROM "Annotations" a
            WHERE EXISTS (
                SELECT * FROM "HyperLink" h
                WHERE h."nHLid" = a."nHLid" AND h."nBundledetailid" = nBundledetailid
            );
        ELSE
            DELETE FROM "Annotations" a
            WHERE EXISTS (
                SELECT * FROM "HyperLink" h
                WHERE h."nHLid" = a."nHLid" AND h."nBundledetailid" = nBundledetailid AND h."cType" = cHyperlinktype
            );
        END IF;
    END IF;

    IF cStatus = 'C' THEN
        INSERT INTO "Annotations"("uuid", "type", "rects", "lines", "page", "dCreateDt", "nHLid", "isHyperlink")
        WITH SplitText AS (
            SELECT
                id,
                page,
                x0, y0, x1, y1,
                extracted_text,
                CASE
                    WHEN cHyperlinktype = 'T' THEN (TRIM(SPLIT_PART(extracted_text, '[Exhibit', 1)))
                    ELSE (
                        TRIM(CASE
                            WHEN POSITION('[Exhibit' IN extracted_text) > 0
                            THEN REPLACE(SPLIT_PART(extracted_text, '[Exhibit', 2), ']', '')
                            ELSE extracted_text
                        END)
                    )
                END AS extracted_text1,
                "nBundledetailid"
            FROM pdf_data
            WHERE "nBundledetailid" = nBundledetailid
        ),
        SearchMatches AS (
            SELECT
                st.terms,
                st."nBundledetailid" AS "nBDid",
                pt.*,
                CASE
                    WHEN pt.extracted_text1 LIKE st.terms || '-%'
                    THEN SUBSTRING(pt.extracted_text1 FROM POSITION(st.terms || '-' IN pt.extracted_text1) + LENGTH(st.terms) + 1 FOR CHAR_LENGTH(pt.extracted_text1))
                    ELSE NULL
                END AS numeric_value,
                CASE
                    WHEN pt.extracted_text1 ~ (st.terms || '-[0-9]+:[0-9]+') THEN
                        SUBSTRING(pt.extracted_text1 FROM POSITION(':' IN pt.extracted_text1) + 1 FOR POSITION('/' IN pt.extracted_text1 || '/') - POSITION(':' IN pt.extracted_text1) - 1)::int
                    ELSE NULL
                END AS line,
                CASE
                    WHEN pt.extracted_text1 ~ (st.terms || '-[0-9]+:[0-9]+/[0-9]+:[0-9]+') THEN
                        SUBSTRING(SUBSTRING(pt.extracted_text1 FROM POSITION('/' IN pt.extracted_text1) + 1) FROM '^[0-9]+')::int
                    ELSE NULL
                END AS page2,
                CASE
                    WHEN pt.extracted_text1 ~ (st.terms || '-[0-9]+:[0-9]+/[0-9]+:[0-9]+') THEN
                        SUBSTRING(SUBSTRING(pt.extracted_text1 FROM POSITION('/' IN pt.extracted_text1)) FROM ':(.*)$')::int
                    ELSE NULL
                END AS line2
            FROM (
                -- ═══════════════════════════════════════════════════════════
                -- FIX: Split comma-separated exhibit numbers into individual rows
                -- Before: "EX1, EX2" was one row → couldn't match individual terms
                -- After:  "EX1, EX2" becomes two rows: "EX1" and "EX2"
                -- ═══════════════════════════════════════════════════════════
                SELECT
                    trim(exhibit_term) AS "terms",
                    b."nBundledetailid"
                FROM "BundleDetail" b
                JOIN "SectionMaster" sm ON sm."nSectionid" = b."nSectionid"
                CROSS JOIN LATERAL unnest(string_to_array(
                    (CASE
                        WHEN COALESCE(cHyperlinktype,'T') = 'E'
                        THEN replace(replace(trim(COALESCE(b."cExhibitno",'')), E'\n', ''),E'\r','')
                        ELSE replace(replace(trim(COALESCE(b."cTab",'')), E'\n', ''),E'\r','')
                    END),
                    ','
                )) AS exhibit_term
                WHERE sm."nCaseid" = nCaseid
                AND CASE
                    WHEN COALESCE(cHyperlinktype,'T') = 'E'
                    THEN trim(COALESCE(b."cExhibitno",'')) != ''
                    ELSE trim(COALESCE(b."cTab",'')) != ''
                END
                AND trim(exhibit_term) != ''
            ) st
            CROSS JOIN SplitText pt
            WHERE (
                pt.extracted_text1 LIKE st.terms || '%'
                AND (
                    pt.extracted_text1 LIKE st.terms || '-%'
                    OR pt.extracted_text1 = st.terms
                    OR pt.extracted_text1 LIKE (st.terms || ',%')
                    OR pt.extracted_text1 LIKE (st.terms || ' %')
                )
            )
        )
        SELECT
            uuid_generate_v4(),
            'strikeout',
            JSONB_BUILD_ARRAY(
                JSONB_BUILD_OBJECT(
                    'x', x0,
                    'y', y0 + (y1 - y0),
                    'width', x1 - x0,
                    'height', y1 - y0,
                    'redirectpage', COALESCE(SUBSTRING(numeric_value FROM '^[0-9]+')::int, 1),
                    'redirectpage2', COALESCE(page2, 0),
                    'redirectline', line,
                    'redirectline2', line2,
                    'bundledetailid', "nBDid"
                )
            ),
            '[]'::jsonb,
            page,
            now(),
            nHLid,
            true
        FROM SearchMatches;
    END IF;

    OPEN ref FOR
    SELECT 1 as msg, 'Success' as value, file_path;

    RETURN ref;
END;$function$
