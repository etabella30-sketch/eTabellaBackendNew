CREATE OR REPLACE FUNCTION public.et_sidenave_tasks_facttaskissues(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nCaseid uuid;
    sql_query TEXT;jFilter jsonb default '[]'::jsonb;
	filter_string text;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
jFilter := coalesce((parameter->>'jFilter')::jsonb,'[]'::jsonb);

/*

select * From et_sidenave_tasks_facttaskissues('{"nMasterid":2,"cFacttype":"ALL","nCaseid":289}','r1');fetch all in "r1";

select * from "TaskMatser"
select * from "FMTasks"
select * from "IssueCategory"

*/

filter_string := (select filter_whereclause_2(jFilter,'TSK'));
sql_query := ('WITH incomming_links AS (
				select l."nBundledetailid",f."nFSid",f."nUserid" from "FactMaster" f 
				join "FMLinks" l on l."nFSid" = f."nFSid"
				where f."nUserid" = ''' || nMasterid || '''::uuid 		
		) select fi."nIssueid", fi."nImpactid", fi."nRelevanceid",
           im."nICid", ic."cCategory", im."cIName", im."cColor",count(distinct ft."nTaskid") as "nTotal",ic."cICtype"
	from "FactMaster" f
	join "FMTasks" ft on ft."nFSid" = f."nFSid"	
	join "TaskMaster" tm on tm."nTaskid" = ft."nTaskid"
	left join "TaskDetail" td on td."nTaskid" = ft."nTaskid" 	
	join "FMIssue" fi on fi."nFSid" = ft."nFSid"
	join "RIssueMaster" im on im."nIid" = fi."nIssueid"
    JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"
	left join "TaskShared" ts on ts."nTaskid" = ft."nTaskid"
	LEFT JOIN "FMShared" fs ON fs."nFSid" = f."nFSid"
   left join incomming_links ifs ON ifs."nFSid" = f."nFSid"
	where (f."nCaseid" = '''||nCaseid||'''::uuid and (
	(f."nUserid" = '''||nMasterid||'''::uuid) or 
	(ts."nUserid" = '''||nMasterid||'''::uuid)
	))
	' || (case when filter_string is not null then (' and (' || filter_string || ') ') else '' end)  || ' 
	group by fi."nIssueid", fi."nImpactid", fi."nRelevanceid",
           im."nICid", ic."cCategory", im."cIName", im."cColor",ic."cICtype"
	order by coalesce(ic."cICtype",''A'')');

    RAISE NOTICE 'Filter String: %', sql_query;

open ref for
--	select sql_query;
 EXECUTE sql_query;

/*
			  
			  open ref for
	select fi."nIssueid", fi."nImpactid", fi."nRelevanceid",
           i."nICid", ic."cCategory", i."cIName", i."cColor",count(distinct ft."nTaskid") as "nTotal",ic."cICtype"
	from "FactMaster" f
	join "FMTasks" ft on ft."nFSid" = f."nFSid"
	join "FMIssue" fi on fi."nFSid" = ft."nFSid"
	join "RIssueMaster" i on i."nIid" = fi."nIssueid"
    JOIN "IssueCategory" ic ON ic."nICid" = i."nICid"
	where f."nUserid" = nMasterid and f."nCaseid" = nCaseid
	group by fi."nIssueid", fi."nImpactid", fi."nRelevanceid",
           i."nICid", ic."cCategory", i."cIName", i."cColor",ic."cICtype"
	order by coalesce(ic."cICtype",'A')
	;
*/
	
 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
