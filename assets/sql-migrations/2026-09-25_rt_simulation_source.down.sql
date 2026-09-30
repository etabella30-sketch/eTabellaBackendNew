-- Reverts 2026-09-25_rt_simulation_source.up.sql. DEV ONLY.

BEGIN;

DO $guard$
BEGIN
    IF current_database() <> 'etabella_tech_uuid' THEN
        RAISE EXCEPTION 'ABORT: dev-only migration targets etabella_tech_uuid, got %', current_database();
    END IF;
END
$guard$;

DROP FUNCTION IF EXISTS public.et_rt_sim_source_resolve(json, refcursor);
DROP FUNCTION IF EXISTS public.et_rt_sim_source_set(json, refcursor);
DROP FUNCTION IF EXISTS public.et_rt_sim_source_get(json, refcursor);
DROP TABLE IF EXISTS public."AppSetting";

-- Keep the category while LogCaseMaster history still references it.
DELETE FROM public."LogCategory" lc
 WHERE lc."cCategory" = 'RT Simulation source'
   AND NOT EXISTS (SELECT 1 FROM public."LogCaseMaster" l WHERE l."nLCatid" = lc."nLCatid");

COMMIT;
