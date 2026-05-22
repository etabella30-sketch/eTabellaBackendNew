CREATE OR REPLACE FUNCTION public.get_livesession(nuserid uuid)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
       result uuid := NULL;
	
BEGIN
	-- select get_livesession(2)
	
	WITH latest_sessions AS (
    SELECT
        rs."nSesid",
        rs."cName",
        rs."nCaseid",
        rs."dStartDt",
		rs."cStatus",
        LEAD(rs."dStartDt") OVER (PARTITION BY rs."nCaseid" ORDER BY rs."dStartDt") AS next_dStartDt
    FROM "RSessionMaster" rs
	join "RSessionDetail" d on  d."nSesid" = rs."nSesid"
	where d."nUserid" = nuserid and  rs."cSType" != 'D' 
)
SELECT
    "nSesid"
   	into result
FROM
    latest_sessions
WHERE
   "dStartDt"::date = NOW()::date and "dStartDt" <= NOW() AND (next_dStartDt IS NULL OR next_dStartDt > NOW()) and "cStatus" !='C'
GROUP BY
    "nSesid", "cName", "nCaseid", "dStartDt" limit 1;
	
	
-- select get_livesession()
    RETURN result;
END;
$function$
