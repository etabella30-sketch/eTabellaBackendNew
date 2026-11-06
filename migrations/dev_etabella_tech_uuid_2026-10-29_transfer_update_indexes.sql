DO $$ BEGIN IF current_database() <> 'etabella_tech_uuid' THEN RAISE EXCEPTION 'dev only'; END IF; END $$;

-- Publish speed (Day 2 QA 2026-10-29): index the keys the Mark transfer updates by.
--
-- assets/pythons/annot-transfer/run3.py writes every transferred Mark with
--   UPDATE "FactDetail" ... WHERE "nFSid" = ...   and   UPDATE "DocDetail" ... WHERE "nDocid" = ...
-- Neither column is indexed (only the PKs "nFSDid" / "nDMDid" are), so each update was a
-- sequential scan: EXPLAIN on etabella_tech_uuid = Seq Scan, 8.5 ms over 14,991 FactDetail rows,
-- growing with every Mark on every case. The same keys are joined by et_realtime_get_annotation_by_session_v2,
-- et_navigate_get_all and the factsheet SPs.
--
-- CONCURRENTLY: no write lock on live tables. It cannot run inside a transaction block, so
-- apply with plain psql -v ON_ERROR_STOP=1 -f (autocommit), never with -1 / --single-transaction;
-- ON_ERROR_STOP makes the 'dev only' guard above stop the file. Re-runnable (IF NOT EXISTS).
-- Dev only (etabella_tech_uuid = the database behind etabella.net); prod stays pending.

CREATE INDEX CONCURRENTLY IF NOT EXISTS "FactDetail_nFSid_idx" ON public."FactDetail" USING btree ("nFSid");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "DocDetail_nDocid_idx" ON public."DocDetail" USING btree ("nDocid");
