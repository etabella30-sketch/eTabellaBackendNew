-- RT Simulation document source (2026-09-25)
--
-- ONE case, chosen by a super admin in Admin > Cases > Case Detail ("Use as RT Simulation
-- document source"), whose documents the RT page's demo mode opens for {A2-3}-style links.
-- Choosing it grants NO access to the case: nobody is added to its team. The read-only
-- coreapi route GET rt-demo/document resolves one document server-side via
-- et_rt_sim_source_resolve; the client never sends or learns the case id.
--
-- Storage: one-row public."AppSetting" (no app-wide settings table exists; UserSetting is
-- per user + case). The foreign key clears the choice when the case is hard-deleted.
-- Only one case can ever be the source: turning one on replaces the other under a row lock.
--
-- SPs: et_rt_sim_source_get / et_rt_sim_source_set  (coreapi admin-dashboard/rtsimsource,
--      super admin; both re-check "UserMaster"."isAdmin" because the request's admin flag
--      is a sign-in-time Redis copy), et_rt_sim_source_resolve (rt-demo/document).
-- Audit: one "LogCaseMaster" row per case switched on/off, category 'RT Simulation source'.
--
-- coreapi gains routes + DTOs -> restart coreapi after applying.
-- DEV ONLY: refuses to run anywhere but etabella_tech_uuid.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'ABORT: dev-only migration targets etabella_tech_uuid, got %', current_database();
    END IF;
END
$guard$;

CREATE TABLE IF NOT EXISTS public."AppSetting" (
    "nAppSettingid" smallint NOT NULL DEFAULT 1,
    "nRTSimCaseid"  uuid NULL,
    "nUpdateId"     uuid NULL,
    "dUpdateDt"     timestamp without time zone NULL,
    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("nAppSettingid"),
    CONSTRAINT "AppSetting_singleton_chk" CHECK ("nAppSettingid" = 1),
    CONSTRAINT "AppSetting_nRTSimCaseid_fkey" FOREIGN KEY ("nRTSimCaseid")
        REFERENCES public."CaseMaster" ("nCaseid") ON DELETE SET NULL
);

INSERT INTO public."AppSetting" ("nAppSettingid") VALUES (1)
ON CONFLICT ("nAppSettingid") DO NOTHING;

COMMENT ON TABLE public."AppSetting" IS
  'Application-wide settings; exactly one row (nAppSettingid = 1). Written by super admins only.';
COMMENT ON COLUMN public."AppSetting"."nRTSimCaseid" IS
  'Case whose documents the RT Simulation (RT page demo mode) opens for document links. NULL = none. Grants no case access.';

-- Audit category. LogCategory has no PK; its sequence default may trail explicit ids.
DO $cat$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public."LogCategory" WHERE "cCategory" = 'RT Simulation source') THEN
        IF to_regclass('public."LogCategory_nLCatid_seq"') IS NOT NULL THEN
            PERFORM setval('public."LogCategory_nLCatid_seq"',
                GREATEST((SELECT COALESCE(MAX("nLCatid"), 0) FROM public."LogCategory"),
                         (SELECT last_value FROM public."LogCategory_nLCatid_seq"), 1));
            INSERT INTO public."LogCategory" ("cCategory") VALUES ('RT Simulation source');
        ELSE
            INSERT INTO public."LogCategory" ("nLCatid", "cCategory")
            SELECT COALESCE(MAX("nLCatid"), 0) + 1, 'RT Simulation source' FROM public."LogCategory";
        END IF;
    END IF;
END
$cat$;

