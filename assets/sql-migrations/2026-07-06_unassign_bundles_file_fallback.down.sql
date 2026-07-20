-- Down-migration: intentionally a no-op.
-- The up-migration overwrites whatever et_unassign_bundles version was live
-- with the canonical catalogue body; the previous live body was never
-- captured, so there is nothing faithful to restore. If a rollback is ever
-- needed, restore from a pre-migration pg_dump of the function:
--   pg_dump -d "3.0.etabella.com.uuid" --schema-only -t none \
--     && select pg_get_functiondef('public.et_unassign_bundles(json, refcursor)'::regprocedure);
BEGIN;
-- no-op
COMMIT;
