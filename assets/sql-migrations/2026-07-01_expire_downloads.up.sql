-- 2026-07-01 — download.et_expire_downloads (NEW)
-- Rolling-retention for generated download packages. A nightly cron
-- (OutputExpiryService) calls this to flip completed jobs older than N days
-- (default 7) from 'C' -> 'X' (expired), mirroring the download-bucket S3
-- lifecycle rule so the Outputs UI shows Expired -> Regenerate. Returns the
-- affected nDPids so the cron can also delete the S3 objects (belt-and-
-- suspenders; the bucket lifecycle rule is the primary deleter).
-- Additive / backward-compatible: new function only; no schema or existing-SP
-- changes. 'X' is a previously-unused cStatus value.

BEGIN;

CREATE OR REPLACE FUNCTION download.et_expire_downloads(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    retention_days int;
BEGIN
    retention_days := COALESCE(NULLIF(parameter ->> 'nRetentionDays','')::int, 7);

    OPEN ref FOR
    WITH expired AS (
        UPDATE download."ProcessMaster"
           SET "cStatus" = 'X'
         WHERE "cStatus" = 'C'
           AND "dCreateDt" < NOW() - (retention_days || ' days')::interval
        RETURNING "nDPid"
    ),
    logged AS (
        INSERT INTO download."ProcessStatusLogs" ("nDPid","cStatus","dLogDt")
        SELECT "nDPid", 'X', NOW() FROM expired
        RETURNING "nDPid"
    )
    SELECT "nDPid" FROM expired;

    RETURN ref;
END;
$function$;

COMMIT;
