-- User × Case capability state. Apply before deploying the matching coreapi/FE.
-- Existing account preferences seed existing case memberships once. Mode switches never update UserMaster.
BEGIN;
DO $guard$ BEGIN
  IF current_database() <> 'etabella_tech_uuid' THEN
    RAISE EXCEPTION 'Apply this migration on dev etabella_tech_uuid first; production uses the release runbook';
  END IF;
END $guard$;

CREATE TABLE IF NOT EXISTS public."UserCaseUiMode" (
  "nUserid" uuid NOT NULL REFERENCES public."UserMaster"("nUserid") ON DELETE CASCADE,
  "nCaseid" uuid NOT NULL REFERENCES public."CaseMaster"("nCaseid") ON DELETE CASCADE,
  "cUIMode" varchar(1) NOT NULL DEFAULT 'E' CHECK ("cUIMode" IN ('E', 'A')),
  "dUpdateDt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("nUserid", "nCaseid")
);
INSERT INTO public."UserCaseUiMode" ("nUserid", "nCaseid", "cUIMode")
SELECT DISTINCT t."nUserid", t."nCaseid", CASE WHEN u."cUIMode" = 'A' THEN 'A' ELSE 'E' END
FROM public."TeamRelation" t JOIN public."UserMaster" u ON u."nUserid" = t."nUserid"
JOIN public."CaseMaster" c ON c."nCaseid" = t."nCaseid"
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.et_user_case_uimode_get(parameter json, ref refcursor)
RETURNS refcursor LANGUAGE plpgsql AS $fn$
DECLARE actor uuid := NULLIF(parameter->>'nMasterid','')::uuid;
  case_id uuid := NULLIF(parameter->>'nCaseid','')::uuid;
BEGIN
  IF actor IS NULL OR case_id IS NULL
    OR NOT EXISTS (SELECT 1 FROM "CaseMaster" WHERE "nCaseid" = case_id) OR NOT EXISTS (
    SELECT 1 FROM "TeamRelation" WHERE "nUserid" = actor AND "nCaseid" = case_id AND "cStatus" = 'A'
    UNION ALL SELECT 1 FROM "UserMaster" WHERE "nUserid" = actor AND "isAdmin" = true
  ) THEN
    OPEN ref FOR SELECT -1 AS msg, 'Case access is required' AS value, NULL::text AS "cUIMode";
    RETURN ref;
  END IF;
  OPEN ref FOR SELECT 1 AS msg, 'Case mode' AS value,
    COALESCE((SELECT "cUIMode"::text FROM "UserCaseUiMode" WHERE "nUserid" = actor AND "nCaseid" = case_id), 'E') AS "cUIMode";
  RETURN ref;
END $fn$;

CREATE OR REPLACE FUNCTION public.et_user_case_uimode_set(parameter json, ref refcursor)
RETURNS refcursor LANGUAGE plpgsql AS $fn$
DECLARE actor uuid := NULLIF(parameter->>'nMasterid','')::uuid;
  case_id uuid := NULLIF(parameter->>'nCaseid','')::uuid;
  mode text := parameter->>'cUIMode';
BEGIN
  IF actor IS NULL OR case_id IS NULL OR mode NOT IN ('E','A') OR mode IS NULL
    OR NOT EXISTS (SELECT 1 FROM "CaseMaster" WHERE "nCaseid" = case_id)
    OR NOT EXISTS (
      SELECT 1 FROM "TeamRelation" WHERE "nUserid" = actor AND "nCaseid" = case_id AND "cStatus" = 'A'
      UNION ALL SELECT 1 FROM "UserMaster" WHERE "nUserid" = actor AND "isAdmin" = true
    ) THEN
    OPEN ref FOR SELECT -1 AS msg, 'A valid mode and current case access are required' AS value, NULL::text AS "cUIMode";
    RETURN ref;
  END IF;
  INSERT INTO "UserCaseUiMode" ("nUserid", "nCaseid", "cUIMode") VALUES (actor, case_id, mode)
    ON CONFLICT ("nUserid", "nCaseid") DO UPDATE SET "cUIMode" = EXCLUDED."cUIMode", "dUpdateDt" = now();
  OPEN ref FOR SELECT 1 AS msg, 'Case mode updated' AS value,
    "cUIMode" FROM "UserCaseUiMode" WHERE "nUserid" = actor AND "nCaseid" = case_id;
  RETURN ref;
END $fn$;
COMMIT;
