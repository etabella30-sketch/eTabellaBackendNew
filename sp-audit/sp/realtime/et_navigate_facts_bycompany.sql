CREATE OR REPLACE FUNCTION realtime.et_navigate_facts_bycompany(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nSesid uuid;nCompanyid uuid;
isAdmin boolean default false;
cSortby text;cSorttype text;
factids jsonb;
    sql_query TEXT;
	jFilter jsonb;
	filter_string text;
    nBundledetailid uuid;
	historyEnabled boolean;
	nID uuid;
	fga_factids jsonb;
	
	nRoleid uuid;nTeamid uuid;nCaseid uuid;
	bIsTranscipt boolean default false;
begin
-- select et_navigate_facts_bycompany('{ ""nCompanyid"": 5852, ""nMasterid"": 59 }','r1','r2','r3');fetch all in ""r2""

nSesid := NULLIF(parameter ->>'nSesid','')::uuid;
nCompanyid := NULLIF(parameter ->>'nCompanyid','')::uuid;
nMasterid := NULLIF(parameter ->>'nUserid','')::uuid;
cSorttype := parameter ->>'cSorttype';
cSortby := parameter ->>'cSortby';
	jFilter := coalesce(parameter ->>'jFilter','[]')::jsonb;
    nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
    bIsTranscipt := COALESCE(parameter ->> 'bIsTranscipt','false')::boolean;

-- fga_factids := parameter->>'jFactids';

isAdmin := case when exists (  select * from "UserMaster" where "nUserid" = nMasterid and "isAdmin" = true )  then true  else false  end;
 	if(nBundledetailid is not null) then
	 	select "nCaseid" into nCaseid from bundlesource where  "nBundledetailid" =  nBundledetailid;
	 else 
		select "nCaseid" into nCaseid from "RSessionMaster" where "nSesid" = nSesid;
	 end if;

	select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nMasterid and "nCaseid" = nCaseid limit 1;
	raise notice 'nSesid ,nCaseid , nRoleid %,%,%',nSesid,nCaseid,nRoleid ;
	if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then 
		isAdmin := true;
	end if;

historyEnabled := COALESCE(parameter ->> 'historyEnabled','false')::boolean;
	nID := (case when nSesid  is not distinct from null then nBundledetailid else nSesid end);

--  SELECT jsonb_agg(distinct f."nFSid") into factids
--     FROM "FactMaster" f
--     JOIN "FactDetail" d ON d."nFSid" = f."nFSid"
--     LEFT JOIN "FMTasks" t ON t."nFSid" = f."nFSid"
--         LEFT JOIN "TaskDetail" td ON td."nTaskid" = t."nTaskid"
--     LEFT JOIN "FMIssue" i ON i."nFSid" = f."nFSid"
--         LEFT JOIN "RIssueMaster" im ON im."nIid" = i."nIssueid"
--     LEFT JOIN "FMShared" s ON s."nFSid" = f."nFSid"
--     LEFT JOIN "FMContact" c ON c."nFSid" = f."nFSid"
-- 		left join "ContactMaster" cm on cm."nContactid" = c."nContactid"
--     LEFT JOIN "FMLinks" l ON l."nFSid" = f."nFSid"
-- 	where (f."nSesid" is not distinct from nSesid or f."nBundledetailid" is not distinct from nBundledetailid)
-- 	and 
-- 	 CASE WHEN nCompanyid IS NULL THEN cm."nCompanyid" IS NULL ELSE cm."nCompanyid" = nCompanyid END
-- 	 AND (f."nUserid" = nMasterid OR s."nUserid" = nMasterid);

sql_query := 'SELECT jsonb_agg(distinct f."nFSid")
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
			  '||(
                CASE WHEN historyEnabled = true 
                     THEN 'JOIN realtime.history_marknav('|| quote_nullable(nSesid) ||','|| quote_nullable(nBundledetailid) ||','|| quote_nullable(nMasterid) ||',''F'','|| 1 || ') his ON his."id" = f."nFSid"'
                     ELSE '' END
              ) ||'
			  left join "TeamRelation" tr ON tr."nTeamid" = '''|| nTeamid ||'''
			 WHERE (f."nSesid" IS NOT DISTINCT FROM ' || quote_nullable(nSesid) || '
              OR f."nBundledetailid" IS NOT DISTINCT FROM ' || quote_nullable(nBundledetailid) || ')
              AND (f."nUserid" = ' || quote_nullable(nMasterid) || '
              OR s."nUserid" = ' || quote_nullable(nMasterid) || ' or (case when ''' || isAdmin || '''::boolean = true then  f."nUserid" = tr."nUserid" else false end))
			  '||(
                    CASE WHEN nCompanyid IS NULL  
                    THEN 'AND cm."nCompanyid" IS NULL' 
                    ELSE 'AND cm."nCompanyid" = ' || quote_nullable(nCompanyid) 
                    END
                );

			
			IF jFilter IS NOT NULL AND jFilter <> '{}'::jsonb THEN
			
				sql_query := sql_query || '
				AND EXISTS (
				SELECT *
				FROM realtime.filter_marknav(''' || jFilter::text || '''::jsonb,
				' || quote_nullable(nID) || ',
				' || quote_nullable(nMasterid) || ',
				''F'',' || quote_nullable(nTeamid) || ','|| isAdmin ||') t
				WHERE t."id" = f."nFSid"
				)';
			END IF;

