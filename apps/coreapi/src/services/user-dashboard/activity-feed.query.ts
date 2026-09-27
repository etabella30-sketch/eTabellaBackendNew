/**
 * Dashboard "Activity feed": what happened recently across the caller's cases
 * (eTabella angular 21 docs/dashboard-activity-feed-plan.md).
 *
 * No table logs "who did what" across the product, so this unions the tables the
 * events live in. The rule (user 2026-09-24): the caller's own activity, and other
 * people's only when it was shared with the caller.
 *  - the caller's cases       exactly the dashboard grid's rule (et_dashboard):
 *                             active TeamRelation, case not archived, no admin bypass;
 *  - case created             CaseMaster.dCreateDt / nCreateId — a case reaches the
 *                             caller by being put on its team;
 *  - documents added          BundleDetail.dCreateDt / nCreateId: the caller's own
 *                             uploads, and others' only when shared with the caller
 *                             (BDShare on the file, a folder above it or its section),
 *                             always through Case Home's attention filter (private
 *                             sections, folder / file denials); grouped per person,
 *                             folder and hour so a bulk upload is one row;
 *  - session started          RSessionMaster.dStartDt — sessions belong to the whole
 *                             case team and nobody records who starts one (no actor);
 *  - Fact / QFact captured    FactMaster, only facts the caller owns or that were
 *    and comments on them     shared with them (FMShared) — the rule comments/grid uses.
 *
 * Every source is limited to the last $5 days (the tables have no date index).
 * Timestamps are stored as server-local `timestamp`; they leave as timestamptz.
 *
 * $1 caller (uuid, from the token) · $2 row limit · $3 cursor time (timestamptz|null)
 * $4 cursor id (text|null) · $5 window in days
 */
