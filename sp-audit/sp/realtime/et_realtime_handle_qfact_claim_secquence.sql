CREATE OR REPLACE FUNCTION realtime.et_realtime_handle_qfact_claim_secquence(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nUserid UUID;
    jClaims JSONB;
    upserted_count INTEGER;
BEGIN
    nUserid := NULLIF(parameter ->> 'nUserid', '')::UUID;
    jClaims := COALESCE((parameter ->> 'jClaims')::JSONB, '[]'::JSONB);

    IF nUserid IS NULL THEN
        OPEN ref1 FOR SELECT -1 AS "msg", 'nUserid is required'::text AS "value";
        RETURN NEXT ref1;
        RETURN;
    END IF;

    WITH upserted AS (
        INSERT INTO public."RUserQFactClaimPref" (
            "nUserid", "nICid", "nQFactSequence", "dCreateDt", "dModifyDt"
        )
        SELECT
            nUserid,
            (item ->> 'nICid')::UUID,
            (item ->> 'nQFactSequence')::INTEGER,
            NOW(),
            NOW()
        FROM JSONB_ARRAY_ELEMENTS(jClaims) AS item
        ON CONFLICT ("nUserid", "nICid")
        DO UPDATE SET
            "nQFactSequence" = EXCLUDED."nQFactSequence",
            "dModifyDt"      = NOW()
        RETURNING 1
    )
    SELECT COUNT(*) INTO upserted_count FROM upserted;

    OPEN ref1 FOR SELECT 1 AS "msg", upserted_count AS "count";
    RETURN NEXT ref1;
EXCEPTION WHEN OTHERS THEN
    OPEN ref1 FOR SELECT -1 AS "msg", SQLERRM::text AS "value";
    RETURN NEXT ref1;
END;
$function$
