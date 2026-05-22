CREATE OR REPLACE FUNCTION realtime.et_marknav_team_user(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nUserid UUID;
    nBundledetailid UUID;
    nSesid UUID;
    cType text;
BEGIN
    -- convert blank string → NULL with explicit cast
    nUserid := NULLIF(parameter ->> 'nUserid', '')::uuid;
    nSesid := NULLIF(parameter ->> 'nSesid', '')::uuid;
    nBundledetailid := NULLIF(parameter ->> 'nBundledetailid', '')::uuid;
    cType := parameter ->> 'cType';

    OPEN ref1 FOR 
   SELECT 
  q."nUserid", q."cFname", q."cLname", q."cProfile"
FROM (
  SELECT DISTINCT
    u."nUserid",
    u."cFname",
    u."cLname",
    u."cProfile",
    CASE WHEN u."nUserid" = nUserid THEN 0 ELSE 1 END AS _sort_first
  FROM "UserMaster" u
  LEFT JOIN "FactMaster" f
    ON f."nUserid" = u."nUserid"
   AND (f."nSesid" = nSesid OR f."nBundledetailid" = nBundledetailid)
   AND (COALESCE(cType,'A') = 'A' OR f."cFType" = cType)
	LEFT JOIN "FMShared" fs on fs."nFSid" = f."nFSid"
  LEFT JOIN "DocMaster" d
    ON d."nUserid" = u."nUserid"
   AND (d."nSesid" = nSesid OR d."nBundledetailid" = nBundledetailid)
   AND (cType = 'A' OR cType = 'D')
   LEFT JOIN "DMShared" ds on ds."nDocid" = d."nDocid"
  WHERE (
        COALESCE(cType,'A') = 'A'
        AND ((f."nFSid" IS NOT NULL OR d."nDocid" IS NOT NULL) and (d."nUserid" = nUserid or ds."nUserid" = nUserid or f."nUserid" = nUserid or fs."nUserid" = nUserid))
      )
     OR (
        cType = 'D'
        AND d."nDocid" IS NOT NULL 
        AND f."nFSid" IS NULL
		and d."nUserid" = nUserid or ds."nUserid" = nUserid
      )
     OR (
        cType NOT IN ('A','D')
        AND f."nFSid" IS NOT NULL
        AND d."nDocid" IS NULL
		and f."nUserid" = nUserid or fs."nUserid" = nUserid
      )
) q
ORDER BY q._sort_first, q."cFname", q."nUserid";

    RETURN NEXT ref1;
END;
$function$
