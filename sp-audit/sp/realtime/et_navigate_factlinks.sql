CREATE OR REPLACE FUNCTION realtime.et_navigate_factlinks(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;
    nBundledetailid uuid;
    isAdmin boolean;
    pageNumber int;
    offsetCount int;
    perPage int := 10;
    factids uuid[];
    sql_query TEXT;
	jFilter jsonb;
	filter_string text;
	cSortby text;

BEGIN

/*select * from et_navigate_factlist ('{""nBundledetailid"":555364,""cSorttype"":""H"",""cSortby"":""D"",""nPageNumber"":1,""nMasterid"":59}','r1','r2','r3');fetch all in ""r1"";fetch all in ""r2"";fetch all in ""r3"";
   
	select * from et_navigate_factlinks ('{""nBundledetailid"":555364,""cSorttype"":""H"",""cSortby"":""D"",""nPageNumber"":1,""nMasterid"":2}','r1','r2','r3');fetch all in ""r1"";fetch all in ""r2"";fetch all in ""r3"";
	*/
	-- Extract parameters
    nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
    nMasterid := NULLIF(parameter->>'nUserid','')::uuid;
    pageNumber := COALESCE((parameter->>'pageNumber')::int, 1);
    offsetCount := (pageNumber - 1) * perPage;
	jFilter := coalesce((parameter ->>'jFilter')::jsonb,'[]'::jsonb);
	cSortby := parameter->>'cSortby';

filter_string := (select filter_whereclause(jFilter,'FCH'));

  sql_query := 'select (array (SELECT distinct f."nFSid"
    -- FROM "FactMaster" f
	FROM "FMLinks" l
	JOIN "FactMaster" f ON l."nFSid" = f."nFSid"
    JOIN "FactDetail" d ON d."nFSid" = l."nFSid"
    LEFT JOIN "FMTasks" t ON t."nFSid" = l."nFSid"
        LEFT JOIN "TaskDetail" td ON td."nTaskid" = t."nTaskid"
    LEFT JOIN "FMIssue" i ON i."nFSid" = l."nFSid"
        LEFT JOIN "RIssueMaster" im ON im."nIid" = i."nIssueid"
    LEFT JOIN "FMShared" s ON s."nFSid" = l."nFSid"
    LEFT JOIN "FMContact" c ON c."nFSid" = l."nFSid"
    -- LEFT JOIN "FMLinks" l ON l."nFSid" = f."nFSid"
 WHERE (
 	  l."nBundledetailid" = ''' || nBundledetailid || '''::uuid
      AND (f."nUserid" = ''' || nMasterid || '''::uuid OR s."nUserid" = ''' || nMasterid || '''::uuid)
	  AND l."nFSid" IS NOT NULL ) ' || (case when filter_string is not null then (' and (' || filter_string || ') ') else '' end) || '))';

		raise notice 'sql_query %', sql_query;
		  EXECUTE sql_query INTO factids;

    -- Open ref1
    OPEN ref1 FOR
     SELECT  f."nFSid", f."dCreateDt", 
           um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
		   um."nUserid",
           fd."nFiletype", fd."nTZid", tz."cCodename" AS "cTimezone", 
           fd."jLinktype", fd."cType", f."cFType",
           fd."jTexts", fd."jOT", fd."nColorid", fd."nStatus", 
           cl."cColor" AS "cColor", fd."jDate", 
           cm."cCodename" as "cDatetype",
           st."cCodename" as "cStatus", 
           ftp."cCodename" as "cFiletype",
           bd."nBundledetailid", bd."cFilename" AS "cName", bd."cExhibitno", bd."cPage",
	count(s."nFMSdid") as "t_shared",
	count(ft."nFMTsid") as "t_tasks",
	count(fc."nFMCid") as "t_contact"
    FROM "FactMaster" f
    JOIN "BundleDetail" bd ON bd."nBundledetailid" = f."nBundledetailid"
    JOIN "UserMaster" um ON um."nUserid" = f."nUserid"
    JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"
    JOIN "RIssueMaster" cl ON cl."nIid" = fd."nColorid"
    left JOIN "Codemaster" tz ON tz."nCodeid" = fd."nTZid"
	left join "FMShared" s on s."nFSid" = f."nFSid"
	left join "FMTasks" ft on ft."nFSid" = f."nFSid"
	left join "FMContact" fc on fc."nFSid" = f."nFSid"
	
		
    LEFT JOIN "Codemaster" cm ON cm."nCodeid" = (fd."jDate"->>'nValue')::int
    LEFT JOIN "Codemaster" st ON st."nCodeid" = fd."nStatus"
    LEFT JOIN "Codemaster" ftp ON ftp."nCodeid" = fd."nFiletype"
    LEFT JOIN "FMLinks" fl ON fl."nFSid" = f."nFSid"
    WHERE f."nFSid" = ANY(factids)
		group by f."nFSid", f."dCreateDt", 
           um."cFname",um."cLname",um."nUserid",
           fd."nFiletype", fd."nTZid", tz."cCodename", 
           fd."jLinktype", fd."cType", f."cFType",
           fd."jTexts", fd."jOT", fd."nColorid", fd."nStatus", 
           cl."cColor", fd."jDate", 
           cm."cCodename",
           st."cCodename", 
           ftp."cCodename",
           bd."nBundledetailid", bd."cFilename", bd."cExhibitno", bd."cPage"
		 ORDER BY 
		 	CASE WHEN cSortby = 'asc' THEN f."dCreateDt" END ASC,
			CASE WHEN cSortby = 'desc' THEN f."dCreateDt" END DESC,
			f."dCreateDt" desc;

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
    SELECT fl."nFSid", fl."nFMLid", bd."nBundledetailid", 
           bd."cFilename" AS "cName", bd."cExhibitno", bd."cTab", 
           fl."jLinktype", bd."cPage"
    FROM "FMLinks" fl
	join "FactMaster" f on f."nFSid" = fl."nFSid"
    JOIN "BundleDetail" bd ON bd."nBundledetailid" = f."nBundledetailid"
    WHERE fl."nFSid" = ANY(factids) and fl."nBundledetailid" = nBundledetailid ;

    RETURN NEXT ref1;
    RETURN NEXT ref2;
    RETURN NEXT ref3;
END;
$function$