raise notice 'sql_query %', sql_query;
EXECUTE sql_query INTO factids;

IF factids IS NULL THEN
    factids := '[]'::jsonb;
END IF;

/*
IF historyEnabled = false THEN
factids := coalesce(fga_factids, '[]'::jsonb) || coalesce(factids, '[]'::jsonb);
END IF;
*/

raise notice 'factids %', factids;

-- select * from "ContactMaster" limit 0 
	open ref1 for 
	  SELECT f."nFSid", f."dCreateDt", um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",um."nUserid",
        fd."nFiletype", fd."nTZid", "jLinktype", fd."cType", f."cFType", --tz."cCodename" AS "cTimezone",
        fd."jTexts", fd."jOT", fd."nColorid", fd."nStatus", cl."cColor" AS "cColor", fd."jDate", cm."cCodename" as "cDatetype",
		st."cCodename" as "cStatus", ftp."cCodename" as "cFiletype",
		fc."nContactid",cf."cProfile",cf."cFname",cf."cLname",
		fd."jCordinates",
		-- CASE on bIsTranscipt so the published view picks up nTPage written by
		-- run3.py during transferAnnotations. Mirrors et_marks.sql:57-58.
		CASE WHEN COALESCE(bIsTranscipt,false) THEN fd."nTPage" ELSE fd."nPage" END AS "nPage",
		cr."cRole",
		pr."cCodename" "cPartyname",
		cf."cMentiontag",
		f."nBundledetailid" ,
		count(s."nFMSdid") as "t_shared",
	count(ft."nFMTsid") as "t_tasks",
	count(fc."nFMCid") as "t_contact",
	cmt."total" as "t_comments"
    FROM "FactMaster" f
    JOIN "UserMaster" um ON um."nUserid" = f."nUserid"
    JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"
 	join "FMContact" fc on fc."nFSid" = f."nFSid"
	join "ContactMaster" cf on cf."nContactid" = fc."nContactid" and cf."nCompanyid" = nCompanyid
    JOIN "RIssueMaster" cl ON cl."nIid" = fd."nColorid"
		
	left join "FMShared" s on s."nFSid" = f."nFSid"
	left join "FMTasks" ft on ft."nFSid" = f."nFSid"
		
	left join "Codemaster" cm on cm."nCodeid" = (fd."jDate"->>'nValue')::int
    -- JOIN "Codemaster" tz ON tz."nCodeid" = fd."nTZid"
	left join "Codemaster" st on st."nCodeid" = fd."nStatus"
	left join "Codemaster" ftp on ftp."nCodeid" = fd."nFiletype"
	LEFT JOIN "Codemaster" pr ON pr."nCodeid" = cf."nPartyid"
	LEFT JOIN "ContactRole" cr ON cr."nCRoleid" = cf."nRoleid"
	left join realtime."comments" cmt on cmt."nFSid" = f."nFSid"
    WHERE  factids @> to_jsonb(f."nFSid")
      -- Orphan filter: on the published view, suppress facts whose annotation
      -- could not be re-anchored. Mirrors et_marks.sql:48-50.
      AND (
        COALESCE(bIsTranscipt, false) = false
        OR (fd."cTransferStatus" IS DISTINCT FROM 'O' AND fd."jTCordinates" IS NOT NULL)
      )
	group by f."nFSid",f."dCreateDt",um."cFname" ,um."cLname",um."nUserid",
        fd."nFiletype",fd."nTZid", -- tz."cCodename",
        "jLinktype",fd."cType",f."cFType",fd."jTexts",fd."jOT",
        fd."nColorid",cl."cColor",fd."jDate",fd."nStatus",
		fd."jCordinates",
		fd."nPage", fd."nTPage",
		cm."cCodename",st."cCodename",ftp."cCodename",fc."nContactid",cf."cProfile",cf."cFname",cf."cLname",
		cf."cMentiontag",
		f."nBundledetailid",
		cr."cRole",
		pr."cCodename",
		cmt."total"
	order by 
	  -- f."dCreateDt" desc; 
	 --  	CASE WHEN cSortby = 'asc' THEN f."dCreateDt" END ASC,
		-- CASE WHEN cSortby = 'desc' THEN f."dCreateDt" END DESC,
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
		  -- WHERE f."nFSid" = ANY(factids)
		WHERE  factids @> to_jsonb(f."nFSid")
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
		  -- WHERE fl."nFSid" = ANY(factids)
		  		WHERE  factids @> to_jsonb(fl."nFSid") ;
		 
	 RETURN next ref3;
	 
    END;
$function$
