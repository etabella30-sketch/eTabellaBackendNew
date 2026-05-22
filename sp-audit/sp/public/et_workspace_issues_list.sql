CREATE OR REPLACE FUNCTION public.et_workspace_issues_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare 
    nMasterid uuid;
    nCaseid uuid;
    sql_query TEXT;
    jFilter jsonb default '[]'::jsonb;
    filter_string text;
    ZeroUUID uuid := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
    nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
    nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
    jFilter := coalesce((parameter->>'jFilter')::jsonb,'[]'::jsonb);

    /*
    select * From et_workspace_issues_list('{"nMasterid":"00000000-0000-0000-0000-000000000001","nCaseid":"00000000-0000-0000-0000-000000000289","jFilter":"[{\"name\":\"ISSUE\",\"type\":\"V\",\"value\":[\"00000000-0000-0000-0000-000000000002\",\"00000000-0000-0000-0000-000000000003\"]}]"}','r1');fetch all in "r1";
    
    select * From "FactMaster" 
    select * From "FactDetail" limit 1
    select * From "FMContact" 
    select * From "ContactCompany" 
    select * From "FMContact" 
    */

    filter_string := (select filter_whereclause(jFilter,'WRK'));

    sql_query := ('select im."nIid",im."cIName",im."cColor",im."nICid",ic."cCategory",ic."cICtype",jsonb_agg(distinct "cFType") "jFType"
        from "RIssueMaster" im
        join "IssueCategory" ic on ic."nICid" = im."nICid"
        join "FMIssue" fi on fi."nIssueid" = im."nIid"
        join "FactDetail" d on d."nFSid" = fi."nFSid"
        join "FactMaster" f on f."nFSid" = d."nFSid"
		LEFT JOIN "FMShared" fs ON fs."nFSid" = f."nFSid"
        left join "FMContact" fc on fc."nFSid" = d."nFSid"
        where (im."nCaseid" = ''' || nCaseid || '''::uuid and (f."nUserid" = ''' || nMasterid || '''::uuid or fs."nUserid" = ''' || nMasterid || '''::uuid))
          ' || (case when filter_string is not null then (' and (' || filter_string || ') ') else '' end)  || ' 
        group by im."nIid",im."cIName",im."cColor",im."nICid",ic."cCategory",ic."cICtype"');

    open ref for EXECUTE sql_query;
    
    RETURN ref;                                                       -- Return the cursor to the caller
END;
$function$
