-- 2026-09-14_home_bundle_sizes_team_users.up.sql
--
-- Two Case Home additions:
--
-- 1. NEW et_case_bundle_sizes(parameter json, ref refcursor)
--    Feeds the "Total bundle size" tile's modal: one row per TOP-LEVEL Master
--    Bundle folder (A, B, C…) with its document count and byte total, counted
--    through every sub-folder, plus one trailing row (nBundleid NULL) for the
--    documents filed at the Master Bundle root outside any bundle (omitted when
--    there are none).
--
--    Same population as et_activity_bundledata (the tile's Total documents):
--    SectionMaster.cFoldertype = 'MB', BundleDetail.cStatus = 'C', index files
--    excluded, orphaned documents (bundle row gone) excluded. NOT permission
--    filtered, like that SP. Bytes come from BundleDetail."cFilesize" (varchar
--    holding bytes, sometimes with a fraction, sometimes blank) — non-numeric
--    values count as 0, so the sum can only ever UNDER-state.
--
--    Params: nCaseid (uuid). ~0.6 s on the largest dev case (77k docs).
--
-- 2. PATCH et_common_my_team_user (GET coreapi/common/myteamusers)
--    Adds cEmail, nRoleid, cRole, nTeamid, cTeamname, cClr to the row so Home's
--    "Team users" tile can list the caller's team with roles and e-mails.
--    Existing columns and their order are unchanged (the Fact "Share with my
--    team" picker keeps working). The team lookup becomes IN (…) so a user in
--    two teams of one case no longer errors the whole call.
--
-- Pure SP changes: no service restart needed for the patch. The NEW SP is
-- exposed by a new coreapi route (caseactivity/getBundlesizes) -> restart
-- coreapi after deploying that code.

-- Safety guard: refuse to run against prod by accident (apply to dev etabella_tech_uuid first).
DO $guard$
BEGIN
    IF current_database() = 'etabella.com.uuid' THEN
        RAISE EXCEPTION 'Refusing to run on prod database % - apply via the release runbook', current_database();
    END IF;
END
$guard$;

BEGIN;

CREATE OR REPLACE FUNCTION public.et_case_bundle_sizes(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nCaseid uuid;
BEGIN
    nCaseid := NULLIF(parameter ->> 'nCaseid', '')::uuid;
    /*
    select * from et_case_bundle_sizes('{"nCaseid":"cef90edb-2dd2-4802-9258-62e7592f8852"}','r'); fetch all in "r";
    */

    OPEN ref FOR
    WITH RECURSIVE roots AS (
        -- Top-level folders of the case's Master Bundle section(s).
        SELECT bm."nBundleid", bm."cBundletag", bm."cBundlename", bm."sorted_bundletag"
        FROM "BundleMaster" bm
        JOIN "SectionMaster" s ON s."nSectionid" = bm."nSectionid" AND s."cFoldertype" = 'MB'
        WHERE s."nCaseid" = nCaseid
          AND bm."nParentBundleid" IS NULL
    ), tree AS (
        -- Every folder under each root, tagged with its root.
        SELECT r."nBundleid" AS root, r."nBundleid"
        FROM roots r
        UNION ALL
        SELECT t.root, c."nBundleid"
        FROM "BundleMaster" c
        JOIN tree t ON c."nParentBundleid" = t."nBundleid"
    ), docs AS (
        -- The documents the Total documents tile counts.
        SELECT b."nBundledetailid", b."nBundleid",
               CASE WHEN b."cFilesize" ~ '^[0-9]+(\.[0-9]+)?$' THEN b."cFilesize"::numeric ELSE 0 END AS bytes
        FROM "BundleDetail" b
        JOIN "SectionMaster" s ON s."nSectionid" = b."nSectionid" AND s."cFoldertype" = 'MB'
        WHERE s."nCaseid" = nCaseid
          AND b."cStatus" = 'C'
          AND b."cIsindex" = false
    ), agg AS (
        SELECT t.root,
               count(DISTINCT d."nBundledetailid") AS docs,
               sum(d.bytes) AS bytes
        FROM tree t
        JOIN docs d ON d."nBundleid" = t."nBundleid"
        GROUP BY t.root
    ), rows_ AS (
        SELECT 0 AS "nSort", r."sorted_bundletag",
               r."nBundleid", r."cBundletag", r."cBundlename",
               coalesce(a.docs, 0)::bigint AS "nDocs",
               coalesce(a.bytes, 0)::bigint AS "nBytes"
        FROM roots r
        LEFT JOIN agg a ON a.root = r."nBundleid"
        UNION ALL
        -- Filed at the Master Bundle root, in no bundle at all.
        SELECT 1, NULL, NULL::uuid, NULL::varchar, NULL::varchar,
               count(DISTINCT d."nBundledetailid")::bigint,
               coalesce(sum(d.bytes), 0)::bigint
        FROM docs d
        WHERE d."nBundleid" IS NULL
        HAVING count(*) > 0
    )
    SELECT "nBundleid", "cBundletag", "cBundlename", "nDocs", "nBytes"
    FROM rows_
    ORDER BY "nSort", "sorted_bundletag" NULLS LAST, "cBundletag", "cBundlename";

    RETURN ref;
END;
$function$;

CREATE OR REPLACE FUNCTION public.et_common_my_team_user(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid UUID;
    nCaseid UUID;
    nTeamid UUID;
    ZeroUUID UUID := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
    -- Apply P-1: Blank string → NULL conversion with explicit UUID casting
    nMasterid := NULLIF(parameter ->>'nMasterid', '')::uuid;
    nCaseid := NULLIF(parameter ->>'nCaseid', '')::uuid;
    -- select * from "RoleMaster"

    -- 2026-09-14: + cEmail / nRoleid / cRole / nTeamid / cTeamname / cClr for
    -- Case Home's "Team users" list; the team lookup tolerates a caller who
    -- sits in more than one team of the case. Existing columns unchanged.
    OPEN ref1 FOR
    SELECT u."nUserid", u."cFname", u."cLname", u."cProfile",
           case when u."isAdmin" or rm."nSrno" = 1 then true else false end "isAdmin",
           u."cEmail", tr."nRoleid", rm."cRole", tr."nTeamid", tm."cTeamname", tm."cClr"
    FROM "UserMaster" u
    JOIN "TeamRelation" tr ON tr."nCaseid" = nCaseid AND tr."nUserid" = u."nUserid"
    JOIN "RoleMaster" rm ON rm."nRoleid" = tr."nRoleid"
    LEFT JOIN "TeamMaster" tm ON tm."nTeamid" = tr."nTeamid"
    WHERE tr."nTeamid" IN (
        SELECT "nTeamid"
        FROM "TeamRelation"
        WHERE "nCaseid" = nCaseid AND "nUserid" = nMasterid
    )
    ORDER BY u."cFname", u."cLname";

    RETURN NEXT ref1;
END;
$function$;

COMMIT;
