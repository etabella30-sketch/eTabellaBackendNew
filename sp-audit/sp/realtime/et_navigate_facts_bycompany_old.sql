CREATE OR REPLACE FUNCTION realtime.et_navigate_facts_bycompany_old(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nSesid uuid;nCompanyid uuid;
isAdmin boolean default false;
cSortby text;cSorttype text;factids uuid[];
    sql_query TEXT;
	jFilter jsonb;
	filter_string text;
    nBundledetailid uuid;
begin
-- select et_navigate_facts_bycompany('{ ""nCompanyid"": 5852, ""nMasterid"": 59 }','r1','r2','r3');fetch all in ""r2""

nSesid := NULLIF(parameter ->>'nSesid','')::uuid;
nCompanyid := NULLIF(parameter ->>'nCompanyid','')::uuid;
nMasterid := NULLIF(parameter ->>'nUserid','')::uuid;
cSorttype := parameter ->>'cSorttype';
cSortby := parameter ->>'cSortby';
	jFilter := coalesce(parameter ->>'jFilter','[]')::jsonb;
    nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;

isAdmin := case when exists (  select * from "UserMaster" where "nUserid" = nMasterid and "isAdmin" = true )  then true  else false  end;

filter_string := (select filter_whereclause_2(jFilter,'FCO'));
raise notice 'filter_string %',filter_string;       

  sql_query := 'select (array (SELECT distinct f."nFSid"
    FROM "FactMaster" f
    JOIN "FactDetail" d ON d."nFSid" = f."nFSid"
    LEFT JOIN "FMTasks" t ON t."nFSid" = f."nFSid"
        LEFT JOIN "TaskDetail" td ON td."nTaskid" = t."nTaskid"
    LEFT JOIN "FMIssue" i ON i."nFSid" = f."nFSid"
        LEFT JOIN "RIssueMaster" im ON im."nIid" = i."nIssueid"
    LEFT JOIN "FMShared" s ON s."nFSid" = f."nFSid"
    LEFT JOIN "FMContact" c ON c."nFSid" = f."nFSid"
		left join "ContactMaster" cm on cm."nContactid" = c."nContactid"
    LEFT JOIN "FMLinks" l ON l."nFSid" = f."nFSid"
    WHERE (f."nSesid" = ''' || coalesce(nSesid,'00000000-0000-0000-0000-000000000000') || '''::uuid or f."nBundledetailid" = ''' || coalesce(nBundledetailid,'00000000-0000-0000-0000-000000000000') || '''::uuid)
		and ' || CASE WHEN nCompanyid IS NULL THEN 'cm."nCompanyid" IS NULL' ELSE 'cm."nCompanyid" = ''' || nCompanyid || '''::uuid' END || '
    AND (f."nUserid" = ''' || nMasterid || '''::uuid OR s."nUserid" = ''' || nMasterid || '''::uuid)  ' || (case when filter_string is not null then (' and (' || filter_string || ') ') else '' end) || '))';

raise notice 'sql_query %', sql_query;
		  EXECUTE sql_query INTO factids;
		  
	 
	open ref1 for 
	  SELECT f."nFSid", f."dCreateDt", um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",um."nUserid",
        fd."nFiletype", fd."nTZid", "jLinktype", fd."cType", f."cFType", --tz."cCodename" AS "cTimezone",
        fd."jTexts", fd."jOT", fd."nColorid", fd."nStatus", cl."cColor" AS "cColor", fd."jDate", cm."cCodename" as "cDatetype",
		st."cCodename" as "cStatus", ftp."cCodename" as "cFiletype",
		fc."nContactid",cf."cProfile",cf."cFname",cf."cLname",cf."cAlias",cf."cEmail",
		fd."jCordinates",
		fd."nPage",
		count(s."nFMSdid") as "t_shared",
	count(ft."nFMTsid") as "t_tasks",
	count(fc."nFMCid") as "t_contact"
    FROM "FactMaster" f
    JOIN "UserMaster" um ON um."nUserid" = f."nUserid"
    JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"
 	join "FMContact" fc on fc."nFSid" = f."nFSid"
	join "ContactMaster" cf on cf."nContactid" = fc."nContactid"
		
	left join "FMShared" s on s."nFSid" = f."nFSid"
	left join "FMTasks" ft on ft."nFSid" = f."nFSid"
		
	left join "Codemaster" cm on cm."nCodeid" = (fd."jDate"->>'nValue')::int
    -- JOIN "Codemaster" tz ON tz."nCodeid" = fd."nTZid"
	left join "Codemaster" st on st."nCodeid" = fd."nStatus"
	left join "Codemaster" ftp on ftp."nCodeid" = fd."nFiletype"
    JOIN "RIssueMaster" cl ON cl."nIid" = fd."nColorid"
    WHERE f."nFSid" = ANY(factids)
	group by f."nFSid",f."dCreateDt",um."cFname" ,um."cLname",um."nUserid",
        fd."nFiletype",fd."nTZid", -- tz."cCodename",
        "jLinktype",fd."cType",f."cFType",fd."jTexts",fd."jOT",
        fd."nColorid",cl."cColor",fd."jDate",fd."nStatus",
		fd."jCordinates",
		fd."nPage",
		cm."cCodename",st."cCodename",ftp."cCodename",fc."nContactid",cf."cProfile",cf."cFname",cf."cLname",cf."cAlias",cf."cEmail"
	order by 
	  -- f."dCreateDt" desc; 
	  	CASE WHEN cSortby = 'asc' THEN f."dCreateDt" END ASC,
		CASE WHEN cSortby = 'desc' THEN f."dCreateDt" END DESC,
		f."dCreateDt" DESC; 
							  
	 RETURN next ref1;
	 
	open ref2 for 	
		select jsonb_agg(f."nFSid") "jFSids",fi."nIssueid",fi."nImpactid",fi."nRelevanceid",im."nICid",ic."cCategory",im."cIName",im."cColor",
		rl."cCodename",impct."cCodename"
		from "FactMaster" f
		join "FMIssue" fi on fi."nFSid" = f."nFSid"
		join "RIssueMaster" im on im."nIid" = fi."nIssueid"
		join "IssueCategory" ic on ic."nICid" = im."nICid"
		left join "Codemaster" rl on rl."nCodeid" = fi."nRelevanceid" 
		left join "Codemaster" impct on impct."nCodeid" = fi."nImpactid" 
		  WHERE f."nFSid" = ANY(factids)
		 group by fi."nIssueid",fi."nImpactid",fi."nRelevanceid" ,im."nICid",ic."cCategory",im."cIName",im."cColor",rl."cCodename",impct."cCodename" ;
		 
		 
	 RETURN next ref2;
	 
	 
	 -- select * from "FMLinks" order by 1 desc
	 -- select * from "IssueCategory" order by 1 desc
	 -- select * from "RIssueMaster" order by 1 desc
	 -- select * from "IssueCategory" order by 1 desc
	 
	 open ref3 for 	
		select fl."nFMLid",fl."nBundledetailid",bd."cFilename" "cName",bd."cExhibitno",bd."cTab",fl."jLinktype","cPage"
		from  "FMLinks" fl
		join "BundleDetail" bd on bd."nBundledetailid" = fl."nBundledetailid"
		  WHERE fl."nFSid" = ANY(factids)
		  ;
		 
	 RETURN next ref3;
	 
    END;
$function$
