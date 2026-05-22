CREATE OR REPLACE FUNCTION public.et_dashboard_info(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid  uuid;
BEGIN
    nMasterid := (parameter ->> 'nMasterid')::uuid;

    -- 1st cursor: ticket counts
    OPEN ref1 FOR
    SELECT
      count(DISTINCT t."nTicketid") AS "totaltickets",
      t."nCaseid"
    FROM "TeamRelation" tr
    JOIN "TicketMaster"    t ON t."nCaseid" = tr."nCaseid"
                          AND t."nCreateId" = nMasterid
    WHERE tr."nUserid" = nMasterid
    GROUP BY t."nCaseid";
    RETURN NEXT ref1;

    -- 2nd cursor: today's sessions
    OPEN ref2 FOR
    WITH latest_sessions AS (
      SELECT
        rs."nSesid",
        rs."cName",
        rs."nCaseid",
        rs."dStartDt",
        rs."cStatus",
        LEAD(rs."dStartDt") OVER (
          PARTITION BY rs."nCaseid" ORDER BY rs."dStartDt"
        ) AS next_dStartDt
      FROM "RSessionMaster" rs
      LEFT JOIN "RSessionDetail" d ON d."nSesid" = rs."nSesid"
      WHERE rs."cSType" != 'D'
    )
    SELECT
      "nSesid", "cName", "nCaseid", "dStartDt"
    FROM latest_sessions
    WHERE "cStatus" = 'R'
    GROUP BY "nSesid", "cName", "nCaseid", "dStartDt";
    RETURN NEXT ref2;

    -- 3rd cursor: placeholder
    OPEN ref3 FOR
    SELECT 1 AS msg;
    RETURN NEXT ref3;
END;
$function$
