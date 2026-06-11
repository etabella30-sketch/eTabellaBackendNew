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
$function$
