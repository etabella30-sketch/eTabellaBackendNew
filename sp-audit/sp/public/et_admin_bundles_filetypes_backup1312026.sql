CREATE OR REPLACE FUNCTION public.et_admin_bundles_filetypes_backup1312026(parameter json, ref refcursor)
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
BEGIN

    nStarttabid := coalesce((parameter ->>'nStarttabid')::uuid, null);
    nEndtabid := coalesce((parameter ->>'nEndtabid')::uuid, null);
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
	 with tsquery as (select to_tsquery( array_to_string( ARRAY(
	      SELECT lower(trim(word)) || '':*'' FROM unnest( string_to_array(regexp_replace('''|| coalesce(cSearch::text,'') ||''',''[^a-zA-Z0-9]+'','' '',''g''),'' '')) AS word WHERE length(trim(word)) > 0),'' & '')) ts
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
$function$
