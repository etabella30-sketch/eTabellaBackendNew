/**
 * The share templates whose notice names its sharer in nRefuserid: a row of one of these addressed to the sharer
 * himself (a producer that listed the actor among the recipients, R3-003) is never shown or counted.
 */
export const SHARE_TEMPLATES_SQL = `('FS','FS-LEVEL','FS-REMOVED','DS','LS','CS','WS','TASK-SHARE')`;

/** Every operation shares the same fresh access check. $1 is always the verified token user. */
const visibleNotifications = (scope='') => `WITH eligible_cases AS MATERIALIZED (
  SELECT DISTINCT c."nCaseid" FROM public."TeamRelation" t JOIN public."CaseMaster" c ON c."nCaseid"=t."nCaseid"
  WHERE t."nUserid"=$1::uuid AND t."cStatus"='A' AND NOT coalesce(c."isArchived",false)
), candidates AS MATERIALIZED (
  SELECT n AS notice FROM public."Notifications" n
  WHERE n."nUserid"=$1::uuid AND NOT n."bDismissed" AND n."dDate" IS NOT NULL ${scope}
    AND (n."nCaseid" IS NULL OR n."nCaseid" IN (SELECT "nCaseid" FROM eligible_cases))
    AND NOT (upper(coalesce(n."cType",'')) IN ${SHARE_TEMPLATES_SQL} AND n."nRefuserid"=$1::uuid)
), visible AS MATERIALIZED (
  SELECT (n.notice)."nNTid" AS id,(n.notice)."bIsseen" AS seen,(n.notice)."cType" AS "sourceType",
    (n.notice)."dDate" AT TIME ZONE current_setting('TimeZone') AS "occurredAt",resolved.target,
    c."nCaseid" AS "caseId",c."cCasename" AS "caseName",
    (n.notice)."nRefuserid" AS "sharerId",NULLIF(TRIM(coalesce(ru."cFname",'')||' '||coalesce(ru."cLname",'')),'') AS "sharerName"
  FROM candidates n
  CROSS JOIN LATERAL (SELECT public.nt_notice_target(n.notice) AS target OFFSET 0) resolved
  LEFT JOIN public."CaseMaster" c ON c."nCaseid"=public.nt_uuid(resolved.target->>'caseId')
  LEFT JOIN public."UserMaster" ru ON ru."nUserid"=(n.notice)."nRefuserid" AND EXISTS (
    SELECT 1 FROM public."TeamRelation" tr WHERE tr."nUserid"=ru."nUserid" AND tr."nCaseid"=c."nCaseid" AND tr."cStatus"='A')
  WHERE resolved.target IS NOT NULL
)`;
export const VISIBLE_NOTIFICATIONS = visibleNotifications();

export const INBOX_SQL = `${VISIBLE_NOTIFICATIONS}
SELECT (SELECT count(*)::int FROM visible WHERE NOT coalesce(seen,false)) AS "unseenCount",
  coalesce((SELECT jsonb_agg(to_jsonb(page) ORDER BY page."occurredAt" DESC,page.id DESC) FROM (
    SELECT * FROM visible WHERE $3::timestamptz IS NULL OR ("occurredAt",id)<($3::timestamptz,$4::uuid)
    ORDER BY "occurredAt" DESC,id DESC LIMIT $2::int
  ) page),'[]'::jsonb) AS items`;

export const TARGET_SQL = `${visibleNotifications('AND n."nNTid"=$2::uuid')} SELECT target FROM visible WHERE id=$2::uuid`;
export const SEEN_SQL = `${visibleNotifications('AND ($2::uuid[] IS NULL OR n."nNTid"=ANY($2::uuid[]))')}
UPDATE public."Notifications" n SET "bIsseen"=true FROM visible v
WHERE n."nNTid"=v.id AND n."nUserid"=$1::uuid AND ($2::uuid[] IS NULL OR n."nNTid"=ANY($2::uuid[]))
  AND NOT coalesce(n."bIsseen",false) RETURNING n."nNTid" AS id`;
export const DISMISS_SQL = `${visibleNotifications('AND ($2::uuid[] IS NULL OR n."nNTid"=ANY($2::uuid[]))')}
UPDATE public."Notifications" n SET "bDismissed"=true FROM visible v
WHERE n."nNTid"=v.id AND n."nUserid"=$1::uuid AND ($2::uuid[] IS NULL OR n."nNTid"=ANY($2::uuid[]))
  AND NOT n."bDismissed" RETURNING n."nNTid" AS id`;
