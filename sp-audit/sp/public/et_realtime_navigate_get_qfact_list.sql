CREATE OR REPLACE FUNCTION public.et_realtime_navigate_get_qfact_list(parameter json, ref1 refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nUserid uuid;nSessionid uuid;

BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nSessionid := NULLIF(parameter ->>'nSessionid','')::uuid;

    OPEN ref1 FOR 
		-- select rd."nIDid", rd."cNote",  coalesce(rd."cTPageno",rd."cPageno") as "cPageno",  rd."cONote",rl."cCodename" as "cRelevance",
		-- imp."cCodename" as "cImpact",rm."nRelid",rm."nImpactid"
		-- From "RIssueDetail" rd 
		-- join "RIssueMapid" rm on rm."nIDid" = rd."nIDid"
		-- left join "Codemaster"  rl on rl."nCodeid" = rm."nRelid"
		-- left join "Codemaster"  imp on imp."nCodeid" = rm."nImpactid"
		-- where "nCaseid" = nCaseid and "nSessionid" = nSessionid and rd."nUserid" = nUserid;
		SELECT 
		  rd."nIDid" AS "nId",
		  'QF' AS "cType",
		  rd."cNote",
		  rd."cONote",
		  rd."dCreatedt",
		  coalesce(rd."cTPageno",rd."cPageno") as "cPageno",
		  rmast."cColor",
		  um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
		  rd."jCordinates",
		  JSON_AGG(JSON_BUILD_OBJECT(
		  'cIName', rmast."cIName",
		  'cColor', rmast."cColor",
		  'cRelevance', rl."cCodename",
		  'cImpact', imp."cCodename",
		   'nICid', rmast."nICid",
		   'cCategory', ic."cCategory"
		  )) AS "issues"
		  FROM "RIssueDetail" rd 
		  JOIN "RIssueMapid" rm ON rm."nIDid" = rd."nIDid"
		  JOIN "RIssueMaster" rmast ON rmast."nIid" = rm."nIid"
		  JOIN "IssueCategory" ic ON ic."nICid" = rmast."nICid"
		  JOIN "UserMaster" um ON um."nUserid" = rmast."nUserid"
		  LEFT JOIN "Codemaster" rl ON rl."nCodeid" = rm."nRelid"
		  LEFT JOIN "Codemaster" imp ON imp."nCodeid" = rm."nImpactid"
		  WHERE rd."nCaseid" = nCaseid
		  AND rd."nSessionid" =nSessionid
		  AND rd."nUserid" = nUserid
		  GROUP BY rd."nIDid", rd."cNote", rd."dCreatedt", rmast."cColor", um."cFname", um."cLname"
		  order by rd."dCreatedt" desc;

   RETURN ref1;

END;
$function$
