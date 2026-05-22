CREATE OR REPLACE FUNCTION public.et_realtime_ensure_unassigned_issue(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_nCaseid UUID;
    v_nICid   UUID;
    v_nIid    UUID;
BEGIN
    v_nCaseid := NULLIF(parameter ->> 'nCaseid', '')::UUID;

    IF v_nCaseid IS NULL THEN
        OPEN ref1 FOR SELECT -1 AS "msg", 'nCaseid is required'::text AS "value";
        RETURN NEXT ref1;
        RETURN;
    END IF;

    -- Locate the Unassigned claim for this case. Match by cICtype='U'
    -- (the system marker — set on the original seed and on the legacy
    -- sessionbuilder seed) AND cCategory='Unassigned' (defensive,
    -- because the cICtype column is also written by the
    -- handle_issue_category SP's permission='U' branch which means
    -- "update", not Unassigned — the data is consistent on prod today
    -- but the AND keeps us safe from collisions).
    SELECT "nICid"
      INTO v_nICid
      FROM "IssueCategory"
     WHERE "nCaseid"   = v_nCaseid
       AND "cICtype"   = 'U'
       AND "cCategory" = 'Unassigned'
     LIMIT 1;

    -- Defensive: 3 cases on prod have no Unassigned claim at all.
    -- Create one. admin_insertupdate_case normally seeds it, but never
    -- assume.
    IF v_nICid IS NULL THEN
        INSERT INTO "IssueCategory" (
            "nCaseid", "cCategory", "cICtype", "dCreateDt"
        ) VALUES (
            v_nCaseid, 'Unassigned', 'U', NOW()
        )
        RETURNING "nICid" INTO v_nICid;
    END IF;

    -- Already-seeded check. Match by cIName='Unassigned' under this
    -- specific Unassigned claim — keeps the seed unique per case
    -- without depending on a flag column on RIssueMaster (which doesn't
    -- have one). Existing Unassigned issues with other names (e.g. the
    -- 14 'test' rows the user dropped into Unassigned claims) don't
    -- count; they're real issues.
    SELECT "nIid"
      INTO v_nIid
      FROM "RIssueMaster"
     WHERE "nICid"  = v_nICid
       AND "cIName" = 'Unassigned'
     LIMIT 1;

    IF v_nIid IS NULL THEN
        -- cColor 'FFFF00' (no '#', matching the codebase's storage
        -- convention — RIssueMaster.cColor is varchar(6)) → yellow,
        -- identical to PDF default highlight (pdf.service.ts:20).
        INSERT INTO "RIssueMaster" (
            "nICid", "nCaseid", "cIName", "cColor", "dCreatedt"
        ) VALUES (
            v_nICid, v_nCaseid, 'Unassigned', 'FFFF00', NOW()
        )
        RETURNING "nIid" INTO v_nIid;
    END IF;

    OPEN ref1 FOR SELECT 1 AS "msg", v_nICid AS "nICid", v_nIid AS "nIid";
    RETURN NEXT ref1;

EXCEPTION WHEN OTHERS THEN
    OPEN ref1 FOR SELECT -1 AS "msg", SQLERRM::text AS "value";
    RETURN NEXT ref1;
END;
$function$
