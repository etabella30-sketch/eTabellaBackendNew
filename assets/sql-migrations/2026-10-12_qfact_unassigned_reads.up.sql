-- Optional colour/Issue must not hide an ordinary Unassigned QFACT.
-- Preserve exact installed routines so rollback does not overwrite other work.
BEGIN;
CREATE TABLE IF NOT EXISTS public."QfactExpressReadBackup" (
  "cRoutine" text PRIMARY KEY, "cDefinition" text NOT NULL
);
DO $$ DECLARE r record; original text; patched text; BEGIN
  FOR r IN SELECT p.oid,n.nspname,p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE p.prokind='f' AND ((n.nspname='realtime' AND p.proname IN ('et_navigate_get_all','filter_marknav','et_fact_get_detail_single'))
      OR (n.nspname='public' AND p.proname='et_realtime_get_issue_annotation_highlight_export')) LOOP
    original:=pg_get_functiondef(r.oid);
    -- Match the colour lookup only, leaving Issue filters and access predicates intact.
    patched:=regexp_replace(original,
      '([\n\r][ \t]*)JOIN "RIssueMaster" ([a-z]+) ON ([a-z]+)\."nIid" = ([a-z]+)\."nColorid"',
      '\1LEFT JOIN "RIssueMaster" \2 ON \3."nIid" = \4."nColorid"','g');
    IF r.proname='filter_marknav' THEN
      patched:=regexp_replace(patched,'([\n\r][ \t]*)join "FMIssue" fi on fi\."nFSid" = f\."nFSid"',
        '\1left join "FMIssue" fi on fi."nFSid" = f."nFSid"','gi');
      patched:=regexp_replace(patched,'([\n\r][ \t]*)join "RIssueMaster" i on i\."nIid" = fi\."nIssueid"',
        '\1left join "RIssueMaster" i on i."nIid" = fi."nIssueid"','gi');
    END IF;
    IF patched IS DISTINCT FROM original THEN
      INSERT INTO public."QfactExpressReadBackup" VALUES(r.oid::regprocedure::text,original) ON CONFLICT DO NOTHING;
      EXECUTE patched;
    END IF;
  END LOOP;
END $$;
COMMIT;
