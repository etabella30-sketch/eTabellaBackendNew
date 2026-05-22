CREATE OR REPLACE FUNCTION public.et_workspace_fact_files(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; cFacttype text; nCaseid uuid; nContactid uuid; nIssueid uuid;
    sql_query text;jFilter jsonb default '[]'::jsonb;
	filter_string text;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
cFacttype := parameter ->>'cFacttype';
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nContactid := NULLIF(parameter ->>'nContactid','')::uuid;
nIssueid := NULLIF(parameter ->>'nIssueid','')::uuid;
jFilter := coalesce((parameter->>'jFilter')::jsonb,'[]'::jsonb);

/*

select * From et_workspace_fact_files('{"nMasterid":2,"nCaseid":289,"cFacttype":"ALL"}','r1');fetch all in "r1";
select * from "FMLinks"
*/

filter_string := (select filter_whereclause_2(jFilter,'WRK'));
raise notice 'filter_string %',filter_string;

sql_query = 'WITH incomming_links AS (
				select l."nBundledetailid",f."nFSid",f."nUserid" from "FactMaster" f 
				join "FMLinks" l on l."nFSid" = f."nFSid"
				where f."nUserid" = ''' || nMasterid || '''::uuid 		
		) SELECT fl."nFSid", fl."nFMLid", fl."nBundledetailid", 
                bd."cFilename", bd."cExhibitno", bd."cTab", 
                fl."jLinktype",fl."jOTexts"
         FROM "FMLinks" fl
         JOIN "FactMaster" f ON f."nFSid" = fl."nFSid"
         LEFT JOIN "FMShared" fs ON fs."nFSid" = f."nFSid"
         JOIN "bundlesource" bd ON bd."nBundledetailid" = fl."nBundledetailid"
         JOIN "FMIssue" fi ON fi."nFSid" = f."nFSid"
	
		left join "FMTasks" ft on ft."nFSid" = f."nFSid"	
		left join "TaskDetail" td on td."nTaskid" = ft."nTaskid" 	
    	 JOIN "FactDetail" d ON d."nFSid" = f."nFSid"
		 JOIN "RIssueMaster" im ON im."nIid" = fi."nIssueid"
    	 JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"
	
         LEFT JOIN "FMContact" fc ON fc."nFSid" = f."nFSid"
		 left join incomming_links ifs ON ifs."nFSid" = f."nFSid"
         WHERE (f."nUserid" = ''' || nMasterid || '''::uuid OR fs."nUserid" = ''' || nMasterid || '''::uuid)
           AND f."nCaseid" = ''' || nCaseid || '''::uuid
           AND (' || quote_literal(cFacttype) || ' = ''ALL'' OR f."cFType" = ' || quote_literal(cFacttype) || ')
           AND (' || CASE WHEN nIssueid IS NULL THEN 'true' ELSE 'fi."nIssueid" = ''' || nIssueid || '''::uuid' END || ')
           AND (' || CASE WHEN nContactid IS NULL THEN 'true' ELSE 'fc."nContactid" = ''' || nContactid || '''::uuid' END || ')
	 		' || (case when filter_string is not null then (' and (' || filter_string || ') ') else '' end)  || ' 
         GROUP BY fl."nFSid", fl."nFMLid", fl."nBundledetailid", 
                  bd."cFilename", bd."cExhibitno", bd."cTab", 
                  fl."jLinktype",fl."jOTexts", f."dCreateDt"
         ORDER BY f."dCreateDt" DESC';
raise notice 'sql_query %',sql_query;
open ref for

		 
	
	
	--select 1 as msg,sql_query
EXECUTE sql_query
	;

	
 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
