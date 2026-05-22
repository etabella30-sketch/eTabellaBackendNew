CREATE OR REPLACE FUNCTION public.et_realtime_get_issue_annot(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
nCaseid UUID;nSessionid uuid;nUserid uuid;
BEGIN
nCaseid := NULLIF(parameter ->> 'nCaseid', '')::UUID;
nSessionid := NULLIF(parameter ->> 'nSessionid', '')::UUID;
nUserid := NULLIF(parameter ->> 'nUserid', '')::UUID;

-- select * from "RIssueMaster" order by 1 desc
-- select * from "RIssueDetail" where "nIDid" = 760 order by 1 desc
-- select * from "RIssueMapid"  order by 1 desc

OPEN ref FOR
SELECT id."nIDid",r."cColor",id."jCordinates",id."cPageno",id."cLineno", count(im."nMapid") totalissue
FROM "RIssueDetail" id
join "RIssueMaster" r ON r."nIid" = id."nLID" 
JOIN "RIssueMapid" im ON id."nIDid" = im."nIDid"

WHERE id."nCaseid" = nCaseid and id."nSessionid" = nSessionid and id."nUserid" = nUserid
 GROUP BY id."nIDid",r."cColor",id."jCordinates",id."cPageno",id."cLineno";

RETURN ref;
END;
$function$
