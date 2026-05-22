CREATE OR REPLACE FUNCTION realtime.et_navigate_factlist_old(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;
    nSesid uuid;
    nBundledetailid uuid;
    isAdmin boolean;
    cSortby text;
    cSorttype text;
    pageNumber int;
    offsetCount int;
    perPage int := 10;
    factids uuid[];
    sql_query TEXT;
	jFilter jsonb;
	filter_string text;
	cFType text;

BEGIN
    -- Extract parameters
    nSesid := NULLIF(parameter->>'nSesid','')::uuid;
    nMasterid := NULLIF(parameter->>'nUserid','')::uuid;
    cSorttype := parameter->>'cSorttype';
    cSortby := parameter->>'cSortby';
    pageNumber := COALESCE((parameter->>'nPageNumber')::int, 1);
	jFilter := parameter ->>'jFilter';
    offsetCount := (pageNumber - 1) * perPage;
	cFType := NULLIF(parameter->>'cFType', '');
    nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;

/*

select * from et_navigate_factlist ('{"nBundledetailid":555364,"cSorttype":"H","cSortby":"D","nPageNumber":1,"jFilter":"[{\"name\":\"CLAIM\",\"type\":\"V\",\"value\":[233,231,232]},{\"name\":\"CLAIM\",\"type\":\"C\",\"value\":\"AND\"},{\"name\":\"ISSUE\",\"type\":\"V\",\"value\":[1,2,3,4]},{\"name\":\"ISSUE\",\"type\":\"C\",\"value\":\"AND\"},{\"name\":\"TYPE\",\"type\":\"V\",\"value\":[5,6,8]},{\"name\":\"TYPE\",\"type\":\"C\",\"value\":\"AND\"},{\"name\":\"RELEVANCE\",\"type\":\"V\",\"value\":[13,15,16]},{\"name\":\"RELEVANCE\",\"type\":\"C\",\"value\":\"AND\"},{\"name\":\"IMPACT\",\"type\":\"V\",\"value\":[19,22,21]},{\"name\":\"IMPACT\",\"type\":\"C\",\"value\":\"OR\"},{\"name\":\"STATUS\",\"type\":\"V\",\"value\":[10,11]},{\"name\":\"STATUS\",\"type\":\"C\",\"value\":\"OR\"},{\"name\":\"CONTACT\",\"type\":\"V\",\"value\":[81,80,79]}]","nMasterid":2}','r1','r2','r3');fetch all in "r1";fetch all in "r2";fetch all in "r3";

*/

filter_string := (select filter_whereclause_2(jFilter,'FCH'));

  sql_query := 'select (array (SELECT distinct f."nFSid"
    FROM "FactMaster" f
    JOIN "FactDetail" d ON d."nFSid" = f."nFSid"
    LEFT JOIN "FMTasks" t ON t."nFSid" = f."nFSid"
        LEFT JOIN "TaskDetail" td ON td."nTaskid" = t."nTaskid"
    LEFT JOIN "FMIssue" i ON i."nFSid" = f."nFSid"
        LEFT JOIN "RIssueMaster" im ON im."nIid" = i."nIssueid"
    LEFT JOIN "FMShared" s ON s."nFSid" = f."nFSid"
    LEFT JOIN "FMContact" c ON c."nFSid" = f."nFSid"
    LEFT JOIN "FMLinks" l ON l."nFSid" = f."nFSid"
    WHERE (f."nSesid" = ''' || coalesce(nSesid,'00000000-0000-0000-0000-000000000000') || '''::uuid OR f."nBundledetailid" = ''' || coalesce(nBundledetailid,'00000000-0000-0000-0000-000000000000') || '''::uuid)
    AND (f."nUserid" = ''' || nMasterid || '''::uuid OR s."nUserid" = ''' || nMasterid || '''::uuid)' || (CASE WHEN cFType IS NOT NULL THEN ' AND f."cFType" = ''' || cFType || '''' ELSE '' END) || (case when filter_string is not null then (' and (' || filter_string || ') ') else '' end) || '))';

    -- Get factids
		  EXECUTE sql_query INTO factids;
    --factids := EXECUTE sql_query;
	
	/*(array (SELECT distinct f."nFSid"
    FROM "FactMaster" f
    LEFT JOIN "FMShared" fs ON fs."nFSid" = f."nFSid"
    WHERE f."nBundledetailid" = nBundledetailid
      AND (f."nUserid" = nMasterid OR fs."nUserid" = nMasterid)
    GROUP BY f."nFSid", f."dCreateDt"
   -- ORDER BY f."dCreateDt" DESC
    --LIMIT perPage
    --OFFSET offsetCount 
));

select * from "FMTasks"
select * from "FMContact"
select * from "FMShared"

*/

    -- Open ref1
