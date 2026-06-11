-- Up: per-user, per-case saved searches for the Evidence "Advanced Search" panel.
-- Adds the SavedSearch table + list/save/delete SPs (executeRef keys:
-- savedsearch_list / savedsearch_save / savedsearch_delete). Additive; no other
-- objects touched. nMasterid (owner) is injected by JwtMiddleware, never the client.
BEGIN;

CREATE TABLE IF NOT EXISTS public."SavedSearch" (
  "nSearchid"  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "nUserid"    uuid NOT NULL,
  "nCaseid"    uuid NOT NULL,
  "cName"      text NOT NULL,
  "jCriteria"  jsonb NOT NULL DEFAULT '{}'::jsonb,
  "cStatus"    char(1) NOT NULL DEFAULT 'C',     -- 'C' active, 'D' soft-deleted
  "dCreated"   timestamptz NOT NULL DEFAULT now(),
  "dModified"  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_savedsearch_user_case
  ON public."SavedSearch" ("nUserid","nCaseid","cStatus");

-- List active saved searches for the current user + case, newest first.
CREATE OR REPLACE FUNCTION public.et_savedsearch_list(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor LANGUAGE plpgsql AS $function$
DECLARE v_user uuid; v_case uuid;
BEGIN
  v_user := NULLIF(parameter->>'nMasterid','')::uuid;
  v_case := NULLIF(parameter->>'nCaseid','')::uuid;
  OPEN ref1 FOR
    SELECT "nSearchid","nCaseid","cName","jCriteria","dCreated","dModified"
    FROM public."SavedSearch"
    WHERE "nUserid" = v_user AND "nCaseid" = v_case AND "cStatus" = 'C'
    ORDER BY "dModified" DESC;
  RETURN NEXT ref1;
END;
$function$;

-- Upsert a saved search. Update by nSearchid when supplied (ownership-checked);
-- otherwise update an existing active search with the same name, else insert.
CREATE OR REPLACE FUNCTION public.et_savedsearch_save(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor LANGUAGE plpgsql AS $function$
DECLARE v_user uuid; v_case uuid; v_name text; v_crit jsonb; v_id uuid;
BEGIN
  v_user := NULLIF(parameter->>'nMasterid','')::uuid;
  v_case := NULLIF(parameter->>'nCaseid','')::uuid;
  v_name := NULLIF(trim(parameter->>'cName'), '');
  v_crit := COALESCE((parameter->>'jCriteria')::jsonb, '{}'::jsonb);
  v_id   := NULLIF(parameter->>'nSearchid','')::uuid;

  IF v_user IS NULL OR v_case IS NULL OR v_name IS NULL THEN
    OPEN ref1 FOR SELECT NULL::uuid AS "nSearchid" WHERE false;
    RETURN NEXT ref1;
    RETURN;
  END IF;

  IF v_id IS NOT NULL THEN
    UPDATE public."SavedSearch"
       SET "cName" = v_name, "jCriteria" = v_crit, "dModified" = now()
     WHERE "nSearchid" = v_id AND "nUserid" = v_user;
  ELSE
    UPDATE public."SavedSearch"
       SET "jCriteria" = v_crit, "dModified" = now()
     WHERE "nUserid" = v_user AND "nCaseid" = v_case
       AND lower("cName") = lower(v_name) AND "cStatus" = 'C'
     RETURNING "nSearchid" INTO v_id;
    IF v_id IS NULL THEN
      INSERT INTO public."SavedSearch" ("nUserid","nCaseid","cName","jCriteria")
      VALUES (v_user, v_case, v_name, v_crit)
      RETURNING "nSearchid" INTO v_id;
    END IF;
  END IF;

  OPEN ref1 FOR
    SELECT "nSearchid","nCaseid","cName","jCriteria","dCreated","dModified"
    FROM public."SavedSearch"
    WHERE "nSearchid" = v_id AND "nUserid" = v_user;
  RETURN NEXT ref1;
END;
$function$;

-- Soft-delete a saved search (ownership-checked). Returns the id + whether a row changed.
CREATE OR REPLACE FUNCTION public.et_savedsearch_delete(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor LANGUAGE plpgsql AS $function$
DECLARE v_user uuid; v_id uuid; v_cnt int;
BEGIN
  v_user := NULLIF(parameter->>'nMasterid','')::uuid;
  v_id   := NULLIF(parameter->>'nSearchid','')::uuid;
  UPDATE public."SavedSearch"
     SET "cStatus" = 'D', "dModified" = now()
   WHERE "nSearchid" = v_id AND "nUserid" = v_user AND "cStatus" = 'C';
  GET DIAGNOSTICS v_cnt = ROW_COUNT;
  OPEN ref1 FOR SELECT v_id AS "nSearchid", (v_cnt > 0) AS "deleted";
  RETURN NEXT ref1;
END;
$function$;

COMMIT;
