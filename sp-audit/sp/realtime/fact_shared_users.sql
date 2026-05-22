CREATE OR REPLACE FUNCTION realtime.fact_shared_users(factid uuid, userid uuid)
 RETURNS TABLE("nUserid" uuid, "nFMSdid" uuid)
 LANGUAGE plpgsql
AS $function$

declare 

	-- select * from "FMShared"  where "nFSid" = '4295c70d-e9ff-4a60-958a-ba325a591408'
		-- select * from realtime.fact_shared_users('4295c70d-e9ff-4a60-958a-ba325a591408'::uuid,'fc2b2057-ac44-41c7-9058-64e8617ed3e5'::uuid)
--fc2b2057-ac44-41c7-9058-64e8617ed3e5
	-- select * from "FactMaster" where "nFSid" = '4295c70d-e9ff-4a60-958a-ba325a591408'
BEGIN

    RETURN QUERY
WITH RECURSIVE downline AS (
  SELECT s."nFMSdid",s."nUserid"  AS child,s."nShareBy" AS parent,ARRAY[s."nShareBy", s."nUserid"]::uuid[] AS path
  FROM public."FMShared" s
  WHERE s."nShareBy" = userid and s."nFSid" = factid
  UNION ALL
  SELECT s."nFMSdid",s."nUserid"  AS child,s."nShareBy" AS parent,d.path || s."nUserid"
  FROM public."FMShared" s
  JOIN downline d
    ON s."nShareBy" = d.child
  WHERE  s."nFSid" =factid and NOT s."nUserid" = ANY(d.path) 
)SELECT DISTINCT q.child "nUserid",q."nFMSdid"
  FROM downline q;

	
	  
END;
$function$
