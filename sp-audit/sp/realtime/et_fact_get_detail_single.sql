CREATE OR REPLACE FUNCTION realtime.et_fact_get_detail_single(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;
    nFSid uuid;
    isAdmin boolean;
    bIsTranscipt boolean default false;

BEGIN
    -- Extract parameters
    nFSid := NULLIF(parameter->>'nFSid','')::uuid;
    nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
    bIsTranscipt := COALESCE(parameter ->> 'bIsTranscipt','false')::boolean;

    -- Open ref1
OPEN ref1 FOR 
    SELECT f."nFSid", f."dCreateDt", 
           um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
		   um."nUserid",
           fd."nFiletype", fd."nTZid", tz."cCodename" AS "cTimezone", 
           fd."jLinktype", fd."cType", f."cFType",
           fd."jTexts", fd."jOT", fd."nColorid", fd."nStatus",
		   fd."jCordinates",
		   fd."jCordinates",
		   -- CASE on bIsTranscipt so the published-view single-fact lookup
		   -- returns nTPage/nTLine written by run3.py during transferAnnotations.
		   -- Mirrors et_marks.sql:57-58 for RHighlights.
		   CASE WHEN COALESCE(bIsTranscipt,false) THEN fd."nTPage" ELSE fd."nPage" END AS "nPage",
		   CASE WHEN COALESCE(bIsTranscipt,false) THEN fd."nTLine" ELSE fd."nLine" END AS "nLine",
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
	
    LEFT JOIN "Codemaster" cm ON cm."nCodeid" = (fd."jDate"->>'type')::int
    LEFT JOIN "Codemaster" tz ON tz."nCodeid" = fd."nTZid"
    LEFT JOIN "Codemaster" st ON st."nCodeid" = fd."nStatus"
    LEFT JOIN "Codemaster" ftp ON ftp."nCodeid" = fd."nFiletype"
    JOIN "RIssueMaster" cl ON cl."nIid" = fd."nColorid"
    WHERE f."nFSid" = nFSid
      -- Orphan filter: on the published view, suppress facts whose annotation
      -- could not be re-anchored. Mirrors et_marks.sql:48-50.
      AND (
        COALESCE(bIsTranscipt, false) = false
        OR (fd."cTransferStatus" IS DISTINCT FROM 'O' AND fd."jTCordinates" IS NOT NULL)
      )
	group by f."nFSid", f."dCreateDt",
           um."cFname" ,um."cLname",um."nUserid",
           fd."nFiletype", fd."nTZid", tz."cCodename",
           fd."jLinktype", fd."cType", f."cFType",
           fd."jTexts", fd."jOT", fd."nColorid", fd."nStatus",
		    fd."jCordinates",
			fd."nPage", fd."nTPage", fd."nLine", fd."nTLine",
           cl."cColor", fd."jDate",cm."cCodename",st."cCodename", ftp."cCodename";

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
    WHERE f."nFSid" = nFSid
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
    WHERE fl."nFSid" = nFSid;

    RETURN NEXT ref1;
    RETURN NEXT ref2;
    RETURN NEXT ref3;
END;
$function$
