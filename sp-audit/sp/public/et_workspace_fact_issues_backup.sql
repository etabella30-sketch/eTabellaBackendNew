CREATE OR REPLACE FUNCTION public.et_workspace_fact_issues_backup(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; cFacttype text; nCaseid uuid; nContactid uuid; nIssueid uuid;
    sql_query TEXT; jFilter jsonb default '[]'::jsonb;
	filter_string text;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
cFacttype := parameter ->>'cFacttype';
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nContactid := NULLIF(parameter ->>'nContactid','')::uuid;
nIssueid := NULLIF(parameter ->>'nIssueid','')::uuid;
jFilter := coalesce((parameter->>'jFilter')::jsonb,'[]'::jsonb);

/*

select * From et_workspace_fact_issues('{"nMasterid":2,"cFacttype":"ALL","nCaseid":289,"jFilter":"[{\"name\":\"ISSUE\",\"type\":\"V\",\"value\":[2,3]}]"}','r1');fetch all in "r1";

select * From "FactMaster" 
select * From "FactDetail" limit 0
select * From "FMIssue" 
select * From "RIssueMaster" 
select * From "Codemaster" 

*/

filter_string := (select filter_whereclause_2(jFilter,'WRK'));

sql_query := ('with incomming_links AS (
						select l."nBundledetailid",f."nFSid",f."nUserid" from "FactMaster" f 
						join "FMLinks" l on l."nFSid" = f."nFSid"
						where f."nUserid" = ''' || nMasterid || '''::uuid 			
				) 
				SELECT f."nFSid",
                fi."nIssueid", fi."nImpactid", fi."nRelevanceid",
                im."nICid", ic."cCategory", im."cIName", im."cColor",
                rl."cCodename" AS "cRelevance",
                impct."cCodename" AS "cImpact",
                rl."nSerialno" AS "nRelevanceseq",
                impct."nSerialno" AS "nImpactseq"
         FROM "FactMaster" f 
         JOIN "FactDetail" d ON d."nFSid" = f."nFSid"
         LEFT JOIN "FMShared" fs ON fs."nFSid" = f."nFSid"
		left join "FMTasks" ft on ft."nFSid" = f."nFSid"	
		left join "TaskDetail" td on td."nTaskid" = ft."nTaskid" 	
         JOIN "FMIssue" fi ON fi."nFSid" = f."nFSid"
         JOIN "RIssueMaster" im ON im."nIid" = fi."nIssueid"
         JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"
         LEFT JOIN "FMContact" fc ON fc."nFSid" = f."nFSid"
         LEFT JOIN "Codemaster" rl ON rl."nCodeid" = fi."nRelevanceid"
         LEFT JOIN "Codemaster" impct ON impct."nCodeid" = fi."nImpactid"
		 left join "DocMaster" idl on idl."nBundledetailid" = f."nBundledetailid" and idl."nUserid" = ''' || nMasterid || '''::uuid 
		 left join incomming_links ifs ON ifs."nFSid" = f."nFSid"
         WHERE ((f."nUserid" = ''' || nMasterid || '''::uuid OR fs."nUserid" = ''' || nMasterid || '''::uuid)
           AND f."nCaseid" = ''' || nCaseid || '''::uuid
           AND (' || quote_literal(cFacttype) || ' = ''ALL'' OR f."cFType" = ' || quote_literal(cFacttype) || ')
           AND (' || CASE WHEN nIssueid IS NULL THEN 'true' ELSE 'fi."nIssueid" = ''' || nIssueid || '''::uuid' END || ')
           AND (' || CASE WHEN nContactid IS NULL THEN 'true' ELSE 'fc."nContactid" = ''' || nContactid || '''::uuid' END || '))
		   ' || (case when filter_string is not null then (' and (' || filter_string || ') ') else '' end)  || ' 
         GROUP BY f."nFSid",
                fi."nIssueid", fi."nImpactid", fi."nRelevanceid",
                im."nICid", ic."cCategory", im."cIName", im."cColor",
                rl."cCodename", impct."cCodename", rl."nSerialno", impct."nSerialno"
         ORDER BY f."dCreateDt" DESC');

open ref for
EXECUTE sql_query;
		
		

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
