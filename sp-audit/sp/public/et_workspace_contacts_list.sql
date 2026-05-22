CREATE OR REPLACE FUNCTION public.et_workspace_contacts_list(parameter json, ref refcursor)
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
select * From et_workspace_contacts_list('{"nMasterid":2,"nCaseid":289}','r1');fetch all in "r1";

select * from et_workspace_contacts_list ('{"nCaseid":"344f20a3-527e-47df-b965-2934380fedc2","nMasterid":"0bfb963f-3dcb-46af-8d78-4b8bb86ccbee"}','r1');fetch all in "r1";

select * From "FactMaster" 
select * From "FactDetail" limit 0
select * From "FMIssue" 
select * From "ContactCompany" 
select * From "RIssueMaster" 
*/
filter_string := (select filter_whereclause(jFilter,'WRK'));
sql_query := ('select c."nContactid",c."cProfile",c."cFname",c."cLname",c."cEmail" ,cc."nCompanyid",cc."cCompany",count(fm."nFSid") "nFCount"
	from "ContactMaster" c 
	left join "ContactCompany" cc on cc."nCompanyid" = c."nCompanyid"
	join "FMContact" fc on  fc."nContactid" = c."nContactid" 
	join "FactMaster" fm on fm."nFSid" = fc."nFSid"
	LEFT JOIN "FMShared" fs ON fs."nFSid" = fm."nFSid"
	join "FMIssue" fi on fi."nFSid" = fm."nFSid"
	join "RIssueMaster" im on im."nIid" = fi."nIssueid"
	join "FactDetail" d on d."nFSid" = fm."nFSid"
	where (c."nCaseid" = '''||nCaseid ||'''::uuid)
	and (fm."nUserid" = '''||nMasterid ||'''::uuid  OR fs."nUserid" = '''|| nMasterid ||'''::uuid)
	 ' || (case when filter_string is not null then (' and (' || filter_string || ') ') else '' end)  || ' 
	group by c."nContactid",c."cProfile",c."cFname",c."cLname",c."cEmail" ,cc."nCompanyid",cc."cCompany"');
    RAISE NOTICE 'Filter String: %', sql_query;
open ref for
	
	
EXECUTE sql_query
	/*select c."nContactid",c."cProfile",c."cFname",c."cLname",c."cEmail" ,cc."nCompanyid",cc."cCompany"
	from "ContactMaster" c 
	left join "ContactCompany" cc on cc."nCompanyid" = c."nCompanyid"
	join "FMContact" fc on  fc."nContactid" = c."nContactid" 
	join "FactMaster" fm on fm."nFSid" = fc."nFSid" and fm."nUserid" = nMasterid
	where c."nCaseid" = nCaseid  
	group by c."nContactid",c."cProfile",c."cFname",c."cLname",c."cEmail" ,cc."nCompanyid",cc."cCompany" */
	/*select c."nContactid",c."cProfile",c."cFname",c."cLname",c."cEmail" ,cc."nCompanyid",cc."cCompany"
	from "ContactMaster" c 
	left join "ContactCompany" cc on cc."nCompanyid" = c."nCompanyid"
	join "FMContact" fc on  fc."nContactid" = c."nContactid" 
	join "FactMaster" fm on fm."nFSid" = fc."nFSid" and fm."nUserid" = nMasterid
	join "FMIssue" fi on fi."nFSid" = fm."nFSid"
	join "RIssueMaster" im on im."nIid" = fi."nIssueid"
	join "FactDetail" d on d."nFSid" = fm."nFSid"
	where c."nCaseid" = nCaseid 
	group by c."nContactid",c."cProfile",c."cFname",c."cLname",c."cEmail" ,cc."nCompanyid",cc."cCompany"*/
	;
	
 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
