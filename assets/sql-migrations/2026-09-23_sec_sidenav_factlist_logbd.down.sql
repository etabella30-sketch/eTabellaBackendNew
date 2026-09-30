-- 2026-09-23_sec_sidenav_factlist_logbd (ROLLBACK - restores the exact dev bodies dumped 2026-09-23)
--
-- Security remediation phase 5 (SQL injection sweep, part A): three more client values were spliced between
-- quotes in dynamic SQL.
--   public.et_sidenav_filecontacts_list  (GET coreapi sidenav/contact/filecontacts): cSearch went raw into four
--       ILIKE '%<cSearch>%' patterns. The pattern is now quote_literal('%' || cSearch || '%') - identical text for
--       ordinary input; % and _ in cSearch still act as ILIKE wildcards, as before. (Its jFilter goes through
--       public.filter_whereclause, fixed in 2026-09-23_sec_navigate_jfilter_sqli.)
--   public.et_navigate_factlist  (GET coreapi navigation/factlist): cFType was spliced as  f."cFType" = '<cFType>'.
--       Now  f."cFType" = quote_literal(cFType)  - the form realtime.et_navigate_factlist already uses. Its jFilter
--       goes through public.filter_whereclause_2 (2026-09-23_sec_filter_whereclause_2).
--   public.log_bd_change(uuid, text, text, uuid, uuid)  (called 6x by et_admin_update_bundledetail, POST coreapi
--       bundles-creations/updatebundledetail): the new value (cTab / cFilename / cExhibitno / cDesc / dIntrestDt / cAuthor)
--       and the stored old value were put into format('''%s''') - so a value with a quote broke, or rewrote, the
--       LogBDUpdate INSERT (errors were swallowed by the caller's EXCEPTION block, so the whole log was silently
--       lost). Both are now %L-quoted, with NULL still logged as '' as before; the uuid slots are unchanged. A value
--       containing a quote is now logged instead of silently dropping the log.
--       The legacy integer overload log_bd_change(integer, ...) already uses %L and is not touched.
--
-- No service change needed. Signatures and result shapes are unchanged.
-- Dev vs prod (2026-09-22 backup): et_sidenav_filecontacts_list and log_bd_change are identical; the prod
-- et_navigate_factlist is older (no nReviewid / cReview) - run migrations/prod_etabella_com_uuid_2026-09-15.sql on
-- prod first; that body then equals dev except for CR / trailing whitespace, so re-dump it and rebuild the
-- et_navigate_factlist block of the .down.sql from the prod dump (as below) before applying on prod.
--
-- OPERATOR: run against the intended database only. Check first:
--     SELECT current_database();   -- dev = etabella_tech_uuid, prod = etabella.com.uuid
-- No hard current_database() guard on purpose: this file is meant to be applied to dev first and to
-- prod later by the operator. Before applying anywhere, re-dump each function (pg_get_functiondef)
-- and diff it against the .down.sql file; if it differs, rebuild both files from that dump.
--
-- Drafted 2026-09-23 from the live dev bodies (etabella_tech_uuid). NOT applied anywhere.

BEGIN;

-- ============ public.et_sidenav_filecontacts_list ============
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
$function$;

