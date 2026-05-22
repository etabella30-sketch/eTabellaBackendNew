-- 2026-05-05 — Enrich et_notification_list with bundle metadata
--
-- Why
-- ---
-- The frontend notifications dropdown (bell icon on the evidence page)
-- was redesigned to show, per share-type notification:
--
--   <Avatar>  {User} shared a {fact|doclink|weblink|document} with you
--             {filename}
--             [ {bundleTag} | {tab} | {page(s)} ]
--
-- (See: src/app/shared/components/notifications/notifications.component.html
--  in the frontend repo on branch new_selection_mode.)
--
-- The previous SP returned cFilename and cTab on the row, but in the
-- live response both came back as NULL for FS / DS / WS records. The
-- cause was the bundlesource join key:
--
--     left join "bundlesource" b on b."nBundledetailid" = n."nBundledetailid"
--
-- For fact-share / doclink-share / weblink-share notifications, the
-- "Notifications" row stores the share's reference IDs (nFSid / nDocid
-- / nWebid) but leaves "Notifications"."nBundledetailid" NULL — the
-- bundle context lives on the FactMaster / DocMaster / WebMaster row.
-- So the join above produced no match and every bundle column came
-- back NULL.
--
-- A separate gap: even when the join did fire (e.g. uploads / direct
-- document shares where n."nBundledetailid" was populated), the SELECT
-- list pulled only b."cFilename" and b."cTab". The new UI also needs
-- b."cBundletag" (e.g. "B") and b."cPage" (e.g. "43" or "43-44") to
-- render the breadcrumb, and they were never projected.
--
-- Fix
-- ---
-- 1. Coalesce the four candidate bundle-detail IDs in priority order:
--      n."nBundledetailid"   (LS = direct doc share, FU = upload, etc.)
--      fm."nBundledetailid"  (FS = fact share)
--      dm."nBundledetailid"  (DS = doclink share)
--      wm."nBundledetailid"  (WS = weblink share)
--    Use the result as the bundlesource join key.
--
-- 2. Add b."cBundletag" and b."cPage" to the SELECT list. Confirmed
--    columns on the bundlesource view from existing SPs:
--      et_filter_outgoing_docs.sql  → b.cBundletag
--      et_index_getfiles.sql        → b.cPage / b.cRefpage
--    cPage typically holds the user-facing page or range string
--    ("43" or "43-44"); the frontend treats it as a string and falls
--    back to '-' when missing.
--
-- 3. Leave the rest of the projection identical so existing consumers
--    (auth / nFSid / nDocid / nWebid / nFBundledetailid / nDBundledetailid
--    / nWBundledetailid / cPresentStatus etc.) are unaffected.
--
-- Frontend handling
-- -----------------
-- The frontend already declares cBundletag, cPage, cPageRange as
-- optional on the notification interface and renders the breadcrumb
-- only when at least one is populated. This migration is the
-- back-end half of that work — once it deploys, the bell-icon cards
-- automatically pick up the rich layout with no further frontend
-- change.
--
-- Apply with: psql ... -f 2026-05-05_notification_list_bundle_enrichment.sql

CREATE OR REPLACE FUNCTION public.et_notification_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nCaseid uuid;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid   := NULLIF(parameter ->>'nCaseid','')::uuid;

/*
select * from et_notification_list ('{"nCaseid":"...","nMasterid":"..."}','r1');
fetch all in "r1";
*/

open ref for
    select
        n."nNTid", n."nUserid", n."cTitle", n."cMsg", n."dDate", n."cStatus",
        n."nFSid", n."nDocid", n."nWebid", n."cType", n."nBundledetailid",
        fm."nBundledetailid" as "nFBundledetailid",
        dm."nBundledetailid" as "nDBundledetailid",
        wm."nBundledetailid" as "nWBundledetailid",
        b."cFilename", b."cTab", b."cBundletag", b."cPage",
        n."nUPid", up."nCaseid", n."bIsseen",
        um."cFname", um."cLname", um."cProfile",
        n."nRefuserid", n."nPresentid",
        pr."cStatus" as "cPresentStatus"
    from "Notifications" n
    left join "UserMaster"  um on um."nUserid" = n."nRefuserid"
    left join "FactMaster"  fm on fm."nFSid"   = n."nFSid"
    left join "DocMaster"   dm on dm."nDocid"  = n."nDocid"
    left join "WebMaster"   wm on wm."nWebid"  = n."nWebid"
    left join "UploadMaster" up on up."nUPid"  = n."nUPid"
    -- Coalesce the four candidate bundle-detail IDs so share-type
    -- notifications (FS/DS/WS) resolve their bundle context via the
    -- master row instead of relying on n."nBundledetailid" (which is
    -- NULL for shares).
    left join "bundlesource" b on b."nBundledetailid" = COALESCE(
        n."nBundledetailid",
        fm."nBundledetailid",
        dm."nBundledetailid",
        wm."nBundledetailid"
    )
    left join present."PresentationMaster" pr on pr."nPresentid" = n."nPresentid"
    where n."nCaseid" = nCaseid
      and n."nUserid" = nMasterid
    order by n."dDate" desc;

RETURN ref;
END;
$function$
;