export const ACTIVITY_FEED = `
WITH RECURSIVE my_cases AS (
  SELECT DISTINCT c."nCaseid", c."cCasename"
  FROM "TeamRelation" t
  JOIN "CaseMaster" c ON c."nCaseid" = t."nCaseid"
  WHERE t."nUserid" = $1::uuid AND t."cStatus" = 'A' AND NOT coalesce(c."isArchived", false)
), since AS (
  SELECT (now() - make_interval(days => $5::int)) AT TIME ZONE current_setting('TimeZone') AS ts
), denied_folders AS (
  SELECT p."nBundleid" FROM "BMPermission" p WHERE p."nUserid" = $1::uuid
  UNION
  SELECT b."nBundleid" FROM "BundleMaster" b
  JOIN denied_folders p ON b."nParentBundleid" = p."nBundleid"
), shared_folders AS (
  SELECT s."nBundleid" FROM "BDShare" s
  WHERE s."nUserid" = $1::uuid AND s."nBundledetailid" IS NULL AND s."nBundleid" IS NOT NULL
  UNION
  SELECT b."nBundleid" FROM "BundleMaster" b
  JOIN shared_folders s ON b."nParentBundleid" = s."nBundleid"
), added_docs AS (
  SELECT d."nBundledetailid", d."nBundleid", d."cFilename", d."cTab", d."cExhibitno", d."nCreateId", d."dCreateDt", s."nCaseid"
  FROM "BundleDetail" d
  JOIN "SectionMaster" s ON s."nSectionid" = d."nSectionid"
  JOIN my_cases mc ON mc."nCaseid" = s."nCaseid"
  WHERE d."cStatus" = 'C' AND NOT coalesce(d."cIsindex", false)
    AND d."dCreateDt" >= (SELECT ts FROM since)
    AND NOT EXISTS (SELECT 1 FROM "BDPermission" p WHERE p."nUserid" = $1::uuid AND p."nBundledetailid" = d."nBundledetailid")
    AND NOT EXISTS (SELECT 1 FROM denied_folders p WHERE p."nBundleid" = d."nBundleid")
    AND (
      s."nUserid" IS NULL OR s."nUserid" = $1::uuid
      OR EXISTS (SELECT 1 FROM shared_folders f WHERE f."nBundleid" = d."nBundleid")
      OR EXISTS (SELECT 1 FROM "BDShare" sh WHERE sh."nUserid" = $1::uuid AND sh."nBundledetailid" = d."nBundledetailid")
      OR EXISTS (SELECT 1 FROM "BDAssignment" a WHERE a."nUserid" = $1::uuid AND a."nBundledetailid" = d."nBundledetailid")
    )
    -- ...and the feed only reports it when it is the caller's own upload, or someone
    -- shared it with them: the file, a folder above it, or its whole section. Being able
    -- to open it (a team bundle, an assignment) is not enough (user 2026-09-24).
    AND (
      d."nCreateId" = $1::uuid
      OR EXISTS (SELECT 1 FROM "BDShare" sh WHERE sh."nUserid" = $1::uuid AND sh."nBundledetailid" = d."nBundledetailid")
      OR EXISTS (SELECT 1 FROM shared_folders f WHERE f."nBundleid" = d."nBundleid")
      OR EXISTS (SELECT 1 FROM "BDShare" sh WHERE sh."nUserid" = $1::uuid AND sh."nSectionid" = d."nSectionid"
                 AND sh."nBundleid" IS NULL AND sh."nBundledetailid" IS NULL)
    )
), doc_batches AS (
  SELECT a."nCaseid", a."nCreateId", a."nBundleid", date_trunc('hour', a."dCreateDt") AS hour_at,
    count(*)::int AS n, max(a."dCreateDt") AS last_at,
    (array_agg(coalesce(nullif(a."cFilename", ''), a."cTab")::text ORDER BY a."dCreateDt" DESC))[1] AS one_name,
    (array_agg(a."nBundledetailid" ORDER BY a."dCreateDt" DESC))[1] AS one_id,
    (array_agg(a."cTab"::text ORDER BY a."dCreateDt" DESC))[1] AS one_tab,
    (array_agg(a."cExhibitno"::text ORDER BY a."dCreateDt" DESC))[1] AS one_exhibit
  FROM added_docs a
  GROUP BY a."nCaseid", a."nCreateId", a."nBundleid", date_trunc('hour', a."dCreateDt")
), visible_facts AS (
  SELECT f."nFSid", f."nCaseid", f."nUserid", f."cFType", f."dCreateDt", f."nBundledetailid", f."nSesid"
  FROM "FactMaster" f
  JOIN my_cases mc ON mc."nCaseid" = f."nCaseid"
  WHERE f."nUserid" = $1::uuid
     OR EXISTS (SELECT 1 FROM "FMShared" sh WHERE sh."nFSid" = f."nFSid" AND sh."nUserid" = $1::uuid)
), events AS (
  SELECT ('case:' || c."nCaseid")::text AS id, 'case'::text AS kind, c."nCreateId"::uuid AS actor_id,
    'created case'::text AS verb, c."cCasename"::text AS target, c."dCreateDt" AS at_local,
    c."nCaseid"::uuid AS case_id, NULL::uuid AS bundle_detail_id, NULL::uuid AS fact_id,
    NULL::uuid AS session_id, 1 AS n,
    NULL::text AS doc_tab, NULL::text AS doc_name, NULL::text AS doc_exhibit, NULL::text AS session_name,
    NULL::timestamp AS batch_start
  FROM "CaseMaster" c JOIN my_cases mc ON mc."nCaseid" = c."nCaseid"
  WHERE c."dCreateDt" >= (SELECT ts FROM since)
  UNION ALL
  SELECT 'docs:' || b."nCaseid" || ':' || coalesce(b."nCreateId"::text, '-') || ':'
      || coalesce(b."nBundleid"::text, '-') || ':' || extract(epoch FROM b.hour_at)::bigint,
    'document', b."nCreateId", 'added',
    CASE WHEN b.n = 1 THEN b.one_name
      ELSE b.n || ' documents' || coalesce(' to ' || nullif(bm."cBundlename", ''), '') END,
    b.last_at, b."nCaseid", CASE WHEN b.n = 1 THEN b.one_id END, NULL, NULL, b.n,
    b.one_tab, b.one_name, b.one_exhibit, NULL, CASE WHEN b.n > 1 THEN b.hour_at END
  FROM doc_batches b LEFT JOIN "BundleMaster" bm ON bm."nBundleid" = b."nBundleid"
  UNION ALL
  SELECT 'ses:' || r."nSesid", 'session', NULL, 'session started', r."cName"::text, r."dStartDt",
    r."nCaseid", NULL, NULL, r."nSesid", 1,
    NULL, NULL, NULL, r."cName"::text, NULL
  FROM "RSessionMaster" r JOIN my_cases mc ON mc."nCaseid" = r."nCaseid"
  -- A deleted session carries dDelDt (a separate deleted flag exists only on some databases).
  WHERE r."dDelDt" IS NULL
    AND coalesce(r."cStatus", 'P') <> 'P' AND coalesce(r."cSType", '') <> 'D'
    AND r."dStartDt" >= (SELECT ts FROM since)
    AND r."dStartDt" <= now() AT TIME ZONE current_setting('TimeZone')
  UNION ALL
  SELECT 'fact:' || f."nFSid", 'fact', f."nUserid",
    CASE WHEN f."cFType" = 'QF' THEN 'captured a QFact on' ELSE 'captured a Fact on' END,
    coalesce(nullif(bd."cExhibitno", ''), nullif(bd."cTab", ''), nullif(bd."cFilename", ''), rs."cName", 'a document')::text,
    f."dCreateDt", f."nCaseid", f."nBundledetailid", f."nFSid", f."nSesid", 1,
    bd."cTab"::text, coalesce(nullif(bd."cFilename", ''), bd."cTab")::text, bd."cExhibitno"::text, rs."cName"::text, NULL
  FROM visible_facts f
  LEFT JOIN "BundleDetail" bd ON bd."nBundledetailid" = f."nBundledetailid"
  LEFT JOIN "RSessionMaster" rs ON rs."nSesid" = f."nSesid"
  WHERE f."cFType" IN ('F', 'QF') AND f."dCreateDt" >= (SELECT ts FROM since)
  UNION ALL
  SELECT 'cmt:' || cm."nCid", 'comment', cm."nUserid", 'commented on',
    coalesce(nullif(bd."cExhibitno", ''), nullif(bd."cTab", ''), nullif(bd."cFilename", ''), rs."cName", 'a Fact')::text,
    cm."dCreateDt", f."nCaseid", f."nBundledetailid", f."nFSid", f."nSesid", 1,
    bd."cTab"::text, coalesce(nullif(bd."cFilename", ''), bd."cTab")::text, bd."cExhibitno"::text, rs."cName"::text, NULL
  FROM realtime."Comments" cm
  JOIN visible_facts f ON f."nFSid" = cm."nFSid"
  LEFT JOIN "BundleDetail" bd ON bd."nBundledetailid" = f."nBundledetailid"
  LEFT JOIN "RSessionMaster" rs ON rs."nSesid" = f."nSesid"
  WHERE cm."dDelDt" IS NULL AND cm."dCreateDt" >= (SELECT ts FROM since)
), stamped AS (
  SELECT e.*, (e.at_local AT TIME ZONE current_setting('TimeZone')) AS occurred_at FROM events e
)
SELECT s.id, s.kind, s.actor_id AS "actorId",
  nullif(trim(concat_ws(' ', u."cFname", u."cLname")), '') AS "actorName",
  s.verb, s.target, s.occurred_at AS "occurredAt",
  s.case_id AS "caseId", mc."cCasename" AS "caseName",
  s.bundle_detail_id AS "bundleDetailId", s.fact_id AS "factId", s.session_id AS "sessionId",
  s.n AS "count",
  -- What a click opens: the document (tab / name / exhibit), the transcript (session name),
  -- or, for a bulk upload, the hour it happened in.
  s.doc_tab AS "docTab", s.doc_name AS "docName", s.doc_exhibit AS "docExhibit",
  s.session_name AS "sessionName",
  (s.batch_start AT TIME ZONE current_setting('TimeZone')) AS "batchStart"
FROM stamped s
JOIN my_cases mc ON mc."nCaseid" = s.case_id
LEFT JOIN "UserMaster" u ON u."nUserid" = s.actor_id
WHERE $3::timestamptz IS NULL OR (s.occurred_at, s.id) < ($3::timestamptz, coalesce($4::text, ''))
ORDER BY s.occurred_at DESC, s.id DESC
LIMIT $2::int
`;

/** How far back the feed reaches (plan decision F4). */
export const ACTIVITY_WINDOW_DAYS = 90;
/** Rows per page, and the most a caller may ask for. */
export const ACTIVITY_PAGE_DEFAULT = 30;
export const ACTIVITY_PAGE_MAX = 50;
