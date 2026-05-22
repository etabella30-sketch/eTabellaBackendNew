CREATE OR REPLACE FUNCTION public.et_bundledetail_backup1(parameter jsonb, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE 
    nMasterid uuid := (parameter ->>'nMasterid')::uuid;
    pageNumber int;
    offsetCount int;
    perPage int default 30;
    nSectionid uuid := (parameter ->>'nSectionid')::uuid;
    nBundleid uuid;
    explicit_null boolean := false;
    last_nBundledetailid uuid := (parameter ->>'last_nBundledetailid')::uuid;
    cFiletype text;
    cSortby text;
    cSorttype text;
    sql_query text;
    isAdmin boolean default false;
    cFoldertype text;
    nStarttabid uuid;
    nEndtabid uuid;
    jFilter jsonb;
    jFTypes jsonb;
    filter_string text := '';
    filter_condition text := '';
BEGIN
    pageNumber := coalesce((parameter ->>'pageNumber')::int, 1);
    offsetCount := (pageNumber - 1) * perPage;
    
    IF parameter::jsonb ? 'nBundleid' AND parameter->>'nBundleid' IS NULL THEN
        explicit_null := true;
        nBundleid := NULL;
    ELSE
        nBundleid := coalesce((parameter ->>'nBundleid')::uuid, null);
    END IF;
    
    cFiletype := coalesce(parameter ->>'cFiletype', 'ALL');

    cSortby := coalesce((parameter ->>'cSortby'), 'cTab');
    cSorttype := coalesce((parameter ->>'cSorttype'), 'ASC');
    nStarttabid := coalesce((parameter ->>'nStarttabid')::uuid, null);
    nEndtabid := coalesce((parameter ->>'nEndtabid')::uuid, null);

    -- Safe Parameter Extraction
    BEGIN
        jFilter := COALESCE(NULLIF(parameter ->> 'jFilter', '')::jsonb, '[]'::jsonb);
    EXCEPTION WHEN OTHERS THEN
        jFilter := '[]'::jsonb;
    END;

    BEGIN
        jFTypes := COALESCE(NULLIF(parameter ->> 'jFTypes', '')::jsonb, '[]'::jsonb);
    EXCEPTION WHEN OTHERS THEN
        jFTypes := '[]'::jsonb;
    END;

    cSortby := case when cSortby = 'cBundletag' then 'cTab' else cSortby end;

    -- Default Filter Condition (No Filter)
    filter_condition := 'filterdata AS (
        SELECT cr.* 
        FROM cr
    )';

    -- Dynamic Filter Logic
    IF jsonb_array_length(jFilter) > 0 THEN
        DECLARE
            _item jsonb;
            _conds text[] := ARRAY[]::text[];
            _sub_sql text;
            _date_val jsonb;
            _date_type text;
            _start_date text;
            _end_date text;
        BEGIN
            -- [Fix] Iterate filters and join with AND explicitly to avoid concatenation bugs
            FOR _item IN SELECT * FROM jsonb_array_elements(jFilter)
            LOOP
                _sub_sql := NULL;

                -- [NEW] Custom Handling for DATE (Fact jDate)
                IF (_item->>'name') = 'DATE' THEN
                    _date_val := _item->'value';
                    _date_type := _date_val->>'cValue';
                    
                    -- Extract first date (for On, Before, After, Circa, Between-Start)
                    _start_date := _date_val->'record'->0->>'date';
                    
                    IF _date_type = 'On' OR _date_type = 'Circa' THEN
                        _sub_sql := ' (d."jDate"->''record''->0->>''date'')::date = ' || quote_literal(_start_date) || '::date ';
                    ELSIF _date_type = 'Before' THEN
                        _sub_sql := ' (d."jDate"->''record''->0->>''date'')::date < ' || quote_literal(_start_date) || '::date ';
                    ELSIF _date_type = 'After' THEN
                        _sub_sql := ' (d."jDate"->''record''->0->>''date'')::date > ' || quote_literal(_start_date) || '::date ';
                    ELSIF _date_type = 'Between' THEN
                        -- Extract second date for Between
                        _end_date := _date_val->'record'->1->>'date';
                        IF _end_date IS NOT NULL THEN
                             _sub_sql := ' (d."jDate"->''record''->0->>''date'')::date >= ' || quote_literal(_start_date) || '::date AND (d."jDate"->''record''->0->>''date'')::date <= ' || quote_literal(_end_date) || '::date ';
                        ELSE
                             _sub_sql := ' (d."jDate"->''record''->0->>''date'')::date >= ' || quote_literal(_start_date) || '::date ';
                        END IF;
                    END IF;

                -- [NEW] Custom Handling for Created Date
                ELSIF (_item->>'name') = 'Created Date' OR (_item->>'name') = 'CREATED_DATE' THEN
                     _start_date := _item->>'value';
                     IF jsonb_typeof(_item->'value') = 'string' THEN
                        _sub_sql := ' d."last_modified_at"::date = ' || quote_literal(_item->>'value') || '::date ';
                     END IF;

                ELSIF (_item->>'name') = 'TASK' THEN
                     _sub_sql := ' td."nTaskid" IN (SELECT value::uuid FROM jsonb_array_elements_text(' || quote_nullable(_item->'value') || '::jsonb)) ';
                ELSIF (_item->>'name') = 'TSHARED' THEN
                     _sub_sql := ' ts."nUserid" IN (SELECT value::uuid FROM jsonb_array_elements_text(' || quote_nullable(_item->'value') || '::jsonb)) ';
                ELSIF (_item->>'name') = 'TSTATUS' THEN
                     _sub_sql := ' td."nStatus" IN (SELECT value::int FROM jsonb_array_elements_text(' || quote_nullable(_item->'value') || '::jsonb)) ';
                ELSIF (_item->>'name') = 'TPRIORITY' THEN
                     _sub_sql := ' td."nPriority" IN (SELECT value::int FROM jsonb_array_elements_text(' || quote_nullable(_item->'value') || '::jsonb)) ';
                ELSIF (_item->>'name') = 'TDATE' THEN
                     _sub_sql := ' td."dEndDt"::date = regexp_replace(' || quote_literal(_item->>'value') || ', '' \(.*\)$'', '''', ''g'')::timestamptz::date ';

                ELSE
                    -- Standard dynamic filter generation
                    _sub_sql := filter_whereclause_2(jsonb_build_array(_item), 'FILES');
                END IF;
                
                IF _sub_sql IS NOT NULL AND _sub_sql <> '' THEN
                    -- Wrap in parens for safety and append
                    _conds := _conds || ('(' || _sub_sql || ')')::text;
                END IF;
            END LOOP;
            
            filter_string := array_to_string(_conds, ' AND ');
            
            IF filter_string IS NOT NULL AND filter_string != '' THEN
                filter_condition := '
                incomming_links AS (
                    SELECT l."nBundledetailid",f."nUserid" 
                    FROM "FactMaster" f 
                    JOIN "FMLinks" l ON l."nFSid" = f."nFSid"
                    WHERE f."nUserid" = ''' || nMasterid || '''::uuid 		
                    UNION ALL 						
                    SELECT l."nBundledetailid",d."nUserid" 
                    FROM "DocMaster" d
                    JOIN "DMLinks" l ON l."nDocid" = d."nDocid"
                    WHERE d."nUserid" = ''' || nMasterid || '''::uuid				
                ),
                filter AS ( 
                    SELECT cr."nBundledetailid"
                    FROM cr		
                    -- [Refactor] Paths to find a Claim (Issue) - REMOVED UserID checks for filtering
                    
                    -- Path 1: Item IS a Fact (Created by ANY user)
                    LEFT JOIN "FactMaster" f ON cr."nBundledetailid" = f."nBundledetailid" 

                    -- Path 2: Item IS a Task (Created by ANY user)
                    LEFT JOIN "BDTasks" bt ON bt."nBundledetailid" = cr."nBundledetailid" 
                    LEFT JOIN "FMTasks" task_fs_map ON task_fs_map."nTaskid" = bt."nTaskid"

                    -- Path 3: Item LINKED to a Fact (or Task-Fact)
                    LEFT JOIN "FMLinks" fl ON fl."nBundledetailid" = cr."nBundledetailid"
                    LEFT JOIN "FactMaster" f_linked ON f_linked."nFSid" = fl."nFSid" 

                    -- Generic Joins for other filters
                    LEFT JOIN "FactDetail" d ON d."nFSid" = f."nFSid"
                    LEFT JOIN "FMContact" fc ON f."nFSid" = fc."nFSid"
                    LEFT JOIN "FMTasks" ft ON ft."nFSid" = f."nFSid"	
                    LEFT JOIN "TaskDetail" td ON td."nTaskid" = ft."nTaskid" OR td."nTaskid" = bt."nTaskid"		
                    LEFT JOIN "TaskShared" ts ON ts."nTaskid" = td."nTaskid" -- [FIXED JOIN IS HERE]

                    -- JOIN Issue (Claim) from ANY Path
                    LEFT JOIN "FMIssue" fi ON 
                           fi."nFSid" = f."nFSid"                  -- From Fact
                        OR fi."nFSid" = task_fs_map."nFSid"        -- From Task
                        OR fi."nFSid" = f_linked."nFSid"           -- From Linked Fact
                    
                    LEFT JOIN "RIssueMaster" i ON i."nIid" = fi."nIssueid"
                    LEFT JOIN "IssueCategory" im ON im."nICid" = i."nICid"

                    -- DocMaster & Links (Access Control helpers)
                    LEFT JOIN "DocMaster" idl ON idl."nBundledetailid" = cr."nBundledetailid" 
                    LEFT JOIN "FMLinks" ofl ON ofl."nFSid" = f."nFSid"
                    LEFT JOIN incomming_links ifs ON ifs."nBundledetailid" = cr."nBundledetailid"
                    
                    WHERE (' || filter_string || ') AND
                    (
                        -- Access Control: Check existence in any reliable source
                        f."nFSid" IS NOT NULL 
                        OR bt."nTaskid" IS NOT NULL 
                        OR idl."nDocid" IS NOT NULL 
                        OR ifs."nBundledetailid" IS NOT NULL 
                        OR f_linked."nFSid" IS NOT NULL
                        OR (' || jsonb_array_length(jFilter) || ' = 1 AND '''|| (jFilter[0]->>'name') || ''' = ''DATE'' )
                    )
                    GROUP BY cr."nBundledetailid"
                ),
                filterdata AS (
                    SELECT cr.* 
                    FROM cr
                    JOIN filter ON filter."nBundledetailid" = cr."nBundledetailid"
                )';
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error in dynamic filter generation: %', SQLERRM;
        END;
    END IF;

    -- [Fix] Handle Potential NULL in isAdmin
    isAdmin := false;
    BEGIN
        select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nMasterid;
        isAdmin := coalesce(isAdmin, false);
    EXCEPTION WHEN OTHERS THEN
        isAdmin := false;
    END;

    sql_query := '
    WITH ar AS (
        SELECT bd."nBundledetailid", bd."nBundleid", bd."cFilename" AS "cName", bd."cTab", bd."cExhibitno",bm."cBundletag",sorted_tab,bd.sorted_name,sorted_page,sorted_exhibitno,start_date, sorted_intrestdt,sorted_description,sorted_author,
               bd."cPage", bd."cRefpage", bd."cFilesize", bd."cFiletype", bd."dIntrestDt", bd."cDesc" AS "cDescription", bd."cIsindex",bd."cAuthor",bd."cPage" "cPageRange"
        FROM "BundleDetail" bd    
        LEFT JOIN "BDPermission" bp ON bp."nUserid" = ''' || nMasterid || '''::uuid AND bp."nBundledetailid" = bd."nBundledetailid"
        left join "BundleMaster" bm on bd."nBundleid" = bm."nBundleid"
        WHERE bd."nSectionid" = ''' || nSectionid || '''::uuid 
          AND ' || CASE WHEN explicit_null THEN '
          coalesce(bd."nBundleid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid' 
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
               bd."cPage" "cPage", coalesce(ba."cPage",bd."cRefpage") "cRefpage", bd."cFilesize", bd."cFiletype", bd."dIntrestDt", bd."cDesc" AS "cDescription", bd."cIsindex",bd."cAuthor",
               coalesce(ba."cPage",bd."cPage") "cPageRange"
        FROM "BundleDetail" bd    
        JOIN "BDAssignment" ba ON ba."nBundledetailid" = bd."nBundledetailid" AND "nUserid" = ''' || nMasterid || '''::uuid
        LEFT JOIN "BDPermission" bp ON bp."nUserid" = ''' || nMasterid || '''::uuid AND bp."nBundledetailid" = bd."nBundledetailid"
        left join "BundleMaster" bm on ba."nBundleid" = bm."nBundleid"
        left join "BundleMaster" bmd on bmd."nBundleid" = bd."nBundleid"
        WHERE coalesce(bp."nBDPid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid
        AND ba."nSectionid" = ''' || nSectionid || '''::uuid AND ' || 
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
               bd."cPage" "cPage",coalesce(ba."cPage",bd."cRefpage") "cRefpage", bd."cFilesize", bd."cFiletype", bd."dIntrestDt", bd."cDesc" AS "cDescription", bd."cIsindex",bd."cAuthor",
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
        END ' || cSorttype || ',cr.sorted_name) AS serial, cr.*
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
    SELECT ranges.s_serial,ranges.e_serial,"nBundledetailid","nBundleid","cName","cTab","cExhibitno","cBundletag",
           "cPage","cRefpage","cFilesize", "cFiletype","dIntrestDt","cDescription", "cIsindex","cAuthor","cPageRange"
    FROM childOrder CROSS JOIN ranges 
    WHERE (ranges.s_serial IS NULL OR (case when (ranges.e_serial IS NULL OR ranges.s_serial < ranges.e_serial) then childOrder.serial >= ranges.s_serial else childOrder.serial >= ranges.e_serial end)) AND (ranges.e_serial IS NULL OR (case when (ranges.s_serial IS NULL OR ranges.s_serial < ranges.e_serial) then childOrder.serial <= ranges.e_serial else childOrder.serial <= ranges.s_serial end) )
    ORDER BY serial
    LIMIT ' || perPage || ' OFFSET ' || offsetCount || '
    ';

    -- Debug Output
    -- raise notice 'Generated Query: %', sql_query;

    IF sql_query IS NULL THEN
        RAISE EXCEPTION 'SQL query is NULL';
    END IF;

    OPEN ref FOR EXECUTE sql_query;
    RETURN ref;

END;
$function$
