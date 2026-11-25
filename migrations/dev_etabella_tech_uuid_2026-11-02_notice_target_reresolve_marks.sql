DO $$ BEGIN IF current_database() <> 'etabella_tech_uuid' THEN RAISE EXCEPTION 'dev only'; END IF; END $$;

-- APPLIED to dev etabella_tech_uuid 2026-11-02 (user approved). Verified: akj@ RT-fact FS notices 34 case -> all 38
-- annotation with sessionId; all users 452 FS + 243 DS now annotation; FS-REMOVED keeps case. Inbox "Mark shared with you" opens Home instead of the Mark (RT QA 2026-11-02 R3).
--
-- socket-app stored the RESOLVED target as "jTarget". nt_resolve_target deliberately downgrades a Mark on a LIVE
-- session to {type:'case'} (R3-001 / R4-004: during the hearing it opens only via the Home Realtime button), so a
-- Mark shared while the session was live kept that 'case' target forever, even after the session ended and was
-- published. On dev: 452 FS + 243 DS notices (akj@: 34 FS on "Day - 03", now published).
--
-- nt_notice_target now re-resolves a share-type notice (FS, FS-LEVEL, DS, COMMENT-ADDED) whose stored jTarget is
-- the 'case' downgrade from its Mark id, so the live-session rule is decided at read time. FS-REMOVED and FD keep
-- their deliberate 'case' target (the recipient may no longer open the Mark). A notice whose Mark the recipient can
-- no longer open now resolves to NULL (hidden), the same as every other revoked target.
-- The matching socket-app change stores the requested target, so new notices do not freeze the downgrade.
--
-- Rollback: re-create the previous body (assets/sql-migrations/2026-10-08_central_notifications.up.sql, nt_notice_target).

CREATE OR REPLACE FUNCTION public.nt_notice_target(notice "Notifications")
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE target jsonb;
BEGIN
  IF notice."jTarget" IS NOT NULL
    AND NOT (notice."jTarget"->>'type'='case'
      AND upper(coalesce(notice."cType",'')) IN ('FS','FS-LEVEL','DS','COMMENT-ADDED')
      AND (notice."nFSid" IS NOT NULL OR notice."nDocid" IS NOT NULL)) THEN target:=notice."jTarget";
  ELSIF notice."nFSid" IS NOT NULL THEN target:=jsonb_build_object('type','annotation','annotationId',notice."nFSid",'sourceType','F');
  ELSIF notice."nDocid" IS NOT NULL THEN target:=jsonb_build_object('type','annotation','annotationId',notice."nDocid",'sourceType','D');
  ELSIF notice."nWebid" IS NOT NULL THEN target:=jsonb_build_object('type','annotation','annotationId',notice."nWebid",'sourceType','W');
  ELSIF notice."nBundledetailid" IS NOT NULL THEN target:=jsonb_build_object('type','document','documentId',notice."nBundledetailid");
  ELSIF notice."nUPid" IS NOT NULL THEN target:=jsonb_build_object('type','evidence','uploadId',notice."nUPid");
  ELSIF notice."nPresentid" IS NOT NULL THEN target:=jsonb_build_object('type','presentation','presentationId',notice."nPresentid");
  ELSIF notice."nCaseid" IS NOT NULL THEN target:=jsonb_build_object('type','case','caseId',notice."nCaseid");
  ELSE RETURN NULL; END IF;
  RETURN public.nt_resolve_target(notice."nUserid",target,notice."nCaseid");
END;
$function$;
