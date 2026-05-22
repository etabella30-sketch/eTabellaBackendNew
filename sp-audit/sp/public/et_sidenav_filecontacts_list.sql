CREATE OR REPLACE FUNCTION public.et_sidenav_filecontacts_list(parameter json, ref refcursor)
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
	cSearch text;

BEGIN
    -- Apply P-1: Blank string → NULL conversion for UUID parameters
    nMasterid := NULLIF(parameter ->>'nMasterid', '')::uuid;
    nCaseid := NULLIF(parameter ->>'nCaseid', '')::uuid;
    jFilter := coalesce((parameter->>'jFilter')::jsonb,'[]'::jsonb);
	cSearch := COALESCE(TRIM(parameter ->> 'cSearch'), '');

	

/*
select * from et_sidenav_filecontacts_list ('{"nCaseid":"c21acb04-16cd-4aba-a966-490a13c7ffec","jFilter":"[]","nMasterid":"8166acd3-70e8-47ce-8362-443cd69b9b37"}','r1');fetch all in "r1";
select * From et_sidenav_filecontacts_list('{"nMasterid":"8166acd3-70e8-47ce-8362-443cd69b9b37","nCaseid":"c21acb04-16cd-4aba-a966-490a13c7ffec"}','r1');fetch all in "r1";

select * From "FactMaster" 
select * From "FactDetail" limit 0
select * From "FMContact" 
select * From "ContactCompany" 
select * From "ContactMaster" 

*/
-- select * from "BDContacts"

    filter_string := (select filter_whereclause(jFilter,'FILEC'));
    
    -- Apply P-12: Dynamic SQL with proper UUID casting
    sql_query := 'select c."nContactid",c."cProfile",c."cFname",c."cLname",c."cEmail" ,cc."nCompanyid",cc."cCompany"
    from "ContactMaster" c 
    left join "ContactCompany" cc on cc."nCompanyid" = c."nCompanyid"
    left join "BDContacts" bc on bc."nContactid" = c."nContactid"
    left join "FactMaster" fm on fm."nBundledetailid" = bc."nBundledetailid" and fm."nUserid" = ''' || nMasterid || '''::uuid			  
    left join "FMContact" fc on  fc."nFSid" = fm."nFSid" 
    left join "FMIssue" fi on fi."nFSid" = fm."nFSid"
    left join "RIssueMaster" im on im."nIid" = fi."nIssueid"
    left join "FactDetail" d on d."nFSid" = fm."nFSid"
	LEFT JOIN "BundleDetail" bd ON bd."nBundledetailid" = bc."nBundledetailid"
	WHERE c."nCaseid" = ''' || nCaseid || '''::uuid
	AND c."nUserid" = ''' || nMasterid || '''::uuid';

	 -- Add dynamic filter if exists
    IF filter_string IS NOT NULL AND filter_string <> '' THEN
        sql_query := sql_query || ' AND (' || filter_string || ')';
    END IF;

	 -- Add search condition
    IF cSearch <> '' THEN
        sql_query := sql_query || ' AND (
            (c."cFname" || '' '' || c."cLname") ILIKE ''%' || cSearch || '%'' OR
            c."cEmail" ILIKE ''%' || cSearch || '%'' OR
            cc."cCompany" ILIKE ''%' || cSearch || '%'' OR
            bd."cFilename" ILIKE ''%' || cSearch || '%''
        )';
    END IF;

	 sql_query := sql_query || '
        GROUP BY 
            c."nContactid", c."cProfile", c."cFname", c."cLname", 
            c."cEmail", cc."nCompanyid", cc."cCompany"';

	
    -- where (c."nCaseid" = ''' || nCaseid || '''::uuid and c."nUserid" = ''' || nMasterid || '''::uuid)
    --  ' || (case when filter_string is not null then (' and (' || filter_string || ') ') else '' end)  || ' 
    -- group by c."nContactid",c."cProfile",c."cFname",c."cLname",c."cEmail" ,cc."nCompanyid",cc."cCompany"');

    RAISE NOTICE 'Filter String: %', sql_query;

    open ref for EXECUTE sql_query;

/*
open ref for
    select c."nContactid",c."cProfile",c."cFname",c."cLname",c."cEmail" ,cc."nCompanyid",cc."cCompany"
    from "ContactMaster" c 
    left join "ContactCompany" cc on cc."nCompanyid" = c."nCompanyid"
    where c."nCaseid" = nCaseid and c."nUserid" = nMasterid
    group by c."nContactid",c."cProfile",c."cFname",c."cLname",c."cEmail" ,cc."nCompanyid",cc."cCompany" 

    ; */

    RETURN ref;  -- Return the cursor to the caller
END;
$function$
