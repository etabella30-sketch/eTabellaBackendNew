CREATE OR REPLACE FUNCTION public.et_navigate_facts_bycompany(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nBundledetailid uuid;nCompanyid uuid;
isAdmin boolean default false;
cSortby text;cSorttype text;factids uuid[];
    sql_query TEXT;
	jFilter jsonb;
	filter_string text;
begin
-- select et_navigate_facts_bycompany('{ ""nCompanyid"": 5852, ""nMasterid"": 59 }','r1','r2','r3');fetch all in ""r2""

nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
nCompanyid := NULLIF(parameter ->>'nCompanyid','')::uuid;
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
cSorttype := parameter ->>'cSorttype';
cSortby := parameter ->>'cSortby';
	jFilter := parameter ->>'jFilter';

isAdmin := case when exists (  select * from "UserMaster" where "nUserid" = nMasterid and "isAdmin" = true )  then true  else false  end;

-- select * from "FactMaster"  where "nUserid" = 59 and "nBundledetailid" =530060 
-- select * from "FMContact" where "nFSid" in (1,2,30,31,32,72)
-- select * from "ContactMaster" where "nUserid" = 59
-- select * from "ContactCompany"where "nUserid" = 59
/*
select * from et_navigate_factlist ('{""nBundledetailid"":555364,""cSorttype"":""H"",""cSortby"":""D"",""nPageNumber"":1,""jFilter"":""[{\""name\"":\""CONTACT\"",\""type\"":\""V\"",\""value\"":[80]}]"",""nMasterid"":2}','r1','r2','r3');fetch all in ""r1"";fetch all in ""r2"";fetch all in ""r3"";

select * from et_navigate_facts_bycompany ('{""nBundledetailid"":555364,""nCompanyid"":0,""jFilter"":""[{\""name\"":\""CONTACT\"",\""type\"":\""V\"",\""value\"":[80]}]"",""nMasterid"":2}','r1','r2','r3');fetch all in ""r1"";fetch all in ""r2"";fetch all in ""r3"";

(select filter_whereclause('[{""name"":""CONTACT"",""type"":""V"",""value"":[80]}]'::jsonb,'FCO'));

*/

filter_string := (select filter_whereclause_2(jFilter,'FCO'));

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
    WHERE f."nBundledetailid" = ''' || nBundledetailid || '''::uuid
		and ' || CASE WHEN nCompanyid IS NULL THEN 'cm."nCompanyid" IS NULL' ELSE 'cm."nCompanyid" = ''' || nCompanyid || '''::uuid' END || '
    AND (f."nUserid" = ''' || nMasterid || '''::uuid OR s."nUserid" = ''' || nMasterid || '''::uuid)  ' || (case when filter_string is not null then (' and (' || filter_string || ') ') else '' end) || '))';

		  EXECUTE sql_query INTO factids;
		  
/*
factids = (array (
	select  f."nFSid"  from "FactMaster" f
    left join "FMShared" fs on fs."nFSid" = f."nFSid"
 	join "FMContact" fc on fc."nFSid" = f."nFSid"
	join "ContactMaster" cm on cm."nContactid" = fc."nContactid"
    where f."nBundledetailid" = nBundledetailid  and (f."nUserid" = nMasterid or fs."nUserid" = nMasterid)
							  and coalesce(cm."nCompanyid",0) = nCompanyid
	group by f."nFSid",f."dCreateDt" 
	order by  f."dCreateDt" desc 
	));*/

-- select * from "FactDetail"
-- select * from "FMContact"
	
	 
	 
	open ref1 for 
	  SELECT sql_query,f."nFSid", f."dCreateDt", um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",um."nUserid",
        fd."nFiletype", fd."nTZid", tz."cCodename" AS "cTimezone", "jLinktype", fd."cType", f."cFType",
        fd."jTexts", fd."jOT", fd."nColorid", fd."nStatus", cl."cColor" AS "cColor", fd."jDate", cm."cCodename" as "cDatetype",
		st."cCodename" as "cStatus", ftp."cCodename" as "cFiletype",
		fc."nContactid",cf."cProfile",cf."cFname",cf."cLname",cf."cAlias",cf."cEmail",
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
		
	left join "Codemaster" cm on cm."nCodeid" = (fd."jDate"->>'type')::int
    JOIN "Codemaster" tz ON tz."nCodeid" = fd."nTZid"
	left join "Codemaster" st on st."nCodeid" = fd."nStatus"
	left join "Codemaster" ftp on ftp."nCodeid" = fd."nFiletype"
    JOIN "RIssueMaster" cl ON cl."nIid" = fd."nColorid"
    WHERE f."nFSid" = ANY(factids)
	group by f."nFSid",f."dCreateDt",um."cFname" ,um."cLname",um."nUserid",
        fd."nFiletype",fd."nTZid", tz."cCodename",
        "jLinktype",fd."cType",f."cFType",fd."jTexts",fd."jOT",
        fd."nColorid",cl."cColor",fd."jDate",fd."nStatus",
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
