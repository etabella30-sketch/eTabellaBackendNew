-- 2026-09-23_sec_bundledetail_sqli (ROLLBACK - restores the exact dev bodies dumped 2026-09-23)
--
-- Security remediation phase 5 (SQL injection sweep, part B): the evidence document list / search and the
-- admin document store built their dynamic SQL by pasting request values between quotes, unescaped.
--   public.et_bundledetail             (GET bundles/bundledetail)         cFiletype x7, cSortby x2 and
--                                      jFilter[0]->>'name' between quotes; cSorttype unquoted in ORDER BY
--   public.et_bundledetail_search      (GET bundles/bundledetail-search)  cFiletype x7, cLocation x3,
--                                      contentType x15 as a literal and x5 as a column name, searchName x19,
--                                      cSortby, cSorttype (unquoted, ORDER BY), the jsonb text of jFilter.jFTypes /
--                                      jIssues / jImpact / jRelevance / jMarkup / searchedBundles, and
--                                      jFilter.fileFilter[0]->>'name'
--   public.et_admin_bundles_filetypes  (GET bundles/bundletypes)          jFilter.cLocation, jFilter.cMatchCase
--                                      (searchName x18), contentType x8, the jsonb text of jFTypes / jIssues /
--                                      jImpact / jRelevance / jMarkup, fileFilter[0]->>'name'
--   public.et_admin_searched_bundles   (GET bundles/searched-bundles)     the same jFilter values, plus the stored
--                                      SectionMaster.cFoldertype x7 and the sub-bundle id list
-- Any caller could end the literal with a quote and append SQL (a cSorttype of  ASC, (select ...)  ran as-is).
-- The coreapi DTOs (BundleDetailReq, bundleTypesReq) only check @IsString; jFilter is a free JSON string.
--
-- Fix: those values are spliced with quote_literal(), and contentType-as-column with quote_ident(). cSorttype is
-- mapped to ASC / DESC (case-insensitive, surrounding blanks / tabs / newlines ignored as the SQL parser did;
-- anything else -> ASC, the existing default); both frontends only send
-- ASC / DESC. cSortby stays a free value: it is only compared inside CASE, so quoting it keeps every sort key
-- the frontends send (new: cTab; legacy grid: cTab, cBundletag, cName, cPage, cExhibitno, cFiletype, dIntrestDt,
-- cDescription, cAuthor, '', plus 'similarity' for the search) and an unknown key falls to the same ELSE
-- branch as before. A NULL SectionMaster.cFoldertype (nSectionid null / unknown) still gives the NULL-query error.
-- For any value without a quote or backslash the generated SQL is byte-identical, so rows and order are
-- unchanged; a NULL still nulls the whole query as before (quote_literal / quote_ident are strict).
-- cSearch was already escaped with REPLACE(cSearch, '''', '''''') (safe: standard_conforming_strings = on)
-- and is left as is. uuid / int / boolean / date values are typed and were already safe.
--
-- NOT covered here (separate migration): public.filter_whereclause_2 builds the WHERE text from
-- jFilter / fileFilter, and all four functions still splice its output as SQL.
--
-- PROD: three of these bodies (et_bundledetail, et_bundledetail_search, et_admin_bundles_filetypes) are
-- newer on dev than on prod; migrations/prod_etabella_com_uuid_2026-09-15.sql brings prod to the same code
-- (it differs from dev only in trailing whitespace / CRLF). Run that first, then this file.
-- et_admin_searched_bundles is identical on dev and prod.
-- LINE ENDINGS: on dev those three bodies are stored with CRLF. This file keeps them byte-exact so the
-- .down.sql restores the identical text (md5 of pg_get_functiondef). Do not let an editor or git
-- normalise CRLF -> LF in this pair (harmless for behaviour, but the down would no longer be byte-exact).
--
-- OPERATOR: run against the intended database only. Check first:
--     SELECT current_database();   -- dev = etabella_tech_uuid, prod = etabella.com.uuid
-- No hard current_database() guard on purpose: this file is meant to be applied to dev first and to
-- prod later by the operator. Before applying anywhere, re-dump each function (pg_get_functiondef)
-- and diff it against the .down.sql file; if it differs, rebuild both files from that dump.
--
-- Drafted 2026-09-23 from the live dev bodies (etabella_tech_uuid). NOT applied anywhere.

BEGIN;

-- ============ public.et_bundledetail ============
CREATE OR REPLACE FUNCTION public.et_bundledetail(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare 
    nMasterid uuid;
    pageNumber int;
    offsetCount int;
    perPage int default 30;
    nSectionid uuid;
    nBundleid uuid;
    explicit_null boolean := false;
    last_nBundledetailid uuid;
    cFiletype text;
    cSortby text;
    cSorttype text;
    sql_query text;
    isAdmin boolean default false;
    cFoldertype text;
	nStarttabid uuid;nEndtabid uuid;
	jFilter jsonb default '[]'::jsonb;
	filter_string text := '';
	filter_condition text := '';
	jFTypes jsonb default '[]'::jsonb;
BEGIN
-- select * from public.et_bundledetail_test ('{"nSectionid":"e38b6eff-b7dc-43cb-a4f5-8253e696dec6","nBundleid":"b111023e-078c-47f4-bbf8-3a07ae037e10","pageNumber":1,"cSearch":"","cFiletype":"ALL","cSortby":"cTab","cSorttype":"ASC","nStarttabid":null,"nEndtabid":null,"jFilter":"[{\"name\":\"LINK\",\"type\":\"V\",\"value\":[\"I\"]}]","nMasterid":"ba561c55-81f5-4180-8934-2ce6dcaa096c"}','r1');fetch all in "r1";

    nMasterid := (parameter ->>'nMasterid')::uuid;
    pageNumber := coalesce((parameter ->>'pageNumber')::int, 1);
    offsetCount := (pageNumber - 1) * perPage;
    
    IF parameter::jsonb ? 'nBundleid' AND parameter->>'nBundleid' IS NULL THEN
        explicit_null := true;
        nBundleid := NULL;
    ELSE
        nBundleid := (parameter ->>'nBundleid')::uuid;
    END IF;
    
    nSectionid := (parameter ->>'nSectionid')::uuid;
    last_nBundledetailid := (parameter ->>'last_nBundledetailid')::uuid;
    cFiletype := parameter ->>'cFiletype';
    cSortby := coalesce((parameter ->>'cSortby'), 'cTab');
    cSorttype := coalesce((parameter ->>'cSorttype'), 'ASC');
    nStarttabid := coalesce((parameter ->>'nStarttabid')::uuid, null);
    nEndtabid := coalesce((parameter ->>'nEndtabid')::uuid, null);
	jFilter := coalesce((parameter->>'jFilter')::jsonb,'[]'::jsonb);
	jFTypes := coalesce((parameter->>'jFTypes')::jsonb,'[]'::jsonb);
    
    cSortby := case when cSortby = 'cBundletag' then 'cTab' else cSortby end;

    filter_condition := 'filterdata AS (
        SELECT cr.* 
        FROM cr
    )';

	RAISE NOTICE 'jFilter - %',jFilter;

	

    IF jsonb_array_length(jFilter) > 0 THEN
        BEGIN
            filter_string := (select filter_whereclause_2(jFilter,'FILES'));
            
            IF filter_string IS NOT NULL AND filter_string != '' THEN
                filter_condition := 'incomming_links AS (
						select l."nBundledetailid",f."nUserid" from "FactMaster" f 
						join "FMLinks" l on l."nFSid" = f."nFSid"
						where f."nUserid" = ''' || nMasterid || '''::uuid 		
							union all 						
						select l."nBundledetailid",d."nUserid" from "DocMaster" d
						join "DMLinks" l on l."nDocid" = d."nDocid"
						where d."nUserid" = ''' || nMasterid || '''::uuid				
				),filter AS ( 
                    select cr."nBundledetailid"
                    from cr		
                    left join "FactMaster" f on cr."nBundledetailid" = f."nBundledetailid" and f."nUserid" = ''' || nMasterid || '''::uuid
					left join "FactDetail" d on d."nFSid" = f."nFSid"
					left join "BDTasks" bt on bt."nBundledetailid" = cr."nBundledetailid" and bt."nUserid" = ''' || nMasterid || '''::uuid
					left JOIN "FMContact" fc ON f."nFSid" = fc."nFSid"
                    left join "FMTasks" ft on ft."nFSid" = f."nFSid"	
                    left join "TaskDetail" td on td."nTaskid" = ft."nTaskid" or td."nTaskid" =  bt."nTaskid"		
                    LEFT join "FMIssue" fi on fi."nFSid" = ft."nFSid" or fi."nFSid" = f."nFSid"
                    LEFT join "RIssueMaster" i on i."nIid" = fi."nIssueid"
                    LEFT JOIN "IssueCategory" im ON im."nICid" = i."nICid"
                    LEFT join "TaskShared" ts on ts."nTaskid" = ft."nTaskid"
					left join "DocMaster" idl on idl."nBundledetailid" = cr."nBundledetailid" and idl."nUserid" = ''' || nMasterid || '''::uuid 
					left join "FMLinks" ofl on ofl."nFSid" = f."nFSid"
					left join incomming_links ifs on ifs."nBundledetailid" = cr."nBundledetailid"
					where (' || filter_string || ') and
					(f."nUserid" = ''' || nMasterid || '''::uuid or bt."nUserid" = ''' || nMasterid || '''::uuid  or idl."nUserid" = ''' || nMasterid || '''::uuid or ifs."nBundledetailid" = cr."nBundledetailid" or (' || jsonb_array_length(jFilter) || ' = 1  and '''|| (jFilter[0]->>'name') || ''' = ''DATE'' ))
					
                    group by cr."nBundledetailid"
                ),
                filterdata AS (
                    SELECT cr.* 
                    FROM cr
                    JOIN filter ON filter."nBundledetailid" = cr."nBundledetailid"
                )';
            END IF;
        EXCEPTION WHEN OTHERS THEN
        END;
    END IF;

    raise notice 'Filter % ,filter_condition %, explicit_null: %, nBundleid: %', 
                 filter_string, filter_condition, explicit_null, nBundleid;
    select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nMasterid;

    sql_query := '
    WITH ar AS (
        SELECT bd."nBundledetailid", bd."nBundleid", bd."cFilename" AS "cName", bd."cTab", bd."cExhibitno",bm."cBundletag",sorted_tab,bd.sorted_name,sorted_page,sorted_exhibitno,start_date, sorted_intrestdt,sorted_description,sorted_author,
               bd."cPage", bd."cRefpage", bd."cFilesize", bd."cFiletype", bd."dIntrestDt", bd."cDesc" AS "cDescription", bd."cIsindex",bd."cAuthor",bd."cPage" "cPageRange"
        FROM "BundleDetail" bd    
        LEFT JOIN "BDPermission" bp ON bp."nUserid" = ''' || nMasterid || '''::uuid AND bp."nBundledetailid" = bd."nBundledetailid"
		left join "BundleMaster" bm on bd."nBundleid" = bm."nBundleid"
        WHERE bd."nSectionid" = ''' || nSectionid || '''::uuid 
          AND ' || CASE WHEN explicit_null THEN '
		  coalesce(bd."nBundleid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid
		  ' 
                    WHEN nBundleid IS NULL THEN '1=1' 
                    ELSE 'bd."nBundleid" = ''' || nBundleid || '''::uuid' 
               END || '
          AND (CASE 
                  WHEN COALESCE(''' || cFiletype || ''', ''ALL'') = ''ALL'' THEN TRUE 
                  WHEN COALESCE(''' || cFiletype || ''', ''ALL'') = ''Other'' THEN COALESCE(bd."cFiletype", '''') = ''''
                  ELSE bd."cFiletype" = ''' || cFiletype || ''' 
               END)
          AND bd."cStatus" = ''C'' and 
		  coalesce("nBDPid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid
		 
    ), assign AS (
        SELECT distinct bd."nBundledetailid", ba."nBundleid", bd."cFilename" AS "cName", bd."cTab", bd."cExhibitno",bmd."cBundletag",
		sorted_tab,bd.sorted_name,sorted_page,sorted_exhibitno,start_date,sorted_intrestdt,sorted_description,sorted_author,
               bd."cPage", bd."cRefpage", bd."cFilesize", bd."cFiletype", bd."dIntrestDt", bd."cDesc" AS "cDescription", bd."cIsindex",bd."cAuthor",
			   coalesce(ba."cPage",bd."cPage") "cPageRange"
        FROM "BundleDetail" bd    
        JOIN "BDAssignment" ba ON ba."nBundledetailid" = bd."nBundledetailid" AND "nUserid" = ''' || nMasterid || '''::uuid
        LEFT JOIN "BDPermission" bp ON bp."nUserid" = ''' || nMasterid || '''::uuid AND bp."nBundledetailid" = bd."nBundledetailid"
		left join "BundleMaster" bm on ba."nBundleid" = bm."nBundleid"
        left join "BundleMaster" bmd on bmd."nBundleid" = bd."nBundleid"
        WHERE coalesce(bp."nBDPid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid
		AND  
            ba."nSectionid" = ''' || nSectionid || '''::uuid AND ' || 
            CASE WHEN explicit_null THEN 'ba."nBundleid" is null' 
                 WHEN nBundleid IS NULL THEN '1=1' 
                 ELSE 'ba."nBundleid" = ''' || nBundleid || '''::uuid' 
            END || ' 
            AND (CASE 
                    WHEN COALESCE(''' || cFiletype || ''', ''ALL'') = ''ALL'' THEN TRUE 
                    WHEN COALESCE(''' || cFiletype || ''', ''ALL'') = ''Other'' THEN COALESCE(bd."cFiletype", '''') = ''''
                    ELSE bd."cFiletype" = ''' || cFiletype || ''' 
                END)
            AND bd."cStatus" = ''C''
            AND case when ' || isAdmin ||' then true else 
			coalesce("nBDPid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid
			end 
    ), shared AS (
        SELECT bd."nBundledetailid", ba."nBundleid", bd."cFilename" AS "cName", bd."cTab", bd."cExhibitno",bm."cBundletag",
		sorted_tab,bd.sorted_name,sorted_page,sorted_exhibitno,start_date,sorted_intrestdt,sorted_description,sorted_author,
               bd."cPage", bd."cRefpage", bd."cFilesize", bd."cFiletype", bd."dIntrestDt", bd."cDesc" AS "cDescription", bd."cIsindex",bd."cAuthor",
			   coalesce(ba."cPage",bd."cPage") "cPageRange"
			   
        FROM "BundleDetail" bd    
        LEFT JOIN "BDAssignment" ba ON ba."nBundledetailid" = bd."nBundledetailid" AND ba."nSectionid" = ''' || nSectionid || '''::uuid 
            AND ' || 
            CASE WHEN explicit_null THEN 'coalesce(ba."nBundleid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid' 
                 WHEN nBundleid IS NULL THEN '1=1' 
                 ELSE 'ba."nBundleid" = ''' || nBundleid || '''::uuid' 
            END || ' AND "nUserid" != ''' || nMasterid || '''::uuid
        LEFT JOIN "BDShare" bs ON bs."nBundledetailid" = bd."nBundledetailid" AND bs."nUserid" = ''' || nMasterid || '''::uuid 
            AND bs."nSectionid" = ''' || nSectionid || '''::uuid 
		left join "BundleMaster" bm on ba."nBundleid" = bm."nBundleid"
        WHERE CASE WHEN exists (
            select 1 from "BDShare" bds 
            where bds."nSectionid" = ''' || nSectionid || '''::uuid 
            and bds."nUserid" = ''' || nMasterid || '''::uuid 
            and coalesce(bds."nBundledetailid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid
            and coalesce(bds."nBundleid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid 
            ) 
            then ba."nBundledetailid" = bd."nBundledetailid" 
            WHEN ' || CASE WHEN explicit_null THEN 'true' ELSE 'false' END || ' 
            THEN bs."nBundledetailid" = bd."nBundledetailid" 
            ELSE ' || CASE WHEN nBundleid IS NULL THEN ' ba."nBundleid" IS NULL '  ELSE ' ba."nBundleid" = ''' || nBundleid || '''::uuid ' END || '
            END
    ),
	
	 br AS (
        SELECT null::uuid AS "nBundledetailid", b."nBundleid", b."cBundlename" AS "cName", b."cBundletag" AS "cTab", '''' AS "cExhibitno",b."cBundletag",
		sorted_bundletag sorted_tab,b.sorted_name,null::text[] sorted_page,null::text[] sorted_exhibitno,''1901-01-01''::date start_date,null::text[] sorted_intrestdt,null::text[] sorted_description,null::text[] sorted_author
        FROM "BundleMaster" b
        LEFT JOIN "BDShare" bs ON coalesce(bs."nBundledetailid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid and bs."nBundleid" = b."nBundleid" AND bs."nUserid" = ''' || nMasterid || '''::uuid 
            AND bs."nSectionid" = ''' || nSectionid || '''::uuid 
        LEFT JOIN "BMPermission" p ON p."nUserid" = ''' || nMasterid || ''' AND p."nBundleid" = b."nBundleid"
        WHERE b."nSectionid" = ''' || nSectionid || ''' AND '|| case when nBundleid is null then  '
		coalesce(b."nParentBundleid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid'  else (' b."nParentBundleid" = ''' || nBundleid || '''' ) end   || ' AND CASE WHEN exists (
	            select 1 from "BDShare" bds 
	            where bds."nSectionid" = ''' || nSectionid || '''::uuid 
	            and bds."nUserid" = ''' || nMasterid || '''::uuid 
	            and coalesce(bds."nBundledetailid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid
          		 and coalesce(bds."nBundleid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid 
            ) then bs."nBundleid" = b."nBundleid"  else  b."nParentBundleid" is not null end
          AND CASE WHEN COALESCE(''' || cFiletype || ''', ''ALL'') = ''ALL'' THEN TRUE ELSE FALSE END 
        AND CASE WHEN ' || isAdmin ||' THEN TRUE ELSE 
		"nBMPid" IS NULL END
    ),
	
	cr AS (
        SELECT * FROM ar
        UNION ALL
        SELECT *, NULL AS "cPage", NULL AS "cRefpage", NULL AS "cFilesize", NULL AS "cFiletype", 
               NULL AS "dIntrestDt", NULL AS "cDescription", FALSE AS "cIsindex",'''' "cAuthor",'''' "cPageRange"
        FROM br
        UNION ALL
        SELECT * FROM assign
        UNION ALL
        SELECT * FROM shared
    ), ' || filter_condition || ',
    childOrder AS (
        SELECT ROW_NUMBER() OVER (ORDER BY 		
           CASE ''' || cSortby || '''  WHEN ''dIntrestDt'' THEN start_date else null end ' || cSorttype || ',
        CASE ''' || cSortby || '''
            WHEN ''cTab'' THEN sorted_tab
            WHEN ''cName'' THEN cr.sorted_name
            WHEN ''cPage'' THEN sorted_page
            WHEN ''cExhibitno'' THEN sorted_exhibitno
            WHEN ''cDesc'' THEN sorted_description
            WHEN ''cAuthor'' THEN sorted_author
            WHEN ''cFiletype'' THEN ARRAY["cFiletype"]::TEXT[]
            ELSE sorted_tab
        END ' || cSorttype || ',cr.sorted_name, cr."nBundledetailid", cr."nBundleid") AS serial, cr.*
        FROM filterdata cr
    ),
    ranges AS (
        SELECT 
            MAX(CASE WHEN ' || 
            CASE WHEN nStarttabid IS NULL THEN 'false' 
                ELSE '"nBundledetailid" = ''' || nStarttabid || '''::uuid' 
            END || ' THEN serial END) AS s_serial,
            MAX(CASE WHEN ' || 
            CASE WHEN nEndtabid IS NULL THEN 'false' 
                ELSE '"nBundledetailid" = ''' || nEndtabid || '''::uuid' 
            END || ' THEN serial END) AS e_serial
        FROM childOrder
    )
    SELECT ranges.s_serial,ranges.e_serial,childOrder."nBundledetailid",childOrder."nBundleid","cName","cTab","cExhibitno",childOrder."cBundletag",
           "cPage","cRefpage","cFilesize", "cFiletype","dIntrestDt","cDescription", "cIsindex","cAuthor","cPageRange",
           CASE WHEN childOrder."nBundledetailid" IS NULL THEN bmc."nFileCountDescendant" ELSE NULL END AS "nFileCountDescendant",
           (count(*) OVER())::int AS "nResultTotal"
    FROM childOrder CROSS JOIN ranges
    LEFT JOIN "BundleMaster" bmc ON bmc."nBundleid" = childOrder."nBundleid"
    WHERE (ranges.s_serial IS NULL OR (case when (ranges.e_serial IS NULL OR ranges.s_serial < ranges.e_serial) then childOrder.serial >= ranges.s_serial else childOrder.serial >= ranges.e_serial end)) AND (ranges.e_serial IS NULL OR (case when (ranges.s_serial IS NULL OR ranges.s_serial < ranges.e_serial) then childOrder.serial <= ranges.e_serial else childOrder.serial <= ranges.s_serial end) )
    ORDER BY serial
    LIMIT ' || perPage || ' OFFSET ' || offsetCount || '
    ';

    raise notice 'sql_query length %', sql_query;
    
    IF sql_query IS NULL THEN
        RAISE EXCEPTION 'SQL query is NULL';
    END IF;

    OPEN ref1 FOR EXECUTE sql_query;
    RETURN NEXT ref1;

END;
$function$;

-- ============ public.et_bundledetail_search ============
CREATE OR REPLACE FUNCTION public.et_bundledetail_search(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;pageNumber  int;offsetCount  int;perPage int default 30;nSectionid uuid;nBundleid uuid;last_nBundledetailid uuid;cFiletype text;
cSortby text;cSorttype text;
    sql_query text;cSearch text;
contentType text;searchName text;
start_date date;end_date date;

jFTypes jsonb default '[]'::jsonb;
jFilter jsonb default '[]'::jsonb;
jIssues jsonb;jImpact jsonb;jRelevance jsonb;jMarkup jsonb;
cLocation text;

	jFileFilter jsonb default '[]'::jsonb;
	filter_string text;filter_condition text;
searchedBundles jsonb;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','00000000-0000-0000-0000-000000000000')::uuid;
pageNumber := coalesce( (parameter ->>'pageNumber')::int ,1);
offsetCount := (pageNumber - 1) * perPage;
nBundleid := NULLIF(parameter ->>'nBundleid','00000000-0000-0000-0000-000000000000')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','00000000-0000-0000-0000-000000000000')::uuid;
last_nBundledetailid := NULLIF(parameter ->>'last_nBundledetailid','')::uuid;
cFiletype :=parameter ->>'cFiletype';
cSortby :=(parameter ->>'cSortby');
cSorttype :=coalesce((parameter ->>'cSorttype'),'ASC');

-- cSortby := case cSortby when 'cBundletag'  then 'cTab' when  'cTab' then 'similarity' else cSortby end;
cSearch := trim(parameter ->>'cSearch');

searchName:= parameter ->>'searchName';
contentType:= coalesce(parameter ->>'contentType','All');
cSorttype = case cSortby when 'similarity' then 'DESC' else cSorttype end;
jFilter := coalesce((parameter->>'jFilter')::jsonb,'[]'::jsonb);

	jFTypes := coalesce((jFilter->>'jFTypes')::jsonb,'[]'::jsonb);	
	jIssues := coalesce((jFilter->>'jIssues')::jsonb,'[]'::jsonb);
	jImpact := coalesce((jFilter->>'jImpact')::jsonb,'[]'::jsonb);
	jRelevance := coalesce((jFilter->>'jRelevance')::jsonb,'[]'::jsonb);
	jMarkup := coalesce((jFilter->>'jMarkup')::jsonb,'[]'::jsonb);
	cLocation:= coalesce((jFilter->>'cLocation'),'')::text;
	
	jFileFilter := coalesce((jFilter->>'fileFilter')::jsonb,'[]'::jsonb);
				
	nBundleid := coalesce((jFilter->>'nBundleid')::uuid,'00000000-0000-0000-0000-000000000000')::uuid;
	searchedBundles := coalesce((jFilter->>'searchedBundles')::jsonb,'[]'::jsonb);
	if(cLocation = 'T' and coalesce(nBundleid,'00000000-0000-0000-0000-000000000000')::uuid = '00000000-0000-0000-0000-000000000000'::UUID) then 
		cLocation = 'A';
	end if;
	if(jsonb_array_length(searchedBundles) > 0 ) then
		 select t into searchedBundles from public.et_bundles_ids(parameter,searchedBundles::json) t;
	end if;
	
	searchedBundles := coalesce(searchedBundles::jsonb,'[]'::jsonb);
	raise notice 'searchedBundles %',searchedBundles;

--/*
 -- if(cFiletype !='ALL') then 
cSearch := REPLACE(cSearch, '''', '''''');
contentType:=  case contentType when 'undefined'  then 'All' else contentType end;
-- contentType:=  case contentType when 'cBundletag'  then 'cTab' else contentType end;
contentType:= case contentType when 'cName' then 'cFilename' when 'cDescription' then 'cDesc' else contentType end;
 
 	BEGIN
	 	select t.start_date,t.end_date into start_date,end_date from  try_convert_to_dates(cSearch) t;
		end_date = case when start_date is not null and end_date is null then start_date else end_date end;
	EXCEPTION WHEN OTHERS THEN
            start_date := NULL;
            end_date := NULL;
	END;

	
	
 -- end if;

		
	filter_string := (select filter_whereclause_2(jFileFilter,'FILES'));	
	
	IF jsonb_array_length(jFileFilter::jsonb) > 0 THEN
	    filter_condition := ' incomming_links AS (
						select l."nBundledetailid",f."nUserid" from "FactMaster" f 
						join "FMLinks" l on l."nFSid" = f."nFSid"
						where f."nUserid" = ''' || nMasterid || '''::uuid 		
							union all 						
						select l."nBundledetailid",d."nUserid" from "DocMaster" d
						join "DMLinks" l on l."nDocid" = d."nDocid"
						where d."nUserid" = ''' || nMasterid || '''::uuid				
				),filter AS ( 
                    select cr."nBundledetailid"
                    from cr		
                    left join "FactMaster" f on cr."nBundledetailid" = f."nBundledetailid" and f."nUserid" = ''' || nMasterid || '''::uuid
					left join "BDTasks" bt on bt."nBundledetailid" = cr."nBundledetailid" and bt."nUserid" = ''' || nMasterid || '''::uuid
					left JOIN "FMContact" fc ON f."nFSid" = fc."nFSid"
                    left join "FMTasks" ft on ft."nFSid" = f."nFSid"	
                    left join "TaskDetail" td on td."nTaskid" = ft."nTaskid" or td."nTaskid" =  bt."nTaskid"		
                    LEFT join "FMIssue" fi on fi."nFSid" = ft."nFSid" or fi."nFSid" = f."nFSid"
                    LEFT join "RIssueMaster" i on i."nIid" = fi."nIssueid"
                    LEFT JOIN "IssueCategory" im ON im."nICid" = i."nICid"
                    LEFT join "TaskShared" ts on ts."nTaskid" = ft."nTaskid"
					left join "DocMaster" idl on idl."nBundledetailid" = cr."nBundledetailid" and idl."nUserid" = ''' || nMasterid || '''::uuid 
					left join "FMLinks" ofl on ofl."nFSid" = f."nFSid"
					left join incomming_links ifs on ifs."nBundledetailid" = cr."nBundledetailid"
					where (' || filter_string || ') and
					(f."nUserid" = ''' || nMasterid || '''::uuid or bt."nUserid" = ''' || nMasterid || '''::uuid  or idl."nUserid" = ''' || nMasterid || '''::uuid or ifs."nBundledetailid" = cr."nBundledetailid" or (' || jsonb_array_length(jFileFilter) || ' = 1  and '''|| (jFileFilter[0]->>'name') || ''' = ''DATE'' ))
					
                    group by cr."nBundledetailid"
                ), filterdata AS (
	        SELECT cr.* 
	          FROM cr1 cr
			  left join "BDContacts" bc on bc."nBundledetailid" = cr."nBundledetailid" and bc."nUserid" = '''|| nMasterid ||'''
	          CROSS JOIN filter
	         WHERE filter."nBundledetailid" = cr."nBundledetailid"
	    )
	    ';
	ELSE
	    filter_condition := 'filterdata AS (
	        SELECT cr.* 
	          FROM cr1 cr
	    )
	    ';
	END IF;

 
-- select * from "BundleDetail" limit 20
	raise notice 'Filter % ,filter_condition %',filter_string,filter_condition;

 raise notice 'Start date % - end date %',start_date,end_date;
 
 sql_query := '
 	
    with tsquery as (select to_tsquery( array_to_string( ARRAY(
      SELECT lower(trim(word)) || '':*'' FROM unnest( string_to_array(regexp_replace('''|| cSearch::text ||''',''[^a-zA-Z0-9]+'','' '',''g''),'' '')) AS word WHERE length(trim(word)) > 0),'' & '')) ts
),  ar AS (
        SELECT bd."nBundledetailid", bd."nBundleid", bd."cFilename" AS "cName", bd."cTab", bd."cExhibitno"
		,bm."cBundletag",sorted_tab,bd.sorted_name,sorted_page,sorted_exhibitno,sorted_intrestdt,sorted_description,sorted_author,bd.start_date
		,(case when 
		(LOWER(COALESCE(bd."cTab", ''''))  ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'') or LOWER(bd."cFilename")   ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'') or LOWER(COALESCE(bd."cExhibitno", ''''))   ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'') or LOWER(COALESCE(bd."cDesc", ''''))   ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'') or LOWER(COALESCE(bd."cAuthor", ''''))  ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'')) 
		then 0 when 
		tsv_filename @@ tsquery.ts or tsv_tab @@ tsquery.ts or tsv_exhibit @@ tsquery.ts or tsv_desc @@ tsquery.ts or tsv_author @@ tsquery.ts  
		then 0.01 else 0.1 end) similarity,
               bd."cPage", bd."cRefpage", bd."cFilesize", bd."cFiletype", bd."dIntrestDt", bd."cDesc" AS "cDescription",bd."cAuthor",bd."cPage" "cPageRange"
			   
        FROM "BundleDetail" bd	
        LEFT JOIN "BDPermission" bp ON bp."nUserid" = ''' || nMasterid || ''' AND bp."nBundledetailid" = bd."nBundledetailid"
		left join "BundleMaster" bm on bd."nBundleid" = bm."nBundleid"
		cross join tsquery
        WHERE bd."nSectionid" = ''' || nSectionid || ''' AND case when ''' || cLocation || ''' =  ''T''  then bd."nBundleid" = ''' || nBundleid || ''' else true end
		and case when jsonb_array_length(''' || jFTypes || '''::jsonb) > 0 then ''' || jFTypes || '''::jsonb @> to_jsonb("cFiletype") else true end
          AND (CASE 
                  WHEN COALESCE(''' || cFiletype || ''', ''ALL'') = ''ALL'' THEN TRUE 
                  WHEN COALESCE(''' || cFiletype || ''', ''ALL'') = ''Other'' THEN COALESCE(bd."cFiletype", '''') = ''''
                  ELSE bd."cFiletype" = ''' || cFiletype || ''' 
               END)
          AND bd."cStatus" = ''C''
		   
		 AND (  case when ''' || contentType || ''' = ''All'' then (case '''|| searchName::text ||''' when ''S'' then
             LOWER(bd."cFilename") ILIKE  LOWER(''' || cSearch::text || ''') || ''%'' 
			  OR LOWER(bd."cTab") ILIKE  LOWER(''' || cSearch::text || ''') || ''%'' 
			  OR LOWER(bd."cExhibitno") ILIKE LOWER(''' || cSearch::text || ''') || ''%''
			  OR LOWER(bd."cDesc") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''
			  OR LOWER(bd."cAuthor") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''
			  OR LOWER(bd."dIntrestDt") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''		      
		   when ''E'' then 
		     trim(LOWER(bd."cFilename")) = trim(LOWER(''' || cSearch::text || ''')) 
			  OR LOWER(bd."cTab") = trim(LOWER(''' || cSearch::text || '''))
			  OR LOWER(bd."cExhibitno") = trim(LOWER(''' || cSearch::text || '''))
			  OR LOWER(bd."cDesc") = trim(LOWER(''' || cSearch::text || '''))
			  OR LOWER(bd."cAuthor") = trim(LOWER(''' || cSearch::text || '''))
			  OR LOWER(bd."dIntrestDt") = trim(LOWER(''' || cSearch::text || '''))
			   else 
					 ( 
   ((tsv_tab @@ tsquery.ts ) OR (tsv_filename @@ tsquery.ts ) OR (tsv_exhibit @@ tsquery.ts ) OR (tsv_desc @@ tsquery.ts ) OR (tsv_author @@ tsquery.ts ))
   
   or                 LOWER(COALESCE(bd."cTab", '''')) || '' '' || LOWER(bd."cFilename") || '' '' || LOWER(COALESCE(bd."cExhibitno", '''')) || '' '' || LOWER(COALESCE(bd."cDesc", '''')) || '' '' || LOWER(COALESCE(bd."cAuthor", ''''))  ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'')
	 ) 
		   
		   
		   end )
		   
else
		  ( case '''|| searchName::text ||''' when ''S'' then
		   ( case when  ''' || contentType || ''' != ''cBundletag'' then 
             LOWER(bd."'|| (case when contentType ='All' or contentType = 'cBundletag' then 'cFilename'  else contentType end) ||'") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''  
			 else 
			   LOWER(bm."cBundletag") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''  
			 end)
		   when ''E''  then 
		    ( case when  ''' || contentType || ''' != ''cBundletag'' then 
		     trim(LOWER(bd."'|| (case when contentType ='All' or contentType = 'cBundletag' then 'cFilename' else contentType end) ||'")) = trim(LOWER(''' || cSearch::text || '''))
else
 trim(LOWER(bm."cBundletag")) = trim(LOWER(''' || cSearch::text || '''))
end)
			 
			   else 
			  (
CASE ''' || contentType ||''' 
    WHEN ''cTab'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bd."cTab") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bd."cTab") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
                tsv_tab @@ tsquery.ts
				or
                LOWER(COALESCE(bd."cTab", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cFilename'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bd."cFilename") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bd."cFilename") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
              
				tsv_filename @@ tsquery.ts
				or
                LOWER(COALESCE(bd."cFilename", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cExhibitno'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bd."cExhibitno") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bd."cExhibitno") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_exhibit @@ tsquery.ts
				or
                regexp_replace(LOWER(COALESCE(bd."cExhibitno", '''')),''[^a-z0-9]'','''',''g'')   ILIKE (''%'' ||  regexp_replace(TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')),''[^a-z0-9]'','''',''g'') || ''%'')
        END
    WHEN ''cDesc'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bd."cDesc") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bd."cDesc") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_desc @@ tsquery.ts
				or
                LOWER(COALESCE(bd."cDesc", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cAuthor'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bd."cAuthor") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bd."cAuthor") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_author @@ tsquery.ts
				or
                LOWER(COALESCE(bd."cAuthor", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
		when ''cBundletag'' then 
			 CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bm."cBundletag") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bm."cBundletag") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_bundletag @@ tsquery.ts
				or
                LOWER(COALESCE(bm."cBundletag", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    ELSE TRUE -- fallback
END
						)
		   end)
		   

end
		 
		   
  or 
  (case when  (('''|| contentType ||''' = ''All'' or '''|| contentType ||''' = ''dIntrestDt'') and '''|| searchName::text ||'''  = ''C''  ) and ''' || coalesce(start_date::text,'') || ''' !='''' and COALESCE(bd."start_date"::text, '''') != '''' then 
 coalesce(bd."start_date",''1001-01-02'')::date >= '''|| coalesce(start_date::text,'1001-01-01') ||'''::date and bd."end_date"::date <=coalesce('''|| coalesce(end_date,'1001-01-02') ||''',''1001-01-01'')::date else false end 
              ) 
              )
    ),assign as(
select bd."nBundledetailid", ba."nBundleid", bd."cFilename" AS "cName", bd."cTab", bd."cExhibitno"
,bmd."cBundletag",sorted_tab,bd.sorted_name,sorted_page,sorted_exhibitno,sorted_intrestdt,sorted_description,sorted_author,bd.start_date,
(case when 
		(LOWER(COALESCE(bd."cTab", ''''))  ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'') or LOWER(bd."cFilename")   ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'') or LOWER(COALESCE(bd."cExhibitno", ''''))   ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'') or LOWER(COALESCE(bd."cDesc", ''''))   ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'') or LOWER(COALESCE(bd."cAuthor", ''''))  ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'')) 
		then 0 when 
		tsv_filename @@ tsquery.ts or tsv_tab @@ tsquery.ts or tsv_exhibit @@ tsquery.ts or tsv_desc @@ tsquery.ts or tsv_author @@ tsquery.ts  
		then 0.01 else 0.1 end) similarity,
               bd."cPage", bd."cRefpage", bd."cFilesize", bd."cFiletype", bd."dIntrestDt", bd."cDesc" AS "cDescription" ,bd."cAuthor",coalesce(ba."cPage",bd."cPage") "cPageRange"
from "BundleDetail" bd	
join "BDAssignment" ba on ba."nBundledetailid" = bd."nBundledetailid"
left join "BDPermission" bp on bp."nUserid" = ''' || nMasterid || ''' and bp."nBundledetailid"  = bd."nBundledetailid"
left join "BundleMaster" bm on bd."nBundleid" = ba."nBundleid"
left join "BundleMaster" bmd on bmd."nBundleid" = bd."nBundleid"
cross join tsquery
where bp."nBDPid" is null and  
	ba."nSectionid" = ''' || nSectionid || ''' and  case when ''' || cLocation || ''' =  ''T'' then coalesce(ba."nBundleid",''00000000-0000-0000-0000-000000000000'') = ''' || nBundleid || ''' else true end  AND (CASE 
                  WHEN COALESCE(''' || cFiletype || ''', ''ALL'') = ''ALL'' THEN TRUE 
                  WHEN COALESCE(''' || cFiletype || ''', ''ALL'') = ''Other'' THEN COALESCE(bd."cFiletype", '''') = ''''
                  ELSE bd."cFiletype" = ''' || cFiletype || ''' 
               END)
          AND bd."cStatus" = ''C''
	   AND ( case when ''' || contentType || ''' = ''All'' then (case '''|| searchName::text ||''' when ''S'' then
             LOWER(bd."cFilename") ILIKE  LOWER(''' || cSearch::text || ''') || ''%'' 
			  OR LOWER(bd."cTab") ILIKE  LOWER(''' || cSearch::text || ''') || ''%'' 
			  OR LOWER(bd."cExhibitno") ILIKE LOWER(''' || cSearch::text || ''') || ''%''
			  OR LOWER(bd."cDesc") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''
			  OR LOWER(bd."cAuthor") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''
			  OR LOWER(bd."dIntrestDt") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''		      
		   when ''E'' then 
		     trim(LOWER(bd."cFilename")) = trim(LOWER(''' || cSearch::text || ''')) 
			  OR LOWER(bd."cTab") = trim(LOWER(''' || cSearch::text || '''))
			  OR LOWER(bd."cExhibitno") = trim(LOWER(''' || cSearch::text || '''))
			  OR LOWER(bd."cDesc") = trim(LOWER(''' || cSearch::text || '''))
			  OR LOWER(bd."cAuthor") = trim(LOWER(''' || cSearch::text || '''))
			  OR LOWER(bd."dIntrestDt") = trim(LOWER(''' || cSearch::text || '''))
			   else 
					 ( 
   ((tsv_tab @@ tsquery.ts ) OR (tsv_filename @@ tsquery.ts ) OR (tsv_exhibit @@ tsquery.ts ) OR (tsv_desc @@ tsquery.ts ) OR (tsv_author @@ tsquery.ts ))
   
   or                 LOWER(COALESCE(bd."cTab", '''')) || '' '' || LOWER(bd."cFilename") || '' '' || LOWER(COALESCE(bd."cExhibitno", '''')) || '' '' || LOWER(COALESCE(bd."cDesc", '''')) || '' '' || LOWER(COALESCE(bd."cAuthor", ''''))  ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'')
	 ) 
		   
		   
		   end )
		   
else
		  ( case '''|| searchName::text ||''' when ''S'' then
		   ( case when  ''' || contentType || ''' != ''cBundletag'' then 
             LOWER(bd."'|| (case when contentType ='All' or contentType = 'cBundletag' then 'cFilename'  else contentType end) ||'") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''  
			 else 
			   LOWER(bm."cBundletag") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''  
			 end)
		   when ''E''  then 
		    ( case when  ''' || contentType || ''' != ''cBundletag'' then 
		     trim(LOWER(bd."'|| (case when contentType ='All' or contentType = 'cBundletag' then 'cFilename' else contentType end) ||'")) = trim(LOWER(''' || cSearch::text || '''))
else
 trim(LOWER(bm."cBundletag")) = trim(LOWER(''' || cSearch::text || '''))
end)
			 
			   else 
			  (
CASE ''' || contentType ||''' 
    WHEN ''cTab'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bd."cTab") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bd."cTab") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
                tsv_tab @@ tsquery.ts
				or
                LOWER(COALESCE(bd."cTab", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cFilename'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bd."cFilename") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bd."cFilename") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
              
				tsv_filename @@ tsquery.ts
				or
                LOWER(COALESCE(bd."cFilename", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cExhibitno'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bd."cExhibitno") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bd."cExhibitno") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_exhibit @@ tsquery.ts
				or
                regexp_replace(LOWER(COALESCE(bd."cExhibitno", '''')),''[^a-z0-9]'','''',''g'')   ILIKE (''%'' ||  regexp_replace(TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')),''[^a-z0-9]'','''',''g'') || ''%'')
        END
    WHEN ''cDesc'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bd."cDesc") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bd."cDesc") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_desc @@ tsquery.ts
				or
                LOWER(COALESCE(bd."cDesc", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cAuthor'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bd."cAuthor") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bd."cAuthor") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_author @@ tsquery.ts
				or
                LOWER(COALESCE(bd."cAuthor", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
		when ''cBundletag'' then 
			 CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bm."cBundletag") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bm."cBundletag") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			bm.tsv_bundletag @@ tsquery.ts
				or
                LOWER(COALESCE(bm."cBundletag", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    ELSE TRUE -- fallback
END
						)
		   end)
		   

end
		 
		   
  or 
  (case when  (('''|| contentType ||''' = ''All'' or '''|| contentType ||''' = ''dIntrestDt'') and '''|| searchName::text ||'''  = ''C''  ) and ''' || coalesce(start_date::text,'') || ''' !='''' and COALESCE(bd."start_date"::text, '''') != '''' then 
 coalesce(bd."start_date",''1001-01-02'')::date >= '''|| coalesce(start_date::text,'1001-01-01') ||'''::date and bd."end_date"::date <=coalesce('''|| coalesce(end_date,'1001-01-02') ||''',''1001-01-01'')::date else false end 
              ) 
              )
),
    br AS (
        SELECT NULL::UUID AS "nBundledetailid", b."nBundleid", b."cBundlename" AS "cName", b."cBundlename" AS "cTab", '''' AS "cExhibitno",b."cBundletag",
		sorted_bundletag sorted_tab,b.sorted_name,null::text[] sorted_page,null::text[] sorted_exhibitno,null::text[] sorted_intrestdt,null::text[] sorted_description,null::text[] sorted_author,null::date start_date,
		case when (LOWER(COALESCE("cBundlename", ''''))  ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'') ) then 0 when 
		tsv_bundlename @@ tsquery.ts then 0.01 else similarity("cBundlename", ''' || cSearch::text || ''') end similarity
        FROM "BundleMaster" b
        LEFT JOIN "BMPermission" p ON p."nUserid" = ''' || nMasterid || ''' AND p."nBundleid" = b."nBundleid"
	cross join tsquery
        WHERE  b."nSectionid" = ''' || nSectionid || ''' AND  coalesce(b."nParentBundleid",''00000000-0000-0000-0000-000000000000''::uuid) != ''00000000-0000-0000-0000-000000000000''::uuid  AND 
		(case when ''' || cLocation || ''' =  ''T'' then coalesce(b."nParentBundleid",''00000000-0000-0000-0000-000000000000''::uuid) = ''' || nBundleid || ''' else true end		
		)
          AND CASE WHEN COALESCE(''' || cFiletype || ''', ''ALL'') = ''ALL'' THEN TRUE ELSE FALSE END 
		 and case when jsonb_array_length(''' || jFTypes || '''::jsonb) > 0 then ''' || jFTypes || '''::jsonb @> to_jsonb(''FOLDER''::text) else true end
		    AND 
		   ((case '''|| searchName::text ||''' when ''S'' then
             LOWER("cBundlename") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''		      
		   when ''E'' then 
		     trim(LOWER("cBundlename")) = trim(LOWER(''' || cSearch::text || ''')) 
		   else 
			(case when ''' || contentType || ''' = ''All'' OR ''' || contentType || ''' = ''cFilename'' then
				(tsv_bundlename @@ tsquery.ts
				  or LOWER(COALESCE("cBundlename", ''''))  ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'')
				 ) 
				 when ''' || contentType || ''' = ''cBundletag'' then 
					 	(tsv_bundletag @@ tsquery.ts
					  or
	       			  LOWER(COALESCE("cBundletag", ''''))  ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'')
		 				) 
				else false end)
		   end) 
		   
		   or  (case when jsonb_array_length(''' || searchedBundles || '''::jsonb) > 0 then ''' || searchedBundles || '''::jsonb @> to_jsonb(b."nBundleid") else false end)
		   )
		   
    ),
    cr AS (
        SELECT * FROM ar
        UNION ALL
		select *,null as "cPage",null as "cRefpage",null as "cFilesize",null as  "cFiletype",null "dIntrestDt",null "cDescription",'''' "cAuthor",'''' "cPageRange"
        FROM br
	 UNION ALL
		select *
        FROM assign
    ), fct as (
        SELECT f."nFSid", f."nBundledetailid", i."nIssueid", i."nImpactid", i."nRelevanceid", f."cFType"
        FROM "FactMaster" f
        JOIN "FMIssue" i ON i."nFSid" = f."nFSid"
        JOIN cr ON cr."nBundledetailid" = f."nBundledetailid"
        WHERE f."nUserid" = ''' || nMasterid ||'''
          AND (
			(case when jsonb_array_length(coalesce('''|| jIssues ||''',''[]''::jsonb)) > 0 then 
            coalesce('''|| jIssues ||''',''[]''::jsonb) @> to_jsonb(i."nIssueid") else true end)
			and 
			(case when jsonb_array_length(coalesce('''|| jMarkup ||''',''[]''::jsonb)) > 0 then 
            coalesce('''|| jMarkup ||''',''[]''::jsonb) @> to_jsonb(ARRAY[f."cFType"]) else true end) and
			case when  (jsonb_array_length(coalesce('''|| jMarkup ||''',''[]''::jsonb)) >0) then  coalesce('''|| jMarkup ||''',''[]''::jsonb)  @> to_jsonb(ARRAY[f."cFType"]) else true end 
and case when ( jsonb_array_length(coalesce('''|| jImpact ||''',''[]''::jsonb))  >0) then coalesce('''|| jImpact ||''',''[]''::jsonb) @> to_jsonb(i."nImpactid") else true end and case when (jsonb_array_length(coalesce(''' || jRelevance ||''',''[]''::jsonb)) > 0) then coalesce(''' || jRelevance ||''',''[]''::jsonb) @> to_jsonb(i."nRelevanceid") else true end

          )
    ),doc as (
		select d."nDocid",d."nBundledetailid" 
		From "DocMaster" d 
		join cr on cr."nBundledetailid" = d."nBundledetailid"
		where "nUserid" = '''|| nMasterid ||'''  and coalesce('''|| jMarkup ||''',''[]''::jsonb) @> to_jsonb(ARRAY[''D''])
	),web as (
		select w."nWebid",w."nBundledetailid" 
		From "WebMaster" w 
		join cr on cr."nBundledetailid" = w."nBundledetailid"
		where "nUserid" = '''|| nMasterid ||'''  and coalesce('''|| jMarkup ||''',''[]''::jsonb) @> to_jsonb(ARRAY[''W''])
	),cr1 AS (
        SELECT distinct cr.*
		,case when total_flink > 0 then true else false end flink
		,case when total_web > 0 then true else false end web 
		,case when total_doc > 0 then true else false end doc
		,case when total_fact > 0 then true else false end fact FROM cr
		
		left join fct f on f."nBundledetailid" = cr."nBundledetailid"
		left join doc d on d."nBundledetailid" = cr."nBundledetailid"
		left join web w on w."nBundledetailid" = cr."nBundledetailid"
		left join file_links fl on fl."nBundledetailid" = cr."nBundledetailid" and fl."nUserid" = '''|| nMasterid ||'''
		
			  where (case when (('|| jsonb_array_length(jIssues) ||' > 0 or '|| jsonb_array_length(coalesce(jImpact,'[]'::jsonb)) ||' >0 or '|| jsonb_array_length(coalesce(jRelevance,'[]'::jsonb)) ||' > 0 or (' || jsonb_array_length(coalesce(jMarkup,'[]'::jsonb)) ||' > 0 and coalesce('''|| jMarkup ||''',''[]''::jsonb) @> to_jsonb(ARRAY[''F'',''QF'']) ))) or  ((' || jsonb_array_length(coalesce(jMarkup,'[]'::jsonb)) ||' > 0 and coalesce('''|| jMarkup ||''',''[]''::jsonb) @> to_jsonb(ARRAY[''D'']) )) or ( (' || jsonb_array_length(coalesce(jMarkup,'[]'::jsonb)) ||' > 0 and coalesce(''' || jMarkup ||''',''[]''::jsonb) @> to_jsonb(ARRAY[''W'']) ))  then coalesce(f."nBundledetailid",''00000000-0000-0000-0000-000000000000''::uuid) != ''00000000-0000-0000-0000-000000000000''::uuid or coalesce(d."nBundledetailid",''00000000-0000-0000-0000-000000000000''::uuid) !=  ''00000000-0000-0000-0000-000000000000''::uuid or coalesce(w."nBundledetailid",''00000000-0000-0000-0000-000000000000''::uuid) !=  ''00000000-0000-0000-0000-000000000000''::uuid else true end)
			
	),' || filter_condition ||' ,
    childOrder AS ( 
        SELECT ROW_NUMBER() OVER (ORDER BY 
        case when similarity = 0 then similarity else 1 end ,CASE ''' || cSortby || '''
            WHEN ''cTab'' THEN sorted_tab
            WHEN ''cName'' THEN cr.sorted_name
            WHEN ''cPage'' THEN sorted_page
            WHEN ''cExhibitno'' THEN sorted_exhibitno
            WHEN ''dIntrestDt'' THEN sorted_intrestdt
            WHEN ''cDescription'' THEN sorted_description
            WHEN ''cAuthor'' THEN sorted_author
            WHEN ''cFiletype'' THEN ARRAY["cFiletype"]::TEXT[]
            ELSE sorted_tab
        END ' || cSorttype || ',sorted_tab ' || cSorttype || ',cr.sorted_name,"' || (case when contentType = 'All' then  'cTab' when  contentType = 'cFilename' then 'cName' when contentType = 'cDesc' then 'cDescription' else  contentType end) || '", cr."nBundledetailid", cr."nBundleid") AS serial, cr.*
        FROM filterdata cr
    )
        SELECT serial, childOrder."nBundledetailid",childOrder."nBundleid","cName","cTab","cExhibitno",childOrder."cBundletag",
               "cPage","cRefpage","cFilesize", "cFiletype","dIntrestDt","cDescription",flink,web,doc,fact,"cAuthor","cPageRange",
               CASE WHEN childOrder."nBundledetailid" IS NULL THEN bmc."nFileCountDescendant" ELSE NULL END AS "nFileCountDescendant",
               (count(*) OVER())::int AS "nResultTotal"
        FROM childOrder
        LEFT JOIN "BundleMaster" bmc ON bmc."nBundleid" = childOrder."nBundleid"
        ORDER BY serial
        LIMIT ' || perPage || ' OFFSET ' || offsetCount || '
    
	
    ';
 	RAISE notice 'sql_query: %', sql_query;
    -- OPEN ref1 FOR EXECUTE sql_query;
	BEGIN
		OPEN ref1 FOR EXECUTE sql_query;
	
	EXCEPTION WHEN OTHERS THEN
	    RAISE EXCEPTION 'Failed executing search query: %', SQLERRM;
	END;
		
RETURN NEXT ref1;
    
	 
END;
$function$;

-- ============ public.et_admin_bundles_filetypes ============
CREATE OR REPLACE FUNCTION public.et_admin_bundles_filetypes(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid     uuid := (parameter ->> 'nMasterid')::uuid;
    nCaseid       uuid := (parameter ->> 'nCaseid')::uuid;
    nSectionid    uuid := (parameter ->> 'nSectionid')::uuid;

    cFoldertype   TEXT;
    contentType   TEXT := COALESCE(parameter ->> 'contentType', 'All');
    cSearch       TEXT := parameter ->> 'cSearch';

    jFilter       JSONB := COALESCE((parameter ->> 'jFilter')::jsonb, '[]'::jsonb);
    jFTypes       JSONB := '[]'::jsonb;
    jIssues       JSONB;
    jImpact       JSONB;
    jRelevance    JSONB;
    jMarkup       JSONB;
    nBundleid     uuid;
	cLocation 	  text;
searchName text;
    ts_query      TSQUERY;
start_dt date;end_dt date;

	jFileFilter jsonb default '[]'::jsonb;
	filter_string text;filter_condition text;
	sql_query text;
	nStarttabid uuid;nEndtabid uuid;
	bRecursive boolean;useRecursive text;
BEGIN

    nStarttabid := coalesce((parameter ->>'nStarttabid')::uuid, null);
    nEndtabid := coalesce((parameter ->>'nEndtabid')::uuid, null);
    -- Issue 049: count file types across the WHOLE subtree of nBundleid (parent
    -- bundles hold only folders, so the direct-children scope counts nothing
    -- there). Param-gated so legacy callers keep the direct-only behaviour.
    bRecursive := coalesce((parameter ->>'bRecursive')::boolean, false);
    -- Normalize contentType
    contentType := CASE contentType
        -- WHEN 'cBundletag'  THEN 'cTab'
        WHEN 'cName'       THEN 'cFilename'
        WHEN 'cDescription' THEN 'cDesc'
        ELSE contentType
    END;

	

 	BEGIN
	 	select t.start_date,t.end_date into start_dt,end_dt from  try_convert_to_dates(cSearch) t;
		end_dt = case when start_dt is not null and end_dt is null then start_dt else end_dt end;
	EXCEPTION WHEN OTHERS THEN
            start_dt := NULL;
            end_dt := NULL;
	END;

    -- Extract filters only if search is applied
	
    cSearch  := coalesce((jFilter ->> 'cSearch'),'');	
	jFileFilter := coalesce((jFilter->>'fileFilter')::jsonb,'[]'::jsonb);	
        jFTypes    := COALESCE((jFilter ->> 'jFTypes')::jsonb, '[]'::jsonb);
        jIssues    := COALESCE((jFilter ->> 'jIssues')::jsonb, '[]'::jsonb);
        jImpact    := COALESCE((jFilter ->> 'jImpact')::jsonb, '[]'::jsonb);
        jRelevance := COALESCE((jFilter ->> 'jRelevance')::jsonb, '[]'::jsonb);
        jMarkup    := COALESCE((jFilter ->> 'jMarkup')::jsonb, '[]'::jsonb);
		cLocation := coalesce((jFilter->>'cLocation'),'')::text;
   		 searchName    = coalesce((jFilter->>'cMatchCase'),'')::text;
    IF COALESCE(cSearch, '') != '' THEN
	    nBundleid   := COALESCE((jFilter->>'nBundleid')::uuid, '00000000-0000-0000-0000-000000000000');
	else
		nBundleid := COALESCE((parameter->>'nBundleid')::uuid, '00000000-0000-0000-0000-000000000000');
    END IF
	;

	-- SQL literal ('true'/'false') for the recursive-scope arm: only meaningful
	-- for the plain (no-search) chip counts of a REAL bundle.
	useRecursive := case when bRecursive and COALESCE(cSearch,'') = ''
		and nBundleid != '00000000-0000-0000-0000-000000000000'::uuid
		then 'true' else 'false' end;

	filter_string := (select filter_whereclause_2(jFileFilter,'FILES'));	
	
	IF jsonb_array_length(jFileFilter::jsonb) > 0 THEN
	    filter_condition := 'incomming_links AS (
						select l."nBundledetailid",f."nUserid" from "FactMaster" f 
						join "FMLinks" l on l."nFSid" = f."nFSid"
						where f."nUserid" = ''' || nMasterid || '''::uuid 		
							union all 						
						select l."nBundledetailid",d."nUserid" from "DocMaster" d
						join "DMLinks" l on l."nDocid" = d."nDocid"
						where d."nUserid" = ''' || nMasterid || '''::uuid				
				),filter AS ( 
                    select cr."nBundledetailid"
                    from cr		
                    left join "FactMaster" f on cr."nBundledetailid" = f."nBundledetailid" and f."nUserid" = ''' || nMasterid || '''::uuid
					left join "FactDetail" d on d."nFSid" = f."nFSid"
					left join "BDTasks" bt on bt."nBundledetailid" = cr."nBundledetailid" and bt."nUserid" = ''' || nMasterid || '''::uuid
					left JOIN "FMContact" fc ON f."nFSid" = fc."nFSid"
                    left join "FMTasks" ft on ft."nFSid" = f."nFSid"	
                    left join "TaskDetail" td on td."nTaskid" = ft."nTaskid" or td."nTaskid" =  bt."nTaskid"		
                    LEFT join "FMIssue" fi on fi."nFSid" = ft."nFSid" or fi."nFSid" = f."nFSid"
                    LEFT join "RIssueMaster" i on i."nIid" = fi."nIssueid"
                    LEFT JOIN "IssueCategory" im ON im."nICid" = i."nICid"
                    LEFT join "TaskShared" ts on ts."nTaskid" = ft."nTaskid"
					left join "DocMaster" idl on idl."nBundledetailid" = cr."nBundledetailid" and idl."nUserid" = ''' || nMasterid || '''::uuid 
					left join "FMLinks" ofl on ofl."nFSid" = f."nFSid"
					left join incomming_links ifs on ifs."nBundledetailid" = cr."nBundledetailid"
					where (' || filter_string || ') and
					(f."nUserid" = ''' || nMasterid || '''::uuid or bt."nUserid" = ''' || nMasterid || '''::uuid  or idl."nUserid" = ''' || nMasterid || '''::uuid or ifs."nBundledetailid" = cr."nBundledetailid" or (' || jsonb_array_length(jFileFilter) || ' = 1  and '''|| (jFileFilter[0]->>'name') || ''' = ''DATE'' ))
					
                    group by cr."nBundledetailid"
                ), filterdata AS (
	        SELECT cr.* 
	          FROM cr1 cr
			  left join "BDContacts" bc on bc."nBundledetailid" = cr."nBundledetailid" and bc."nUserid" = '''|| nMasterid ||'''
	          CROSS JOIN filter
	         WHERE filter."nBundledetailid" = cr."nBundledetailid"
	    )
	    ';
	ELSE
	    filter_condition := 'filterdata AS (
	        SELECT cr.* 
	          FROM cr1 cr
	    )
	    ';
	END IF;

	
	raise notice 'Filter % ,filter_condition %',filter_string,filter_condition;
    -- Get folder type
    SELECT "cFoldertype" INTO cFoldertype
    FROM "SectionMaster"
    WHERE "nSectionid" = nSectionid;

    -- Build full-text ts_query
    SELECT array_to_string(
        ARRAY(
            SELECT LOWER(TRIM(word)) || ':*'
            FROM unnest(string_to_array(regexp_replace(cSearch, '[^a-zA-Z0-9]+', ' ', 'g'), ' ')) AS word
            WHERE LENGTH(TRIM(word)) > 0
        ), ' & '
    ) INTO ts_query;

cSearch := REPLACE(coalesce(cSearch,''), '''', '''''');
    RAISE NOTICE 'cSearch - % searchName - %', cSearch, searchName;
    sql_query := '
	 with recursive tsquery as (select to_tsquery( array_to_string( ARRAY(
	      SELECT lower(trim(word)) || '':*'' FROM unnest( string_to_array(regexp_replace('''|| coalesce(cSearch::text,'') ||''',''[^a-zA-Z0-9]+'','' '',''g''),'' '')) AS word WHERE length(trim(word)) > 0),'' & '')) ts
	),
	subtree AS (
	    SELECT bm0."nBundleid" FROM "BundleMaster" bm0 WHERE bm0."nBundleid" = '''|| nBundleid ||'''::uuid
	    UNION ALL
	    SELECT c."nBundleid" FROM "BundleMaster" c
	    JOIN subtree st ON c."nParentBundleid" = st."nBundleid"
	    LEFT JOIN "BMPermission" pm ON pm."nUserid" = ''' || nMasterid || '''::uuid AND pm."nBundleid" = c."nBundleid"
	    WHERE pm."nBMPid" IS NULL
	),
    cr_bundle AS (
        SELECT DISTINCT b."nBundledetailid", b."cFiletype",b."nBundleid",b.start_date,b.sorted_tab  
        FROM "BundleDetail" b
        LEFT JOIN "BDPermission" bp ON bp."nUserid" = ''' || nMasterid ||''' AND bp."nBundledetailid" = b."nBundledetailid"
		 left join "BundleMaster" bm on bm."nBundleid" = b."nBundleid"
        JOIN "SectionMaster" s ON s."nSectionid" =  b."nSectionid" 
		cross join tsquery
        WHERE s."nCaseid" = '''|| nCaseid ||'''
          AND b."cStatus" = ''C''
          AND coalesce(bp."nBDPid",null) is not  distinct from null -- IS NULL
          AND (''' || nSectionid ||'''::uuid = ''00000000-0000-0000-0000-000000000000''::uuid OR s."nSectionid" = ''' || nSectionid ||'''::uuid)
		  and case when jsonb_array_length(coalesce('''|| jFTypes ||''',''[]''::jsonb)) > 0 then coalesce('''|| jFTypes ||''',''[]''::jsonb)::jsonb @> to_jsonb("cFiletype") else true end
          AND (
              CASE
                   WHEN '''|| cLocation || ''' = ''T'' and coalesce('''|| nBundleid ||''',''00000000-0000-0000-0000-000000000000''::uuid) != ''00000000-0000-0000-0000-000000000000''::uuid THEN
                      b."nBundleid" = '''|| nBundleid ||'''
                  WHEN ' || useRecursive || ' THEN
                     b."nBundleid" IN (SELECT st."nBundleid" FROM subtree st)
                  WHEN '''|| coalesce(cSearch::text,'') ||''' IS NULL OR '''|| coalesce(cSearch::text,'') ||''' = '''' THEN
                     coalesce(b."nBundleid",''00000000-0000-0000-0000-000000000000''::uuid) = COALESCE('''|| nBundleid ||''', ''00000000-0000-0000-0000-000000000000''::uuid)
                  ELSE TRUE
              END
          )
          AND (
              COALESCE('''|| searchName ||''', '''') = '''' OR COALESCE('''|| coalesce(cSearch::text,'') ||''', '''') = '''' OR
              (
                CASE
                    WHEN ''' || contentType ||''' = ''All'' THEN
                       ( CASE '''|| searchName ||'''
                            WHEN ''S'' THEN
                                LOWER(b."cFilename") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
                                LOWER(b."cTab") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
                                LOWER(b."cExhibitno") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
                                LOWER(b."cDesc") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
			 					 LOWER(b."cAuthor")  LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
                                LOWER(b."dIntrestDt") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
                            WHEN ''E'' THEN
                                trim(LOWER(b."cFilename")) = trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text)) 
							  OR LOWER(b."cTab") =  trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text)) 
							  OR LOWER(b."cExhibitno") =  trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text)) 
							  OR LOWER(b."cDesc") =  trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text)) 
							  OR LOWER(b."cAuthor") =  trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text)) 
							  OR LOWER(b."dIntrestDt") = trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text)) 
                            ELSE
                                ((
								(tsv_tab @@ tsquery.ts ) OR (tsv_filename @@ tsquery.ts ) OR (tsv_exhibit @@ tsquery.ts ) OR (tsv_desc @@ tsquery.ts ) OR (tsv_author @@ tsquery.ts )								   
   )
								or
                LOWER(COALESCE(b."cTab", '''')) || '' '' || LOWER(b."cFilename") || '' '' || LOWER(COALESCE(b."cExhibitno", '''')) || '' '' || LOWER(COALESCE(b."cDesc", '''')) || '' '' ||  LOWER(COALESCE(b."cAuthor", ''''))  ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
								
									or  (case when ((''' || contentType ||''' = ''All'' or ''' || contentType ||'''  = ''dIntrestDt'') and '''|| searchName ||''' = ''C'') and  '''|| coalesce(start_dt::text,'') ||'''::text !='''' and COALESCE(b."start_date"::text, ''1001-01-02'') != '''' then 
 coalesce(b."start_date",''1001-01-02'')::date >= coalesce('''|| coalesce(start_dt::text,'') ||'''::text,''1001-01-01'')::date and b."end_date"::date <=coalesce('''|| coalesce(end_dt::text,'') ||''',''1001-01-02'')::date else false end )
 )
                        END)
                    ELSE
                        (
CASE ''' || contentType ||''' 
    WHEN ''cTab'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cTab") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cTab") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
                tsv_tab @@ tsquery.ts
				or
                LOWER(COALESCE(b."cTab", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cFilename'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cFilename") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cFilename") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
              
				tsv_filename @@ tsquery.ts
				or
                LOWER(COALESCE(b."cFilename", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cExhibitno'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cExhibitno") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cExhibitno") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_exhibit @@ tsquery.ts
				or
                LOWER(COALESCE(b."cExhibitno", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cDesc'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cDesc") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cDesc") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_desc @@ tsquery.ts
				or
                LOWER(COALESCE(b."cDesc", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cAuthor'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cAuthor") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cAuthor") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_author @@ tsquery.ts
				or
                LOWER(COALESCE(b."cAuthor", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
		when ''cBundletag'' then 
			 CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bm."cBundletag") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bm."cBundletag") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_bundletag @@ tsquery.ts
				or
                LOWER(COALESCE(bm."cBundletag", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    ELSE TRUE -- fallback
END
						)
                END
              )
          )
    ), cr_assign as(
        SELECT DISTINCT b."nBundledetailid", b."cFiletype",ba."nBundleid",b.start_date,b.sorted_tab  
        FROM "BundleDetail" b
        LEFT JOIN "BDPermission" bp ON bp."nUserid" = ''' || nMasterid ||''' AND bp."nBundledetailid" = b."nBundledetailid"
        LEFT JOIN "BDAssignment" ba ON ba."nBundledetailid" = b."nBundledetailid"
		 left join "BundleMaster" bm on bm."nBundleid" = b."nBundleid"
        JOIN "SectionMaster" s ON s."nSectionid" = ba."nSectionid"
		cross join tsquery
        WHERE s."nCaseid" = '''|| nCaseid ||'''
          AND b."cStatus" = ''C''
          AND coalesce(bp."nBDPid",null) is not  distinct from null -- IS NULL
          AND (coalesce(''' || nSectionid ||''',''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid OR s."nSectionid" = ''' || nSectionid ||''')
		  and case when jsonb_array_length(coalesce('''|| jFTypes ||''',''[]''::jsonb)) > 0 then coalesce('''|| jFTypes ||''',''[]''::jsonb)::jsonb @> to_jsonb("cFiletype") else true end
          AND (
              CASE
                   WHEN '''|| cLocation || ''' = ''T'' and coalesce('''|| nBundleid ||''',''00000000-0000-0000-0000-000000000000''::uuid) != ''00000000-0000-0000-0000-000000000000''::uuid THEN
                      ba."nBundleid" = '''|| nBundleid ||'''
                  WHEN ' || useRecursive || ' THEN
                    ba."nBundleid" IN (SELECT st."nBundleid" FROM subtree st)
                  WHEN '''|| coalesce(cSearch::text,'') ||''' IS NULL OR '''|| coalesce(cSearch::text,'') ||''' = '''' THEN
                    COALESCE(ba."nBundleid", ''00000000-0000-0000-0000-000000000000''::uuid) = COALESCE('''|| nBundleid ||''', ''00000000-0000-0000-0000-000000000000''::uuid)::uuid
                  ELSE TRUE
              END
          )
          AND (
              COALESCE('''|| searchName ||''', '''') = '''' OR COALESCE('''|| coalesce(cSearch::text,'') ||''', '''') = '''' OR
              (
                CASE
                    WHEN ''' || contentType ||''' = ''All'' THEN
                       ( CASE '''|| searchName ||'''
                            WHEN ''S'' THEN
                                LOWER(b."cFilename") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
                                LOWER(b."cTab") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
                                LOWER(b."cExhibitno") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
                                LOWER(b."cDesc") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
			 					 LOWER(b."cAuthor")  LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
                                LOWER(b."dIntrestDt") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
                            WHEN ''E'' THEN
                                trim(LOWER(b."cFilename")) = trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text)) 
							  OR LOWER(b."cTab") =  trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text)) 
							  OR LOWER(b."cExhibitno") =  trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text)) 
							  OR LOWER(b."cDesc") =  trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text)) 
							  OR LOWER(b."cAuthor") =  trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text)) 
							  OR LOWER(b."dIntrestDt") = trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text)) 
                            ELSE
                                ((
								(tsv_tab @@ tsquery.ts ) OR (tsv_filename @@ tsquery.ts ) OR (tsv_exhibit @@ tsquery.ts ) OR (tsv_desc @@ tsquery.ts ) OR (tsv_author @@ tsquery.ts )								   
   )
								or
                LOWER(COALESCE(b."cTab", '''')) || '' '' || LOWER(b."cFilename") || '' '' || LOWER(COALESCE(b."cExhibitno", '''')) || '' '' || LOWER(COALESCE(b."cDesc", '''')) || '' '' ||  LOWER(COALESCE(b."cAuthor", ''''))  ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
								
									or  (case when ((''' || contentType ||''' = ''All'' or ''' || contentType ||'''  = ''dIntrestDt'') and '''|| searchName ||''' = ''C'') and  '''|| coalesce(start_dt::text,'') ||'''::text !='''' and COALESCE(b."start_date"::text, ''1001-01-02'') != '''' then 
 coalesce(b."start_date",''1001-01-02'')::date >= coalesce('''|| coalesce(start_dt::text,'') ||'''::text,''1001-01-01'')::date and b."end_date"::date <=coalesce('''|| coalesce(end_dt::text,'') ||''',''1001-01-02'')::date else false end )
 )
                        END)
                    ELSE
                        (
CASE ''' || contentType ||''' 
    WHEN ''cTab'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cTab") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cTab") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
                tsv_tab @@ tsquery.ts
				or
                LOWER(COALESCE(b."cTab", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cFilename'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cFilename") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cFilename") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
              
				tsv_filename @@ tsquery.ts
				or
                LOWER(COALESCE(b."cFilename", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cExhibitno'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cExhibitno") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cExhibitno") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_exhibit @@ tsquery.ts
				or
                LOWER(COALESCE(b."cExhibitno", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cDesc'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cDesc") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cDesc") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_desc @@ tsquery.ts
				or
                LOWER(COALESCE(b."cDesc", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cAuthor'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cAuthor") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cAuthor") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_author @@ tsquery.ts
				or
                LOWER(COALESCE(b."cAuthor", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
		when ''cBundletag'' then 
			 CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bm."cBundletag") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bm."cBundletag") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_bundletag @@ tsquery.ts
				or
                LOWER(COALESCE(bm."cBundletag", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    ELSE TRUE -- fallback
END
						)
                END
              )
          )
    ),childOrder as (
		select * from cr_bundle
		union all 
		select * from cr_assign
	), cr AS (
			SELECT ROW_NUMBER() OVER (ORDER BY b.sorted_tab) AS serial, b.*
			FROM childOrder b
	),ranges AS (
        SELECT 
            MAX(CASE WHEN ' || 
            CASE WHEN nStarttabid IS NULL THEN 'false' 
                ELSE '"nBundledetailid" = ''' || nStarttabid || '''::uuid' 
            END || ' THEN serial END) AS s_serial,
            MAX(CASE WHEN ' || 
            CASE WHEN nEndtabid IS NULL THEN 'false' 
                ELSE '"nBundledetailid" = ''' || nEndtabid || '''::uuid' 
            END || ' THEN serial END) AS e_serial
        FROM cr
    ),

    fct AS (
        SELECT f."nFSid", f."nBundledetailid", i."nIssueid", i."nImpactid", i."nRelevanceid", f."cFType"
        FROM "FactMaster" f
        JOIN "FMIssue" i ON i."nFSid" = f."nFSid"
        JOIN cr ON cr."nBundledetailid" = f."nBundledetailid"
        WHERE f."nUserid" = ''' || nMasterid ||'''
          AND (
			(case when jsonb_array_length(coalesce('''|| jIssues ||''',''[]''::jsonb)) > 0 then 
            coalesce('''|| jIssues ||''',''[]''::jsonb) @> to_jsonb(i."nIssueid") else true end)
			and 
			(case when jsonb_array_length(coalesce('''|| jMarkup ||''',''[]''::jsonb)) > 0 then 
            coalesce('''|| jMarkup ||''',''[]''::jsonb) @> to_jsonb(ARRAY[f."cFType"]) else true end) and
			case when  (jsonb_array_length(coalesce('''|| jMarkup ||''',''[]''::jsonb)) >0) then  coalesce('''|| jMarkup ||''',''[]''::jsonb)  @> to_jsonb(ARRAY[f."cFType"]) else true end 
and case when ( jsonb_array_length(coalesce('''|| jImpact ||''',''[]''::jsonb))  >0) then coalesce('''|| jImpact ||''',''[]''::jsonb) @> to_jsonb(i."nImpactid") else true end and case when (jsonb_array_length(coalesce(''' || jRelevance ||''',''[]''::jsonb)) > 0) then coalesce(''' || jRelevance ||''',''[]''::jsonb) @> to_jsonb(i."nRelevanceid") else true end

          )
    ),

    doc AS (
        SELECT d."nDocid", d."nBundledetailid"
        FROM "DocMaster" d
        JOIN cr ON cr."nBundledetailid" = d."nBundledetailid"
        WHERE d."nUserid" = ''' || nMasterid ||''' AND coalesce('''|| jMarkup ||''',''[]''::jsonb) @> to_jsonb(ARRAY[''D''])
    ),

    web AS (
        SELECT w."nWebid", w."nBundledetailid"
        FROM "WebMaster" w
        JOIN cr ON cr."nBundledetailid" = w."nBundledetailid"
        WHERE w."nUserid" = ''' || nMasterid ||''' AND coalesce('''|| jMarkup ||''',''[]''::jsonb) @> to_jsonb(ARRAY[''W''])
    ),

   cr1 AS (
    SELECT DISTINCT cr.*
    FROM cr
    WHERE case when (
        jsonb_array_length(coalesce('''|| jIssues ||''',''[]''::jsonb)) > 0 OR
        jsonb_array_length(coalesce('''|| jImpact ||''',''[]''::jsonb)) > 0 OR
        jsonb_array_length(coalesce(''' || jRelevance ||''',''[]''::jsonb)) > 0 OR
        jsonb_array_length(coalesce('''|| jMarkup ||''',''[]''::jsonb)) > 0
    )
	    then (
	        EXISTS (
	            SELECT 1 FROM fct f WHERE f."nBundledetailid" = cr."nBundledetailid"
	        ) OR
	        EXISTS (
	            SELECT 1 FROM doc d WHERE d."nBundledetailid" = cr."nBundledetailid"
	        ) OR
	        EXISTS (
	            SELECT 1 FROM web w WHERE w."nBundledetailid" = cr."nBundledetailid"
	        )
	    ) else true end
	),' || filter_condition ||' ,

    cr2 AS (
        SELECT COUNT(DISTINCT b."nBundledetailid") AS "nTotal",
               COALESCE(b."cFiletype", ''Other'') AS "cFiletype" --,string_agg(distinct "nBundleid"::text,'','') bundles
        FROM filterdata  b
		CROSS JOIN ranges 
		WHERE (ranges.s_serial IS NULL OR (case when (ranges.e_serial IS NULL OR ranges.s_serial < ranges.e_serial) then b.serial >= ranges.s_serial else b.serial >= ranges.e_serial end)) AND (ranges.e_serial IS NULL OR (case when (ranges.s_serial IS NULL OR ranges.s_serial < ranges.e_serial) then b.serial <= ranges.e_serial else b.serial <= ranges.s_serial end) )
        GROUP BY "cFiletype"
    )

    SELECT SUM("nTotal") AS "nTotal", ''ALL'' AS "cFiletype" --,(''[''||string_agg(distinct bundles,'','')||'']'')::text "jBundles"
    FROM cr2
    HAVING COUNT(*) > 1
	 UNION ALL    
	 SELECT "nTotal","cFiletype" --,(''['' || string_agg(bundles,'','') || '']'')::text "jBundles" 
	 FROM cr2 group by "nTotal","cFiletype"
';

    --
	RAISE notice 'sql_query: %', sql_query;
	OPEN ref FOR execute sql_query;

    RETURN ref;
END;
$function$;

-- ============ public.et_admin_searched_bundles ============
CREATE OR REPLACE FUNCTION public.et_admin_searched_bundles(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid     uuid := (parameter ->> 'nMasterid')::uuid;
    nCaseid       uuid := (parameter ->> 'nCaseid')::uuid;
    nSectionid    uuid := (parameter ->> 'nSectionid')::uuid;

    cFoldertype   TEXT;
    contentType   TEXT := COALESCE(parameter ->> 'contentType', 'All');
    cSearch       TEXT := parameter ->> 'cSearch';

    jFilter       JSONB := COALESCE((parameter ->> 'jFilter')::jsonb, '[]'::jsonb);
    jFTypes       JSONB := '[]'::jsonb;
    jIssues       JSONB;
    jImpact       JSONB;
    jRelevance    JSONB;
    jMarkup       JSONB;
    nBundleid     uuid;
	cLocation 	  text;
searchName text;
    ts_query      TSQUERY;
start_dt date;end_dt date;jSubBundles jsonb default '[]'::jsonb;

	jFileFilter jsonb default '[]'::jsonb;
	filter_string text;filter_condition text;
	sql_query text;
BEGIN
    -- Normalize contentType
    contentType := CASE contentType
        -- WHEN 'cBundletag'  THEN 'cTab'
        WHEN 'cName'       THEN 'cFilename'
        WHEN 'cDescription' THEN 'cDesc'
        ELSE contentType
    END;

	

 	BEGIN
	 	select t.start_date,t.end_date into start_dt,end_dt from  try_convert_to_dates(cSearch) t;
		end_dt = case when start_dt is not null and end_dt is null then start_dt else end_dt end;
	EXCEPTION WHEN OTHERS THEN
            start_dt := NULL;
            end_dt := NULL;
	END;
	/*
select * from public.et_admin_searched_bundles ('{"nSectionid":9350,"nBundleid":0,"nCaseid":1131,"cSearch":"SBJV","searchName":"C","contentType":"All","jFilter":"{\"cWithin\":\"M\",\"cMatchCase\":\"C\",\"cSearch\":\"SBJV\",\"cLocation\":\"A\",\"contentType\":\"All\",\"isGlobalSearch\":true,\"nBundleid\":0,\"cBundlename\":\"Master Bundle\",\"jFTypes\":[]}","nMasterid":377}','r1');fetch all in "r1";
*/
    -- Extract filters only if search is applied
	
    cSearch  := (jFilter ->> 'cSearch');
   
    cSearch  := coalesce((jFilter ->> 'cSearch'),'');	
	jFileFilter := coalesce((jFilter->>'fileFilter')::jsonb,'[]'::jsonb);	
        jFTypes    := COALESCE((jFilter ->> 'jFTypes')::jsonb, '[]'::jsonb);
        jIssues    := COALESCE((jFilter ->> 'jIssues')::jsonb, '[]'::jsonb);
        jImpact    := COALESCE((jFilter ->> 'jImpact')::jsonb, '[]'::jsonb);
        jRelevance := COALESCE((jFilter ->> 'jRelevance')::jsonb, '[]'::jsonb);
        jMarkup    := COALESCE((jFilter ->> 'jMarkup')::jsonb, '[]'::jsonb);
		cLocation := coalesce((jFilter->>'cLocation'),'')::text;
   		 searchName    = coalesce((jFilter->>'cMatchCase'),'')::text;
    IF COALESCE(cSearch, '') != '' THEN
	    nBundleid   := COALESCE((jFilter->>'nBundleid')::uuid, '00000000-0000-0000-0000-000000000000')::uuid;
	else
		nBundleid := COALESCE((parameter->>'nBundleid')::uuid, '00000000-0000-0000-0000-000000000000')::uuid;
    END IF
	;

if(coalesce(nBundleid,'00000000-0000-0000-0000-000000000000')::uuid != '00000000-0000-0000-0000-000000000000'::uuid)then 
		WITH RECURSIVE bdl_tree AS (
            SELECT bm."nBundleid", bm."nParentBundleid",bm."cBundlename"
            FROM "BundleMaster" bm
			join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
			left join "BMPermission" bp on bm."nBundleid" = bp."nBundleid" and bp."nUserid" = nMasterid
            WHERE coalesce(bp."nBMPid",'00000000-0000-0000-0000-000000000000') ='00000000-0000-0000-0000-000000000000' and   (bm."nParentBundleid" = nBundleid  ) --AND sm."nCaseid" = nCaseid AND bm."nSectionid" = nSectionid
            UNION ALL
            SELECT c."nBundleid", c."nParentBundleid",c."cBundlename"
            FROM "BundleMaster" c
            JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"
			left join "BMPermission" bp on c."nBundleid" = bp."nBundleid" and bp."nUserid" = nMasterid
			WHERE coalesce(bp."nBMPid",'00000000-0000-0000-0000-000000000000') = '00000000-0000-0000-0000-000000000000'
        ) select jsonb_agg(distinct "nBundleid") into jSubBundles from bdl_tree ; 
end if;

		
	filter_string := (select filter_whereclause_2(jFileFilter,'FILES'));	
	IF jsonb_array_length(jFileFilter::jsonb) > 0 THEN
	    filter_condition := ' incomming_links AS (
						select l."nBundledetailid",f."nUserid" from "FactMaster" f 
						join "FMLinks" l on l."nFSid" = f."nFSid"
						where f."nUserid" = ''' || nMasterid || '''::uuid 		
							union all 						
						select l."nBundledetailid",d."nUserid" from "DocMaster" d
						join "DMLinks" l on l."nDocid" = d."nDocid"
						where d."nUserid" = ''' || nMasterid || '''::uuid				
				),filter AS ( 
                    select cr."nBundledetailid"
                    from cr		
                    left join "FactMaster" f on cr."nBundledetailid" = f."nBundledetailid" and f."nUserid" = ''' || nMasterid || '''::uuid
					left join "BDTasks" bt on bt."nBundledetailid" = cr."nBundledetailid" and bt."nUserid" = ''' || nMasterid || '''::uuid
					left JOIN "FMContact" fc ON f."nFSid" = fc."nFSid"
                    left join "FMTasks" ft on ft."nFSid" = f."nFSid"	
                    left join "TaskDetail" td on td."nTaskid" = ft."nTaskid" or td."nTaskid" =  bt."nTaskid"		
                    LEFT join "FMIssue" fi on fi."nFSid" = ft."nFSid" or fi."nFSid" = f."nFSid"
                    LEFT join "RIssueMaster" i on i."nIid" = fi."nIssueid"
                    LEFT JOIN "IssueCategory" im ON im."nICid" = i."nICid"
                    LEFT join "TaskShared" ts on ts."nTaskid" = ft."nTaskid"
					left join "DocMaster" idl on idl."nBundledetailid" = cr."nBundledetailid" and idl."nUserid" = ''' || nMasterid || '''::uuid 
					left join "FMLinks" ofl on ofl."nFSid" = f."nFSid"
					left join incomming_links ifs on ifs."nBundledetailid" = cr."nBundledetailid"
					where (' || filter_string || ') and
					(f."nUserid" = ''' || nMasterid || '''::uuid or bt."nUserid" = ''' || nMasterid || '''::uuid  or idl."nUserid" = ''' || nMasterid || '''::uuid or ifs."nBundledetailid" = cr."nBundledetailid" or (' || jsonb_array_length(jFileFilter) || ' = 1  and '''|| (jFileFilter[0]->>'name') || ''' = ''DATE'' ))
					
                    group by cr."nBundledetailid"
                ), filterdata AS (
	        SELECT cr.* 
	          FROM cr1 cr
			  left join "BDContacts" bc on bc."nBundledetailid" = cr."nBundledetailid" and bc."nUserid" = '''|| nMasterid ||'''
	          CROSS JOIN filter
	         WHERE filter."nBundledetailid" = cr."nBundledetailid"
	    )
	    ';
	ELSE
	    filter_condition := 'filterdata AS (
	        SELECT cr.* 
	          FROM cr1 cr
	    )
	    ';
	END IF;

    -- Get folder type
    SELECT "cFoldertype" INTO cFoldertype
    FROM "SectionMaster"
    WHERE "nSectionid" = nSectionid;

	raise notice 'Filter % ,filter_condition % jSubBundles %',filter_string,filter_condition,jSubBundles;
    RAISE NOTICE 'cSearch - % searchName - %', cSearch, searchName;

    -- Build full-text ts_query
    SELECT array_to_string(
        ARRAY(
            SELECT LOWER(TRIM(word)) || ':*'
            FROM unnest(string_to_array(regexp_replace(cSearch, '[^a-zA-Z0-9]+', ' ', 'g'), ' ')) AS word
            WHERE LENGTH(TRIM(word)) > 0
        ), ' & '
    ) INTO ts_query;

	
cSearch := REPLACE(coalesce(cSearch,''), '''', '''''');

 sql_query := '
	 with tsquery as (select to_tsquery( array_to_string( ARRAY(
	      SELECT lower(trim(word)) || '':*'' FROM unnest( string_to_array(regexp_replace('''|| coalesce(cSearch::text,'') ||''',''[^a-zA-Z0-9]+'','' '',''g''),'' '')) AS word WHERE length(trim(word)) > 0),'' & '')) ts
	),
    cr AS (
        SELECT DISTINCT b."nBundledetailid", b."cFiletype", CASE WHEN ''' || cFoldertype ||''' = ''CB'' THEN ba."nBundleid" ELSE b."nBundleid"  END, CASE WHEN ''' || cFoldertype ||''' = ''CB'' THEN bma."nParentBundleid" ELSE bm."nParentBundleid"  END "nPBid",b.start_date  
        FROM "BundleDetail" b
        LEFT JOIN "BDPermission" bp ON bp."nUserid" = ''' || nMasterid ||''' AND bp."nBundledetailid" = b."nBundledetailid"
        LEFT JOIN "BDAssignment" ba ON ba."nBundledetailid" = b."nBundledetailid"
		 left join "BundleMaster" bm on bm."nBundleid" = b."nBundleid"
		 left join "BundleMaster" bma on bma."nBundleid" = ba."nBundleid"
        JOIN "SectionMaster" s ON s."nSectionid" = (
            CASE WHEN ''' || cFoldertype ||''' = ''CB'' THEN ba."nSectionid" ELSE b."nSectionid"  END
        )
		cross join tsquery
        WHERE s."nCaseid" = '''|| nCaseid ||'''
          AND b."cStatus" = ''C''
          AND coalesce(bp."nBDPid",null) is not  distinct from null -- IS NULL
          AND (''' || nSectionid ||'''::uuid = ''00000000-0000-0000-0000-000000000000''::uuid OR s."nSectionid" = ''' || nSectionid ||'''::uuid)
		  and case when jsonb_array_length(coalesce('''|| jFTypes ||''',''[]''::jsonb)) > 0 then coalesce('''|| jFTypes ||''',''[]''::jsonb)::jsonb @> to_jsonb("cFiletype") else true end
          AND (
              CASE
                    WHEN '''|| cLocation || ''' = ''T'' and coalesce('''|| nBundleid ||''',''00000000-0000-0000-0000-000000000000''::uuid) != ''00000000-0000-0000-0000-000000000000''::uuid THEN
				  ('''|| coalesce(jSubBundles,'[]'::jsonb) ||''')::jsonb   @> to_jsonb((CASE WHEN '''|| cFoldertype ||''' = ''CB'' THEN ba."nBundleid" ELSE b."nBundleid" END)) or
                      (CASE WHEN '''|| cFoldertype ||''' = ''CB'' THEN ba."nBundleid" ELSE b."nBundleid" END) = coalesce('''|| nBundleid ||''',''00000000-0000-0000-0000-000000000000''::uuid)
                  WHEN '''|| coalesce(cSearch::text,'') ||''' IS NULL OR '''|| coalesce(cSearch::text,'') ||''' = '''' THEN
				  ('''|| coalesce(jSubBundles,'[]'::jsonb) ||''')::jsonb  @> to_jsonb((CASE WHEN '''|| cFoldertype ||''' = ''CB'' THEN COALESCE(ba."nBundleid", ''00000000-0000-0000-0000-000000000000''::uuid) ELSE COALESCE(b."nBundleid", ''00000000-0000-0000-0000-000000000000''::uuid) END))
                      or (CASE WHEN '''|| cFoldertype ||''' = ''CB'' THEN COALESCE(ba."nBundleid", ''00000000-0000-0000-0000-000000000000''::uuid) ELSE COALESCE(b."nBundleid",''00000000-0000-0000-0000-000000000000''::uuid) END) = COALESCE('''|| nBundleid ||''', ''00000000-0000-0000-0000-000000000000''::uuid)::uuid
                  ELSE TRUE
              END
          )
          AND (
              COALESCE('''|| searchName ||''', '''') = '''' OR COALESCE('''|| coalesce(cSearch::text,'') ||''', '''') = '''' OR
              (
                CASE
                    WHEN ''' || contentType ||''' = ''All'' THEN
                       ( CASE '''|| searchName ||'''
                            WHEN ''S'' THEN
                                LOWER(b."cFilename") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
                                LOWER(b."cTab") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
                                LOWER(b."cExhibitno") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
                                LOWER(b."cDesc") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
			 					 LOWER(b."cAuthor")  LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
                                LOWER(b."dIntrestDt") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
                            WHEN ''E'' THEN
                                trim(LOWER(b."cFilename")) = trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text)) 
							  OR LOWER(b."cTab") =  trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text)) 
							  OR LOWER(b."cExhibitno") =  trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text)) 
							  OR LOWER(b."cDesc") =  trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text)) 
							  OR LOWER(b."cAuthor") =  trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text)) 
							  OR LOWER(b."dIntrestDt") = trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text)) 
                            ELSE
                                (((tsv_tab @@ tsquery.ts ) OR (tsv_filename @@ tsquery.ts ) OR (tsv_exhibit @@ tsquery.ts ) OR (tsv_desc @@ tsquery.ts ) OR (tsv_author @@ tsquery.ts ))                                
								or
                LOWER(COALESCE(b."cTab", '''')) || '' '' || LOWER(b."cFilename") || '' '' || LOWER(COALESCE(b."cExhibitno", '''')) || '' '' || LOWER(COALESCE(b."cDesc", '''')) || '' '' ||  LOWER(COALESCE(b."cAuthor", ''''))  ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
								
									or  (case when ((''' || contentType ||''' = ''All'' or ''' || contentType ||'''  = ''dIntrestDt'') and '''|| searchName ||''' = ''C'') and  '''|| coalesce(start_dt::text,'') ||'''::text !='''' and COALESCE(b."start_date"::text, ''1001-01-02'') != '''' then 
 coalesce(b."start_date",''1001-01-02'')::date >= coalesce('''|| coalesce(start_dt::text,'') ||'''::text,''1001-01-01'')::date and b."end_date"::date <=coalesce('''|| coalesce(end_dt::text,'') ||''',''1001-01-02'')::date else false end )
 )
                        END)
                    ELSE
                        (
CASE ''' || contentType ||''' 
    WHEN ''cTab'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cTab") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cTab") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
               (tsv_tab @@ tsquery.ts )
				or
                LOWER(COALESCE(b."cTab", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cFilename'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cFilename") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cFilename") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
              
				(tsv_filename @@ tsquery.ts )
				or
                LOWER(COALESCE(b."cFilename", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
              
        END
    WHEN ''cExhibitno'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cExhibitno") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cExhibitno") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			(tsv_exhibit @@ tsquery.ts)
				or
                LOWER(COALESCE(b."cExhibitno", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cDesc'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cDesc") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cDesc") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			(tsv_desc @@ tsquery.ts )
				or
                LOWER(COALESCE(b."cDesc", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cAuthor'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cAuthor") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cAuthor") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			(tsv_author @@ tsquery.ts )
				or
                LOWER(COALESCE(b."cAuthor", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
		when ''cBundletag'' then 
			 CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bm."cBundletag") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bm."cBundletag") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			(bm.tsv_bundletag @@ tsquery.ts )
				or
                LOWER(COALESCE(bm."cBundletag", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
	
    ELSE TRUE -- fallback
END
						)
                END
              )
          )
    ),

    fct AS (
        SELECT f."nFSid", f."nBundledetailid", i."nIssueid", i."nImpactid", i."nRelevanceid", f."cFType"
        FROM "FactMaster" f
        JOIN "FMIssue" i ON i."nFSid" = f."nFSid"
        JOIN cr ON cr."nBundledetailid" = f."nBundledetailid"
        WHERE f."nUserid" = ''' || nMasterid ||'''
          AND (
			(case when jsonb_array_length(coalesce('''|| jIssues ||''',''[]''::jsonb)) > 0 then 
            coalesce('''|| jIssues ||''',''[]''::jsonb) @> to_jsonb(i."nIssueid") else true end)
			and 
			(case when jsonb_array_length(coalesce('''|| jMarkup ||''',''[]''::jsonb)) > 0 then 
            coalesce('''|| jMarkup ||''',''[]''::jsonb) @> to_jsonb(ARRAY[f."cFType"]) else true end) and
			case when  (jsonb_array_length(coalesce('''|| jMarkup ||''',''[]''::jsonb)) >0) then  coalesce('''|| jMarkup ||''',''[]''::jsonb)  @> to_jsonb(ARRAY[f."cFType"]) else true end 
and case when ( jsonb_array_length(coalesce('''|| jImpact ||''',''[]''::jsonb))  >0) then coalesce('''|| jImpact ||''',''[]''::jsonb) @> to_jsonb(i."nImpactid") else true end and case when (jsonb_array_length(coalesce(''' || jRelevance ||''',''[]''::jsonb)) > 0) then coalesce(''' || jRelevance ||''',''[]''::jsonb) @> to_jsonb(i."nRelevanceid") else true end

          )
    ),

    doc AS (
        SELECT d."nDocid", d."nBundledetailid"
        FROM "DocMaster" d
        JOIN cr ON cr."nBundledetailid" = d."nBundledetailid"
        WHERE d."nUserid" = ''' || nMasterid ||''' AND coalesce('''|| jMarkup ||''',''[]''::jsonb) @> to_jsonb(ARRAY[''D''])
    ),

    web AS (
        SELECT w."nWebid", w."nBundledetailid"
        FROM "WebMaster" w
        JOIN cr ON cr."nBundledetailid" = w."nBundledetailid"
        WHERE w."nUserid" = ''' || nMasterid ||''' AND coalesce('''|| jMarkup ||''',''[]''::jsonb) @> to_jsonb(ARRAY[''W''])
    ),

   cr1 AS (
    SELECT DISTINCT cr.*
    FROM cr
    WHERE case when (
        jsonb_array_length(coalesce('''|| jIssues ||''',''[]''::jsonb)) > 0 OR
        jsonb_array_length(coalesce('''|| jImpact ||''',''[]''::jsonb)) > 0 OR
        jsonb_array_length(coalesce(''' || jRelevance ||''',''[]''::jsonb)) > 0 OR
        jsonb_array_length(coalesce('''|| jMarkup ||''',''[]''::jsonb)) > 0
    )
	    then (
	        EXISTS (
	            SELECT 1 FROM fct f WHERE f."nBundledetailid" = cr."nBundledetailid"
	        ) OR
	        EXISTS (
	            SELECT 1 FROM doc d WHERE d."nBundledetailid" = cr."nBundledetailid"
	        ) OR
	        EXISTS (
	            SELECT 1 FROM web w WHERE w."nBundledetailid" = cr."nBundledetailid"
	        )
	    ) else true end
	),' || filter_condition ||' 

    select distinct m."nBundleid",m."nPBid" from filterdata m
';

    --
	RAISE notice 'sql_query: %', sql_query;
	OPEN ref FOR execute sql_query;
    RETURN ref;
END;
$function$;

COMMIT;
