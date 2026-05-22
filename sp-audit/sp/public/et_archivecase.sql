CREATE OR REPLACE FUNCTION public.et_archivecase(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid   UUID;      -- was integer :contentReference[oaicite:14]{index=14}:contentReference[oaicite:15]{index=15}
    pageNumber  INT;
    offsetCount INT;
    perPage     INT := 10;
    jCases      JSONB;
    allcases    UUID[];    -- was int[] :contentReference[oaicite:16]{index=16}:contentReference[oaicite:17]{index=17}
BEGIN
    nMasterid  := (parameter->>'nMasterid')::uuid;
    pageNumber := COALESCE((parameter->>'pageNumber')::int, 1);
    offsetCount:= (pageNumber - 1) * perPage;

    allcases := ARRAY(
      SELECT "nCaseid"
        FROM "CaseMaster"
       WHERE "isArchived" = TRUE
       ORDER BY COALESCE("dUpdateDt","dCreateDt") DESC
       LIMIT perPage OFFSET offsetCount
    );

    OPEN ref1 FOR
      SELECT c."nCaseid", c."cCasename", c."cCaseno", c."dUpdateDt"
        FROM "CaseMaster" c
       WHERE c."nCaseid" = ANY(allcases)
       ORDER BY c."dUpdateDt" DESC;
    RETURN NEXT ref1;

    OPEN ref2 FOR
      SELECT t."nTeamid", t."cTeamname", t."nCaseid"
        FROM "TeamMaster" t
       WHERE t."nCaseid" = ANY(allcases);
    RETURN NEXT ref2;

    OPEN ref3 FOR
      SELECT jsonb_agg(DISTINCT t."nTeamid") AS teams,
             u."cFname", u."cLname", u."cProfile", t."nRoleid"
        FROM "TeamRelation" t
        JOIN "UserMaster" u
          ON u."nUserid" = t."nUserid"
       WHERE t."nCaseid" = ANY(allcases)
       GROUP BY u."cFname", u."cLname", u."cProfile", t."nRoleid";
    RETURN NEXT ref3;
END;
$function$