--------------------------------------------------------------------------
-- et_rt_sim_source_get: GET coreapi admin-dashboard/rtsimsource
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rt_sim_source_get(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_master uuid;
BEGIN
    v_master := NULLIF(parameter ->> 'nMasterid', '')::uuid;
    /*
    select * from et_rt_sim_source_get('{"nMasterid":"<admin uuid>"}','r1');fetch all in "r1";
    */
    IF NOT EXISTS (SELECT 1 FROM "UserMaster" WHERE "nUserid" = v_master AND "isAdmin" = true) THEN
        OPEN ref FOR SELECT -1 AS msg, 'Admin rights required' AS value, NULL::uuid AS "nCaseid";
        RETURN ref;
    END IF;

    OPEN ref FOR
        SELECT 1 AS msg, 'RT Simulation source' AS value,
               s."nRTSimCaseid" AS "nCaseid",
               c."cCasename", c."cCaseno",
               coalesce(c."isArchived", false) AS "isArchived",
               s."dUpdateDt", s."nUpdateId"
          FROM "AppSetting" s
          LEFT JOIN "CaseMaster" c ON c."nCaseid" = s."nRTSimCaseid"
         WHERE s."nAppSettingid" = 1;
    RETURN ref;
END;
$function$;

--------------------------------------------------------------------------
-- et_rt_sim_source_set: POST coreapi admin-dashboard/rtsimsource {nCaseid, bEnabled}
--   bEnabled = true  -> this case becomes THE source (any other is replaced in the same step)
--   bEnabled = false -> clears the source only while this case IS the source
-- Returns the resulting source with its name + number.
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rt_sim_source_set(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_master  uuid;
    v_case    uuid;
    v_enabled boolean;
    v_prev    uuid;
    v_next    uuid;
    v_cat     bigint;
BEGIN
    v_master  := NULLIF(parameter ->> 'nMasterid', '')::uuid;
    v_case    := NULLIF(parameter ->> 'nCaseid', '')::uuid;
    v_enabled := NULLIF(parameter ->> 'bEnabled', '')::boolean;
    /*
    select * from et_rt_sim_source_set('{"nMasterid":"<admin>","nCaseid":"<case>","bEnabled":true}','r1');fetch all in "r1";
    */
    IF NOT EXISTS (SELECT 1 FROM "UserMaster" WHERE "nUserid" = v_master AND "isAdmin" = true) THEN
        OPEN ref FOR SELECT -1 AS msg, 'Admin rights required' AS value, NULL::uuid AS "nCaseid";
        RETURN ref;
    END IF;

    IF v_case IS NULL OR v_enabled IS NULL THEN
        OPEN ref FOR SELECT -1 AS msg, 'nCaseid and bEnabled are required' AS value, NULL::uuid AS "nCaseid";
        RETURN ref;
    END IF;

    -- One row lock serialises concurrent admins: last writer wins, never two sources.
    INSERT INTO "AppSetting" ("nAppSettingid") VALUES (1) ON CONFLICT DO NOTHING;
    SELECT "nRTSimCaseid" INTO v_prev FROM "AppSetting" WHERE "nAppSettingid" = 1 FOR UPDATE;

    IF v_enabled THEN
        IF NOT EXISTS (SELECT 1 FROM "CaseMaster"
                        WHERE "nCaseid" = v_case AND coalesce("isArchived", false) = false) THEN
            OPEN ref FOR SELECT -1 AS msg, 'This case is archived or no longer exists' AS value, v_prev AS "nCaseid";
            RETURN ref;
        END IF;
        v_next := v_case;
    ELSE
        v_next := CASE WHEN v_prev = v_case THEN NULL ELSE v_prev END;
    END IF;

    IF v_next IS DISTINCT FROM v_prev THEN
        UPDATE "AppSetting"
           SET "nRTSimCaseid" = v_next,
               "nUpdateId"    = v_master,
               "dUpdateDt"    = now()
         WHERE "nAppSettingid" = 1;

        SELECT "nLCatid" INTO v_cat FROM "LogCategory"
         WHERE "cCategory" = 'RT Simulation source' ORDER BY "nLCatid" LIMIT 1;

        INSERT INTO "LogCaseMaster" ("nLCatid", "nCaseid", "cCasename", "cCaseno", "nMasterid", "cRemark", "jOther")
        SELECT v_cat, c."nCaseid", c."cCasename", c."cCaseno", v_master,
               CASE WHEN c."nCaseid" = v_next THEN 'RT Simulation source: on' ELSE 'RT Simulation source: off' END,
               jsonb_build_object('bEnabled', c."nCaseid" IS NOT DISTINCT FROM v_next,
                                  'nPrevCaseid', v_prev, 'nCaseid', v_next)
          FROM "CaseMaster" c
         WHERE c."nCaseid" IN (v_prev, v_next);
    END IF;

    OPEN ref FOR
        SELECT 1 AS msg, 'RT Simulation source updated' AS value,
               v_next AS "nCaseid", v_prev AS "nPrevCaseid",
               c."cCasename", c."cCaseno"
          FROM (SELECT 1) one
          LEFT JOIN "CaseMaster" c ON c."nCaseid" = v_next;
    RETURN ref;
END;
$function$;

--------------------------------------------------------------------------
-- et_rt_sim_source_resolve: server-side read for GET coreapi rt-demo/document.
-- One row { nCaseid } or no row (none chosen / case archived / case deleted).
--   executeRef('rt_sim_source_resolve', {})
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_rt_sim_source_resolve(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
BEGIN
    /*
    select * from et_rt_sim_source_resolve('{}','r1');fetch all in "r1";
    */
    OPEN ref FOR
        SELECT c."nCaseid"
          FROM "AppSetting" s
          JOIN "CaseMaster" c
            ON c."nCaseid" = s."nRTSimCaseid"
           AND coalesce(c."isArchived", false) = false
         WHERE s."nAppSettingid" = 1;
    RETURN ref;
END;
$function$;

COMMIT;
