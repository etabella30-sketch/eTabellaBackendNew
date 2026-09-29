-- 2026-09-15 -- port PROD-only change to DEV: roman-numeral bundle ordering (applied by hand on
-- etabella.com.uuid on 2026-09-01, SQL recovered from that session). Makes dev the superset so the
-- prod consolidation script can be generated from the dev catalog alone.
--   1. public.roman_to_int(text)      NEW helper (strict grammar, NULL when not roman)
--   2. public.et_bundles              prod roman version MERGED with dev's extra columns
--                                     (nFileCount, nFileCountDescendant, nHierarchyDepth, bHasChildren)
--   3. public.et_index_getfiles       prod final version verbatim (roman_flag + tag_stats + cStatus='C')
-- Rollback: 2026-09-15_port_prod_roman_ordering.down.sql (restores dev bodies, drops helper)
DO $g$ BEGIN
  IF current_database() <> 'etabella_tech_uuid' THEN
    RAISE EXCEPTION 'ABORT: this port targets dev etabella_tech_uuid only, got %', current_database();
  END IF;
END $g$;

-- Helper: strict roman -> int, NULL when not valid roman (identical to prod)
CREATE OR REPLACE FUNCTION public.roman_to_int(roman text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $function$
DECLARE
    r text;
    total int := 0;
    i int;
    cur int;
    nxt int;
BEGIN
    IF roman IS NULL THEN
        RETURN NULL;
    END IF;

    r := upper(trim(roman));

    -- strict roman grammar, 1..3999
    IF r = '' OR r !~ '^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$' THEN
        RETURN NULL;
    END IF;

    FOR i IN 1..length(r) LOOP
        cur := CASE substring(r from i for 1)
                   WHEN 'I' THEN 1 WHEN 'V' THEN 5 WHEN 'X' THEN 10
                   WHEN 'L' THEN 50 WHEN 'C' THEN 100 WHEN 'D' THEN 500
                   WHEN 'M' THEN 1000
               END;
        IF i < length(r) THEN
            nxt := CASE substring(r from i + 1 for 1)
                       WHEN 'I' THEN 1 WHEN 'V' THEN 5 WHEN 'X' THEN 10
                       WHEN 'L' THEN 50 WHEN 'C' THEN 100 WHEN 'D' THEN 500
                       WHEN 'M' THEN 1000
                   END;
        ELSE
            nxt := 0;
        END IF;

        IF cur < nxt THEN
            total := total - cur;
        ELSE
            total := total + cur;
        END IF;
    END LOOP;

    RETURN total;
END;
$function$;

-- et_bundles: PROD roman-aware ordering (2026-09-01) + dev columns nFileCount/nFileCountDescendant/nHierarchyDepth/bHasChildren (2026-05-20)
CREATE OR REPLACE FUNCTION public.et_bundles(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;pageNumber int;offsetCount int;perPage int default 2000;nSectionid uuid;nBundleid uuid;
isAdmin boolean default false;
BEGIN
nMasterid := (parameter ->>'nMasterid')::uuid;
pageNumber := coalesce((parameter ->>'pageNumber')::int, 1);
offsetCount := (pageNumber - 1) * perPage;
nBundleid := coalesce((parameter ->>'nBundleid')::uuid, null);
nSectionid := (parameter ->>'nSectionid')::uuid;

	select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nMasterid;

OPEN ref1 FOR
with base as
(
    select b."nBundleid",
           coalesce(b."nParentBundleid", null) "nParentBundleid",
           b."cBundlename",
           b."cBundletag",
           b."nFileCount",
           b."nFileCountDescendant",
           b."nHierarchyDepth",
           EXISTS (
             SELECT 1 FROM "BundleMaster" c WHERE c."nParentBundleid" = b."nBundleid"
           ) AS "bHasChildren",
           split_hierarchical_sort_multi(b."cBundletag", ARRAY['.', '-'])  tag_parts,
           split_hierarchical_sort_multi(b."cBundlename", ARRAY['.', '-']) name_parts
    from "BundleMaster" b
    left join "BMPermission" p on p."nUserid" = nMasterid and p."nBundleid" = b."nBundleid"
    where case when isAdmin then true else p."nBMPid" is null end
      and b."nSectionid" = nSectionid
      and case when nBundleid is not null then b."nParentBundleid" = nBundleid else b."nParentBundleid" is null end
),
flags as
(
    -- roman sort kicks in ONLY when every non-empty first segment in this
    -- result set is a valid roman numeral (protects A/B/C, CCC-1, R-2 tags)
    select coalesce(bool_and(roman_to_int(tag_parts[1])  is not null) filter (where tag_parts[1]  <> ''), false) tags_all_roman,
           coalesce(bool_and(roman_to_int(name_parts[1]) is not null) filter (where name_parts[1] <> ''), false) names_all_roman
    from base
),
bundle as
(
    select ROW_NUMBER() OVER(ORDER BY
               case when f.tags_all_roman and roman_to_int(b.tag_parts[1]) is not null
                    then array_cat(ARRAY[lpad(roman_to_int(b.tag_parts[1])::text, 10, '0')], b.tag_parts[2:])
                    else b.tag_parts
               end,
               case when f.names_all_roman and roman_to_int(b.name_parts[1]) is not null
                    then array_cat(ARRAY[lpad(roman_to_int(b.name_parts[1])::text, 10, '0')], b.name_parts[2:])
                    else b.name_parts
               end
           ) serial,
           b."nBundleid", b."nParentBundleid", b."cBundlename", b."cBundletag",
           b."nFileCount", b."nFileCountDescendant", b."nHierarchyDepth", b."bHasChildren"
    from base b
    cross join flags f
)
select * from bundle
order by serial
LIMIT perPage
OFFSET offsetCount
;
RETURN NEXT ref1;

END;
$function$;

CREATE OR REPLACE FUNCTION public.et_index_getfiles(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid UUID;
    nCaseid UUID;
    nSectionid UUID;
    oldPath TEXT;
    nBundledetailid UUID;
    ZeroUUID UUID := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
    -- Apply P-1: Blank string → NULL conversion with explicit UUID casting
    nCaseid := NULLIF(parameter->>'nCaseid', '')::uuid;
    nMasterid := NULLIF(parameter->>'nMasterid', '')::uuid;
    nSectionid := NULLIF(parameter->>'nSectionid', '')::uuid;

    SELECT "cPath", "nBundledetailid" INTO oldPath, nBundledetailid 
    FROM "BundleDetail" 
    WHERE "nSectionid" = nSectionid AND "cIsindex" = true;

    DELETE FROM "Annotations" a 
    WHERE "nHLid" IN (
        SELECT "nHLid" FROM "HyperLink" 
        WHERE "nBundledetailid" = nBundledetailid
    );

    OPEN ref1 FOR 
    SELECT 
        "nCaseid", "cCasename", "cCaseno", "dCreateDt", "cClaimant", 
        "cRespondent", "cIndexheader", oldPath AS "oldPath"
    FROM "CaseMaster"
    WHERE "nCaseid" = nCaseid;

    RETURN NEXT ref1;

    OPEN ref2 FOR
    SELECT 
        "nBundledetailid", t."nBundleid", "cFilename"::text,
        "cTab"::text, "cExhibitno"::text, "cRefpage"::text, 
        "dIntrestDt"::text, "cDescription"::text, "cAuthor"::text,
        array_to_string(t.sub_info, ' / ') AS sub_info,
        t.kind::text, t."cBundletag"::text, t."nParentBundleid" 
    FROM (
        WITH RECURSIVE roman_flag AS (
            -- roman sort kicks in ONLY when every non-empty first segment of the
            -- TOP-LEVEL siblings is a valid roman numeral (protects A/B/C, CCC, R tags)
            SELECT
                coalesce(bool_and(roman_to_int((bm.sorted_bundletag)[1]) IS NOT NULL)
                         FILTER (WHERE coalesce((bm.sorted_bundletag)[1], '') <> ''), false) AS tags_all_roman,
                coalesce(bool_and(roman_to_int((bm.sorted_name)[1]) IS NOT NULL)
                         FILTER (WHERE coalesce((bm.sorted_name)[1], '') <> ''), false) AS names_all_roman
            FROM "BundleMaster" bm
            JOIN "SectionMaster" sm ON sm."nSectionid" = bm."nSectionid"
            WHERE (bm."nParentBundleid" = ZeroUUID OR bm."nParentBundleid" IS NOT DISTINCT FROM NULL)
              AND sm."nCaseid" = nCaseid AND bm."nSectionid" = nSectionid
        ),
        tag_stats AS (
            -- how many siblings share the same reference under each parent:
            -- a folder's tag is used for ordering only when it is a REAL unique
            -- reference (non-empty, differs from parent, unique among siblings)
            SELECT "nParentBundleid" pid, "cBundletag" tag, count(*) cnt
            FROM "BundleMaster"
            WHERE "nSectionid" = nSectionid
            GROUP BY "nParentBundleid", "cBundletag"
        ),
        bdl_tree AS (
            SELECT 
                bm."nBundleid", bm."cBundlename"::text AS "cBundlename", bm."nParentBundleid",
                ARRAY[bm."cBundlename"::text] AS sub_info, bm."nSectionid", bm."cBundletag",
                CASE WHEN f.tags_all_roman AND roman_to_int((bm.sorted_bundletag)[1]) IS NOT NULL
                     THEN array_cat(ARRAY[lpad(roman_to_int((bm.sorted_bundletag)[1])::text, 10, '0')], (bm.sorted_bundletag)[2:])
                     ELSE bm.sorted_bundletag
                END AS sorted_bundletag,
                CASE WHEN f.names_all_roman AND roman_to_int((bm.sorted_name)[1]) IS NOT NULL
                     THEN array_cat(ARRAY[lpad(roman_to_int((bm.sorted_name)[1])::text, 10, '0')], (bm.sorted_name)[2:])
                     ELSE bm.sorted_name
                END AS sorted_name
            FROM "BundleMaster" bm
            JOIN "SectionMaster" sm ON sm."nSectionid" = bm."nSectionid"
            CROSS JOIN roman_flag f
            WHERE (bm."nParentBundleid" = ZeroUUID OR bm."nParentBundleid"  IS NOT DISTINCT FROM NULL) AND sm."nCaseid" = nCaseid AND bm."nSectionid" = nSectionid
            
            UNION ALL
            
            SELECT 
                c."nBundleid", c."cBundlename", c."nParentBundleid",                
                p.sub_info || c."cBundlename"::text, c."nSectionid", c."cBundletag",
                p.sorted_bundletag ||
                    CASE WHEN coalesce(c."cBundletag", '') <> ''
                          AND c."cBundletag" IS DISTINCT FROM p."cBundletag"
                          AND ts.cnt = 1
                         THEN c.sorted_bundletag
                         ELSE c.sorted_name
                    END,
                p.sorted_name || c.sorted_name
            FROM "BundleMaster" c
            JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"
            LEFT JOIN tag_stats ts ON ts.pid = c."nParentBundleid" AND ts.tag IS NOT DISTINCT FROM c."cBundletag"
        )
        SELECT 
            NULL AS "nBundledetailid", t."nBundleid", t."cBundlename"::text AS "cFilename",
            t."cBundlename"::text AS "cTab", ''::text AS "cExhibitno", ''::text AS "cRefpage",
                ''::text AS "dIntrestDt", ''::text AS "cDescription", ''::text AS "cAuthor", t.sub_info,''::text kind,t."cBundletag", t."nParentBundleid",sorted_bundletag as sorted_tab,sorted_name
        FROM bdl_tree t
        LEFT JOIN bundlesource b ON t."nBundleid" = b."nBundleid"
		 WHERE case when (t."nParentBundleid" IS NULL OR t."nParentBundleid" = '00000000-0000-0000-0000-000000000000') then true else b."nBundleid"  IS DISTINCT FROM NULL end
        GROUP BY 
            t."nBundleid", t."nParentBundleid", t."cBundlename", t.sub_info, 
            t."cBundletag", sorted_bundletag, sorted_name
            
        UNION ALL
        
        SELECT 
            bd."nBundledetailid", NULL AS "nBundleid", 
            REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '')::text AS "cFilename",
            bd."cTab"::text, 
            TRIM(REPLACE(REPLACE(COALESCE(bd."cExhibitno", ''), E'\n', ''), E'\r', ''))::text AS "cExhibitno",
            COALESCE(bd."cRefpage", '')::text, COALESCE(bd."dIntrestDt", '')::text AS "dIntrestDt",
            COALESCE(bd."cDesc", '')::text AS "cDescription", COALESCE(bd."cAuthor", '')::text AS "cAuthor", 
            p.sub_info || (CASE WHEN COALESCE(bd."cTab"::text,'') = '' THEN bd."cFilename"::text ELSE bd."cTab"::text END),
            "cFiletype"::text AS kind, p."cBundletag", NULL AS "nParentBundleid", 
            p.sorted_bundletag || COALESCE(bd.sorted_tab, bd.sorted_name),
            p.sorted_name || bd.sorted_name
        FROM "BundleDetail" bd
        JOIN bdl_tree p ON bd."nBundleid" = p."nBundleid"
        WHERE bd."cStatus" = 'C'
    ) t 
    ORDER BY sorted_tab nulls first,sorted_name nulls first;

    RETURN NEXT ref2;    
     
    OPEN ref3 FOR 
    WITH tm AS (
        SELECT DISTINCT 
            bd."nBundledetailid", 
            REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '') AS "cFilename",
            TRIM(REPLACE(REPLACE(COALESCE(bd."cExhibitno", ''), E'\n', ''), E'\r', '')) AS "cExhibitno",
            "nSectionid", COALESCE(bd."cRefpage", '') AS "cRefpage", 
            TRIM(COALESCE(bd."cTab", '')) AS "cTab",
            COALESCE(bd."dIntrestDt", '')::text AS "dIntrestDt", 
            COALESCE(bd."cDesc", '')::text AS "cDescription", 
            COALESCE(bd."cAuthor", '')::text AS "cAuthor",
            "cFiletype"::text AS kind, sorted_tab, sorted_name
        FROM "BundleDetail" bd
        WHERE 
            COALESCE(bd."nBundleid", ZeroUUID) = ZeroUUID 
            AND bd."nSectionid" = nSectionid 
            AND bd."cIsindex" != true
            AND bd."cStatus" = 'C'
        ORDER BY sorted_tab NULLS FIRST, sorted_name NULLS FIRST
    ) 
    SELECT 
        "nBundledetailid", "cFilename", "cExhibitno", "nSectionid", 
        "cRefpage", "cTab", "dIntrestDt", "cDescription", "cAuthor", "kind"
    FROM tm;
    
    RETURN NEXT ref3;
END;
$function$;