-- ============ public.et_navigate_factlist ============
CREATE OR REPLACE FUNCTION public.et_navigate_factlist(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;
    nBundledetailid uuid;
    isAdmin boolean;
    cSortby text;
    cSorttype text;
    pageNumber int;
    offsetCount int;
    perPage int := 10;
    factids uuid[];
    sql_query TEXT;
	jFilter jsonb;
	filter_string text;
	cFType text;

BEGIN
    -- Extract parameters
    nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
    nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
    cSorttype := parameter->>'cSorttype';
    cSortby := parameter->>'cSortby';
    pageNumber := COALESCE((parameter->>'nPageNumber')::int, 1);
	jFilter := parameter ->>'jFilter';
    offsetCount := (pageNumber - 1) * perPage;
	cFType := NULLIF(parameter->>'cFType', '');

/*

select * from et_navigate_factlist ('{"nBundledetailid":555364,"cSorttype":"H","cSortby":"D","nPageNumber":1,"jFilter":"[{\"name\":\"CLAIM\",\"type\":\"V\",\"value\":[233,231,232]},{\"name\":\"CLAIM\",\"type\":\"C\",\"value\":\"AND\"},{\"name\":\"ISSUE\",\"type\":\"V\",\"value\":[1,2,3,4]},{\"name\":\"ISSUE\",\"type\":\"C\",\"value\":\"AND\"},{\"name\":\"TYPE\",\"type\":\"V\",\"value\":[5,6,8]},{\"name\":\"TYPE\",\"type\":\"C\",\"value\":\"AND\"},{\"name\":\"RELEVANCE\",\"type\":\"V\",\"value\":[13,15,16]},{\"name\":\"RELEVANCE\",\"type\":\"C\",\"value\":\"AND\"},{\"name\":\"IMPACT\",\"type\":\"V\",\"value\":[19,22,21]},{\"name\":\"IMPACT\",\"type\":\"C\",\"value\":\"OR\"},{\"name\":\"STATUS\",\"type\":\"V\",\"value\":[10,11]},{\"name\":\"STATUS\",\"type\":\"C\",\"value\":\"OR\"},{\"name\":\"CONTACT\",\"type\":\"V\",\"value\":[81,80,79]}]","nMasterid":2}','r1','r2','r3');fetch all in "r1";fetch all in "r2";fetch all in "r3";

*/

filter_string := (select filter_whereclause_2(jFilter,'FCH'));

  sql_query := 'select (array (SELECT distinct f."nFSid"
    FROM "FactMaster" f
    JOIN "FactDetail" d ON d."nFSid" = f."nFSid"
    LEFT JOIN "FMTasks" t ON t."nFSid" = f."nFSid"
        LEFT JOIN "TaskDetail" td ON td."nTaskid" = t."nTaskid"
    LEFT JOIN "FMIssue" i ON i."nFSid" = f."nFSid"
        LEFT JOIN "RIssueMaster" im ON im."nIid" = i."nIssueid"
    LEFT JOIN "FMShared" s ON s."nFSid" = f."nFSid"
    LEFT JOIN "FMContact" c ON c."nFSid" = f."nFSid"
    LEFT JOIN "FMLinks" l ON l."nFSid" = f."nFSid"
    WHERE f."nBundledetailid" = ''' || nBundledetailid || '''::uuid
    AND (f."nUserid" = ''' || nMasterid || '''::uuid OR s."nUserid" = ''' || nMasterid || '''::uuid)' || (CASE WHEN cFType IS NOT NULL THEN ' AND f."cFType" = ''' || cFType || '''' ELSE '' END) || (case when filter_string is not null then (' and (' || filter_string || ') ') else '' end) || '))';

    -- Get factids
		  EXECUTE sql_query INTO factids;
    --factids := EXECUTE sql_query;
	
	/*(array (SELECT distinct f."nFSid"
    FROM "FactMaster" f
    LEFT JOIN "FMShared" fs ON fs."nFSid" = f."nFSid"
    WHERE f."nBundledetailid" = nBundledetailid
      AND (f."nUserid" = nMasterid OR fs."nUserid" = nMasterid)
    GROUP BY f."nFSid", f."dCreateDt"
   -- ORDER BY f."dCreateDt" DESC
    --LIMIT perPage
    --OFFSET offsetCount 
));

select * from "FMTasks"
select * from "FMContact"
select * from "FMShared"

*/

    -- Open ref1