OPEN ref1 FOR 
    SELECT 
			case when f."cFType" = 'F' then 'F' else 'QF' end as "cSource",
			f."nFSid", f."dCreateDt", 
			um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
		   um."nUserid",
           fd."nFiletype", fd."nTZid", tz."cCodename" AS "cTimezone", 
           fd."jLinktype", fd."cType", f."cFType",
           fd."jTexts", fd."jOT", fd."nColorid", fd."nStatus", 
		   fd."jCordinates",
		   fd."nPage",
           cl."cColor" AS "cColor", fd."jDate", 
           cm."cCodename" as "cDatetype",
           st."cCodename" as "cStatus", 
           ftp."cCodename" as "cFiletype",
	count(s."nFMSdid") as "t_shared",
	count(ft."nFMTsid") as "t_tasks",
	count(fc."nFMCid") as "t_contact"
    FROM "FactMaster" f
    JOIN "UserMaster" um ON um."nUserid" = f."nUserid"
    JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"
	left join "FMShared" s on s."nFSid" = f."nFSid"
	left join "FMTasks" ft on ft."nFSid" = f."nFSid"
	left join "FMContact" fc on fc."nFSid" = f."nFSid"
	
    LEFT JOIN "Codemaster" cm ON cm."nCodeid" = (fd."jDate"->>'nValue')::int
    LEFT JOIN "Codemaster" tz ON tz."nCodeid" = fd."nTZid"
    LEFT JOIN "Codemaster" st ON st."nCodeid" = fd."nStatus"
    LEFT JOIN "Codemaster" ftp ON ftp."nCodeid" = fd."nFiletype"
    JOIN "RIssueMaster" cl ON cl."nIid" = fd."nColorid"
    WHERE f."nFSid" = ANY(factids)
	group by f."nFSid", f."dCreateDt", 
           um."cFname" ,um."cLname",um."nUserid",
           fd."nFiletype", fd."nTZid", tz."cCodename", 
           fd."jLinktype", fd."cType", f."cFType",
           fd."jTexts", fd."jOT", fd."nColorid", fd."nStatus", 
		    fd."jCordinates",
			 fd."nPage",
           cl."cColor", fd."jDate",cm."cCodename",st."cCodename", ftp."cCodename"
	ORDER BY 
				 -- f."dCreateDt" desc
		CASE WHEN cSortby = 'asc' THEN f."dCreateDt" END ASC,
		CASE WHEN cSortby = 'desc' THEN f."dCreateDt" END DESC,
		f."dCreateDt" DESC; 

    -- Open ref2
    OPEN ref2 FOR 	
    SELECT jsonb_agg(f."nFSid") AS "jFSids", 
           fi."nIssueid", fi."nImpactid", fi."nRelevanceid",
           im."nICid", ic."cCategory", im."cIName", im."cColor",
           rl."cCodename" AS "cRelevance",
           impct."cCodename" AS "cImpact"
    FROM "FactMaster" f
    JOIN "FMIssue" fi ON fi."nFSid" = f."nFSid"
    JOIN "RIssueMaster" im ON im."nIid" = fi."nIssueid"
    JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"
    LEFT JOIN "Codemaster" rl ON rl."nCodeid" = fi."nRelevanceid" 
    LEFT JOIN "Codemaster" impct ON impct."nCodeid" = fi."nImpactid" 
    WHERE f."nFSid" = ANY(factids)
    GROUP BY fi."nIssueid", fi."nImpactid", fi."nRelevanceid", 
             im."nICid", ic."cCategory", im."cIName", im."cColor",
             rl."cCodename", impct."cCodename";

    -- Open ref3
    OPEN ref3 FOR 	
    SELECT fl."nFSid",fl."nFMLid", fl."nBundledetailid", 
           bd."cFilename" AS "cName", bd."cExhibitno", bd."cTab", 
           fl."jLinktype", bd."cPage"
    FROM "FMLinks" fl
    JOIN "BundleDetail" bd ON bd."nBundledetailid" = fl."nBundledetailid"
    WHERE fl."nFSid" = ANY(factids);

    RETURN NEXT ref1;
    RETURN NEXT ref2;
    RETURN NEXT ref3;
END;
$function$
