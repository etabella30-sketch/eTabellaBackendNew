-- =============================================================================
-- et_hyperlink_update_documents_v2
--
-- Smart-scan variant of et_hyperlink_update_documents. Called by apps/hyperlink
-- (hyperlink.processor.ts) only when the job was started with isSmartscan; the
-- original function keeps serving the four legacy options untouched.
--
-- Matching passes, in precedence order (a scanned row is consumed by the first
-- pass that matches it):
--   1. exhibit exact   -- BundleDetail.cExhibitno / cTab, the legacy LIKE rule
--   2. folder exact    -- BundleMaster.cBundlename (type E) / cBundletag (type T)
--                         equals the scanned text (case-sensitive)
--   3. zero-pad exhibit-- pass 1 with leading zeros stripped from every number
--                         on both sides ("Exhibit R-056" -> "Exhibit R-56")
--   4. zero-pad folder -- pass 2 with the same normalisation
--
-- Folder links are stored in Annotations.rects[0] with
--   linktype = 'F', bundleid, bundlename, bundletag   (no bundledetailid)
-- The viewer opens the file explorer on that folder; download.et_get_hyperlink_jobs
-- ignores them (inner join on bundledetailid) until the offline package learns
-- folder targets.
--
-- Validated 2026-09-06 read-only against case 54970cc5 (I11 + 108 other files):
-- pass 1 reproduces the live annotation count exactly, passes 2-4 add only
-- correct links, no ambiguity. See session notes / test_passes.sql.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.et_hyperlink_update_documents_v2(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $_$
DECLARE
    nMasterid UUID;
    nBundledetailid UUID;
    cHyperlinktype TEXT;
    file_path TEXT;
    cPath TEXT;
    nHLid UUID;
    cStatus TEXT;
    nSectionid UUID;
    cKeeptype TEXT;
    nCaseid UUID;
BEGIN
    nMasterid := NULLIF(parameter ->>'nMasterid', '')::uuid;
    nBundledetailid := NULLIF(parameter ->>'nBundledetailid', '')::uuid;
    cHyperlinktype := COALESCE(parameter ->>'cType', 'T');
    cPath := parameter ->>'cPath';
    cStatus := parameter ->>'cStatus';
    nSectionid := NULLIF(parameter ->>'nSectionid', '')::uuid;
    cKeeptype := parameter ->>'cKeeptype';

    SELECT "nCaseid" INTO nCaseid FROM "SectionMaster" WHERE "nSectionid" = nSectionid;

    -- HyperLink header row: same upsert as v1
    SELECT "nHLid" INTO nHLid
    FROM "HyperLink"
    WHERE "nBundledetailid" = nBundledetailid AND "cType" = cHyperlinktype;

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
        -- Keep/Replace semantics identical to v1
        IF COALESCE(cKeeptype,'R') = 'R' THEN
            DELETE FROM "Annotations" a
            WHERE EXISTS (
                SELECT 1 FROM "HyperLink" h
                WHERE h."nHLid" = a."nHLid" AND h."nBundledetailid" = nBundledetailid
            );
        ELSE
            DELETE FROM "Annotations" a
            WHERE EXISTS (
                SELECT 1 FROM "HyperLink" h
                WHERE h."nHLid" = a."nHLid" AND h."nBundledetailid" = nBundledetailid AND h."cType" = cHyperlinktype
            );
        END IF;

        INSERT INTO "Annotations"("uuid", "type", "rects", "lines", "page", "dCreateDt", "nHLid", "isHyperlink")
        WITH SplitText AS (
            -- scanned rows for this file; extracted_text1 as in v1
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
                END AS extracted_text1
            FROM pdf_data
            WHERE "nBundledetailid" = nBundledetailid
        ),
        Norm AS (
            -- zero-padding normalisation: leading zeros of every number that is not
            -- itself preceded by a digit or a dot ("R-056" -> "R-56", "10.05" stays)
            SELECT st.*, regexp_replace(st.extracted_text1, '(?<![0-9.])0+([0-9])', '\1', 'g') AS text_norm
            FROM SplitText st
        ),
        Terms AS (
            SELECT
                trim(exhibit_term) AS terms,
                regexp_replace(trim(exhibit_term), '(?<![0-9.])0+([0-9])', '\1', 'g') AS terms_norm,
                b."nBundledetailid"
            FROM "BundleDetail" b
            JOIN "SectionMaster" sm ON sm."nSectionid" = b."nSectionid"
            CROSS JOIN LATERAL unnest(string_to_array(
                (CASE
                    WHEN cHyperlinktype = 'E'
                    THEN replace(replace(trim(COALESCE(b."cExhibitno",'')), E'\n', ''),E'\r','')
                    ELSE replace(replace(trim(COALESCE(b."cTab",'')), E'\n', ''),E'\r','')
                END),
                ','
            )) AS exhibit_term
            WHERE sm."nCaseid" = nCaseid
            AND b."cStatus" = 'C'
            AND trim(exhibit_term) <> ''
        ),
        Folders AS (
            SELECT
                bm."nBundleid",
                bm."cBundlename",
                bm."cBundletag",
                CASE WHEN cHyperlinktype = 'E' THEN trim(bm."cBundlename") ELSE trim(COALESCE(bm."cBundletag",'')) END AS fname
            FROM "BundleMaster" bm
            JOIN "SectionMaster" sm ON sm."nSectionid" = bm."nSectionid"
            WHERE sm."nCaseid" = nCaseid
        ),
        -- pass 1: exhibit exact (legacy rule)
        P1 AS (
            SELECT n.id, n.page, n.x0, n.y0, n.x1, n.y1, n.extracted_text1 AS txt, t.terms, t."nBundledetailid" AS "nBDid"
            FROM Norm n
            JOIN Terms t
              ON n.extracted_text1 LIKE t.terms || '%'
             AND (n.extracted_text1 LIKE t.terms || '-%' OR n.extracted_text1 = t.terms
                  OR n.extracted_text1 LIKE t.terms || ',%' OR n.extracted_text1 LIKE t.terms || ' %')
        ),
        -- pass 2: folder exact
        P2 AS (
            SELECT n.id, n.page, n.x0, n.y0, n.x1, n.y1, f."nBundleid", f."cBundlename", f."cBundletag"
            FROM Norm n
            JOIN Folders f ON f.fname <> '' AND n.extracted_text1 = f.fname
            WHERE NOT EXISTS (SELECT 1 FROM P1 WHERE P1.id = n.id)
        ),
        -- pass 3: exhibit with zero-padding normalised on both sides
        P3 AS (
            SELECT n.id, n.page, n.x0, n.y0, n.x1, n.y1, n.text_norm AS txt, t.terms_norm AS terms, t."nBundledetailid" AS "nBDid"
            FROM Norm n
            JOIN Terms t
              ON n.text_norm LIKE t.terms_norm || '%'
             AND (n.text_norm LIKE t.terms_norm || '-%' OR n.text_norm = t.terms_norm
                  OR n.text_norm LIKE t.terms_norm || ',%' OR n.text_norm LIKE t.terms_norm || ' %')
            WHERE NOT EXISTS (SELECT 1 FROM P1 WHERE P1.id = n.id)
              AND NOT EXISTS (SELECT 1 FROM P2 WHERE P2.id = n.id)
        ),
        -- pass 4: folder with zero-padding normalised
        P4 AS (
            SELECT n.id, n.page, n.x0, n.y0, n.x1, n.y1, f."nBundleid", f."cBundlename", f."cBundletag"
            FROM Norm n
            JOIN Folders f ON f.fname <> '' AND n.text_norm = regexp_replace(f.fname, '(?<![0-9.])0+([0-9])', '\1', 'g')
            WHERE NOT EXISTS (SELECT 1 FROM P1 WHERE P1.id = n.id)
              AND NOT EXISTS (SELECT 1 FROM P2 WHERE P2.id = n.id)
              AND NOT EXISTS (SELECT 1 FROM P3 WHERE P3.id = n.id)
        ),
        ExhibitHits AS (
            -- passes 1 and 3 share the v1 rect shape (redirect page/line parsed from the "-N:L" suffix)
            SELECT
                page, x0, y0, x1, y1, "nBDid",
                CASE WHEN txt LIKE terms || '-%'
                     THEN SUBSTRING(txt FROM POSITION(terms || '-' IN txt) + LENGTH(terms) + 1 FOR CHAR_LENGTH(txt))
                     ELSE NULL END AS numeric_value,
                CASE WHEN txt ~ (terms || '-[0-9]+:[0-9]+')
                     THEN SUBSTRING(txt FROM POSITION(':' IN txt) + 1 FOR POSITION('/' IN txt || '/') - POSITION(':' IN txt) - 1)::int
                     ELSE NULL END AS line,
                CASE WHEN txt ~ (terms || '-[0-9]+:[0-9]+/[0-9]+:[0-9]+')
                     THEN SUBSTRING(SUBSTRING(txt FROM POSITION('/' IN txt) + 1) FROM '^[0-9]+')::int
                     ELSE NULL END AS page2,
                CASE WHEN txt ~ (terms || '-[0-9]+:[0-9]+/[0-9]+:[0-9]+')
                     THEN SUBSTRING(SUBSTRING(txt FROM POSITION('/' IN txt)) FROM ':(.*)$')::int
                     ELSE NULL END AS line2
            FROM (SELECT * FROM P1 UNION ALL SELECT * FROM P3) e
        ),
        FolderHits AS (
            SELECT * FROM P2 UNION ALL SELECT * FROM P4
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
        FROM ExhibitHits
        UNION ALL
        SELECT
            uuid_generate_v4(),
            'strikeout',
            JSONB_BUILD_ARRAY(
                JSONB_BUILD_OBJECT(
                    'x', x0,
                    'y', y0 + (y1 - y0),
                    'width', x1 - x0,
                    'height', y1 - y0,
                    'redirectpage', 1,
                    'redirectpage2', 0,
                    'redirectline', NULL,
                    'redirectline2', NULL,
                    'linktype', 'F',
                    'bundleid', "nBundleid",
                    'bundlename', "cBundlename",
                    'bundletag', "cBundletag"
                )
            ),
            '[]'::jsonb,
            page,
            now(),
            nHLid,
            true
        FROM FolderHits;
    END IF;

    OPEN ref FOR
    SELECT 1 as msg, 'Success' as value, file_path;
    RETURN ref;
END;$_$;

ALTER FUNCTION public.et_hyperlink_update_documents_v2(parameter json, ref refcursor) OWNER TO vultradmin;


-- =============================================================================
-- et_hyperlink_getfolder
--
-- Folder target of a Smart-scan hyperlink (Annotations.rects[0].linktype = 'F').
-- Given only the folder's nBundleid, returns everything the viewer needs to
-- show the hover card and to open the file explorer on that folder:
--   folder identity, its section + case, ancestor chain top-down (as
--   jAncestors, last element = the folder itself), file / subfolder counts and
--   the folder's direct files (jFiles, sorted like the explorer, max 100).
-- Permission-aware like et_bundle_parentids: folders hidden from the user via
-- BMPermission are not returned (unless the user is admin).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.et_hyperlink_getfolder(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$
DECLARE
    nMasterid uuid;
    nBundleid uuid;
    isAdmin boolean DEFAULT false;
BEGIN
    nMasterid := NULLIF(NULLIF(parameter ->>'nMasterid',''),'null')::uuid;
    nBundleid := NULLIF(NULLIF(parameter ->>'nBundleid',''),'null')::uuid;

    SELECT COALESCE("isAdmin", false) INTO isAdmin FROM "UserMaster" WHERE "nUserid" = nMasterid;

    OPEN ref FOR
    WITH RECURSIVE chain AS (
        SELECT b."nBundleid", b."nParentBundleid", b."cBundlename", b."cBundletag", b."nSectionid", 1 AS lvl
        FROM "BundleMaster" b
        LEFT JOIN "BMPermission" p ON p."nBundleid" = b."nBundleid" AND p."nUserid" = nMasterid
        WHERE b."nBundleid" = nBundleid
          AND (isAdmin OR p."nBMPid" IS NULL)
        UNION ALL
        SELECT pb."nBundleid", pb."nParentBundleid", pb."cBundlename", pb."cBundletag", pb."nSectionid", c.lvl + 1
        FROM "BundleMaster" pb
        JOIN chain c ON c."nParentBundleid" = pb."nBundleid"
    )
    SELECT
        f."nBundleid",
        f."cBundlename",
        f."cBundletag",
        f."nSectionid",
        sm."nCaseid",
        sm."cFolder"      AS "cSectionname",
        sm."cFoldertype",
        (SELECT count(*) FROM "BundleDetail" bd WHERE bd."nBundleid" = f."nBundleid" AND bd."cStatus" = 'C')::int AS "nFiles",
        (SELECT count(*) FROM "BundleMaster" c WHERE c."nParentBundleid" = f."nBundleid")::int AS "nSubfolders",
        (SELECT jsonb_agg(jsonb_build_object('nBundleid', c."nBundleid", 'cBundlename', c."cBundlename", 'cBundletag', c."cBundletag") ORDER BY c.lvl DESC)
           FROM chain c) AS "jAncestors",
        (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                    'nBundledetailid', bd."nBundledetailid", 'cFilename', bd."cFilename", 'cTab', bd."cTab",
                    'cExhibitno', bd."cExhibitno", 'cFiletype', bd."cFiletype", 'cIsindex', bd."cIsindex") ORDER BY bd.sorted_tab, bd.sorted_name), '[]'::jsonb)
           FROM (SELECT * FROM "BundleDetail" x WHERE x."nBundleid" = f."nBundleid" AND x."cStatus" = 'C' ORDER BY x.sorted_tab, x.sorted_name LIMIT 100) bd) AS "jFiles"
    FROM chain f
    JOIN "SectionMaster" sm ON sm."nSectionid" = f."nSectionid"
    WHERE f.lvl = 1;

    RETURN ref;
END;
$$;

ALTER FUNCTION public.et_hyperlink_getfolder(parameter json, ref refcursor) OWNER TO vultradmin;
