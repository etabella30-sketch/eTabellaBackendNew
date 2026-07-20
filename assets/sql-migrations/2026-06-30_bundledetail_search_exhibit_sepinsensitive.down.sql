-- 2026-06-30 — Separator-insensitive exhibit-number search (down)
--
-- PROBLEM
--   The Evidence toolbar "Search by name, exhibit, tab…" box scopes an
--   exhibit-shaped query to contentType='cExhibitno'. The frontend used to
--   rewrite a compact number to a dashed canonical form ("P05" -> "P-05"), but
--   exhibit numbers are stored BOTH dashed ("CP-9") and compact ("P05") depending
--   on the case. The SP's contains predicate
--       LOWER(COALESCE(bd."cExhibitno",'')) ILIKE '%<term>%'
--   is separator-SENSITIVE, so "P-05" never matched a stored "P05" -> 0 results.
--   (The frontend has been changed to stop inventing a dash; this migration makes
--   the backend robust regardless of how either side is punctuated.)
--
-- FIX
--   Strip every non-alphanumeric character from BOTH the stored column and the
--   search term inside the cExhibitno "contains" branch, in the two CTEs (`ar`
--   and `assign`) that build the result set:
--       regexp_replace(LOWER(COALESCE(bd."cExhibitno",'')),'[^a-z0-9]','','g')
--         ILIKE '%' || regexp_replace(LOWER(<term>),'[^a-z0-9]','','g') || '%'
--   Now P05 / P-05 / C20 / C-20 all match a stored "P05" or "C-20".
--   The 'S' (starts-with) / 'E' (exact) and the tsvector half are unchanged.
--
-- PERFORMANCE
--   Adds an expression trigram GIN that mirrors the new predicate's left side so
--   the planner can BitmapOr it with the section index (same approach as
--   2026-06-02_bundledetail_search_trgm). VERIFY with EXPLAIN (ANALYZE) on the
--   largest section after applying; cExhibitno is small (3.7 MB trgm) so even an
--   unindexed scan stays well under the prior 323 ms worst case.
--
-- NOTE: CREATE INDEX CONCURRENTLY cannot run inside a transaction block, so this
--       migration has NO BEGIN/COMMIT (mirrors the trgm migration). Re-running is
--       safe (CREATE OR REPLACE / IF NOT EXISTS).
-- Based on the live definition at sp-audit/sp/public/et_bundledetail_search.sql.
-- Rollback: 2026-06-30_bundledetail_search_exhibit_sepinsensitive.down.sql

-- Restore the previous (separator-sensitive) function verbatim and drop the index.

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
                LOWER(COALESCE(bd."cExhibitno", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
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
                LOWER(COALESCE(bd."cExhibitno", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
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

DROP INDEX CONCURRENTLY IF EXISTS public.ix_bd_exhibit_norm_trgm;