OPEN ref1 FOR 
    SELECT f."nFSid", f."dCreateDt", 
           um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
		   um."nUserid",
           fd."nFiletype", fd."nTZid", tz."cCodename" AS "cTimezone", 
           fd."jLinktype", fd."cType", f."cFType",
           fd."jTexts", fd."jOT", fd."nColorid", fd."nStatus", fd."nReviewid", 
           cl."cColor" AS "cColor", fd."jDate", 
           cm."cCodename" as "cDatetype",
           st."cCodename" as "cStatus", 
           ftp."cCodename" as "cFiletype",
           rv."cCodename" as "cReview",
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
    LEFT JOIN "Codemaster" rv ON rv."nCodeid" = fd."nReviewid"
    JOIN "RIssueMaster" cl ON cl."nIid" = fd."nColorid"
    WHERE f."nFSid" = ANY(factids)
	group by f."nFSid", f."dCreateDt", 
           um."cFname" ,um."cLname",um."nUserid",
           fd."nFiletype", fd."nTZid", tz."cCodename", 
           fd."jLinktype", fd."cType", f."cFType",
           fd."jTexts", fd."jOT", fd."nColorid", fd."nStatus", fd."nReviewid", 
           cl."cColor", fd."jDate",cm."cCodename",st."cCodename", ftp."cCodename", rv."cCodename"
	ORDER BY 
				 -- f."dCreateDt" desc
		CASE WHEN cSortby = 'asc' THEN f."dCreateDt" END ASC,
		CASE WHEN cSortby = 'desc' THEN f."dCreateDt" END DESC,
		f."dCreateDt" DESC; 

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
    WHERE f."nFSid" = ANY(factids)
    GROUP BY fi."nIssueid", fi."nImpactid", fi."nRelevanceid", 
             im."nICid", ic."cCategory", im."cIName", im."cColor",
             rl."cCodename", impct."cCodename";

    -- Open ref3
    OPEN ref3 FOR 	
    SELECT fl."nFSid",fl."nFMLid", fl."nBundledetailid", 
           bd."cFilename" AS "cName", bd."cExhibitno", bd."cTab", 
           fl."jLinktype", bd."cPage",b."cBundletag"
    FROM "FMLinks" fl
    JOIN "BundleDetail" bd ON bd."nBundledetailid" = fl."nBundledetailid"
	left JOIN "BundleMaster" b ON b."nBundleid" = bd."nBundleid" 
    WHERE fl."nFSid" = ANY(factids);

    RETURN NEXT ref1;
    RETURN NEXT ref2;
    RETURN NEXT ref3;
END;
$function$;

-- ============ public.log_bd_change(uuid, text, text, uuid, uuid) ============
CREATE OR REPLACE FUNCTION public.log_bd_change(p_nbundledetailid uuid, p_col_name text, p_new_value text, p_nbdacid uuid, p_nuserid uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    old_value text;
BEGIN
    -- Retrieve the current (old) value from BundleDetail dynamically
    EXECUTE format(
        'SELECT TRIM(%I) FROM "BundleDetail" WHERE "nBundledetailid" = ''%s''::uuid',
        p_col_name, p_nBundledetailid)
    INTO old_value;
    
    -- Compare old and new values (using COALESCE to handle nulls)
    IF COALESCE(old_value, '') <> COALESCE(TRIM(p_new_value), '') THEN
        -- Log the old value if not already logged for this attribute
        PERFORM 1 FROM "LogBDUpdate"
         WHERE "nBDid" = p_nBundledetailid 
           AND "nBDACid" = p_nBDACid;
        IF NOT FOUND THEN
            EXECUTE format(
                'INSERT INTO "LogBDUpdate"("nBDid", "name", "nUserid", "nBDACid")
                 SELECT "nBundledetailid", ''%s'', "nCreateId", ''%s''::uuid
                   FROM "BundleDetail"
                  WHERE "nBundledetailid" = ''%s''::uuid LIMIT 1',
                old_value, p_nBDACid, p_nBundledetailid);
        END IF;
        -- Log the new value
        EXECUTE format(
            'INSERT INTO "LogBDUpdate"("nBDid", "name", "nUserid", "nBDACid")
             VALUES (''%s''::uuid, ''%s'', ''%s''::uuid, ''%s''::uuid)',
            p_nBundledetailid, TRIM(p_new_value), p_nUserid, p_nBDACid);
    END IF;
END;
$function$;

COMMIT;
