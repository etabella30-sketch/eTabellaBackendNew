-- 2026-09-23_sec_filter_whereclause_2 (ROLLBACK - restores the exact dev body dumped 2026-09-23)
--
-- Security remediation phase 5 (SQL injection sweep, part A): public.filter_whereclause_2 turns the client's
-- jFilter array ([{name, type 'V' | 'C', value}], sent as a JSON string) into a WHERE fragment that its callers
-- splice into dynamic SQL. Three kinds of client value reached that text unescaped:
--   * 'V' list values:   col IN ('<v1>','<v2>')  - each value wrapped in quotes without escaping, so
--                         ["x') OR ('1'='1"] rewrote the WHERE clause. Values are now quote_literal()-ed (the
--                         already-applied public.filter_whereclause fix); the text is unchanged for ordinary
--                         values and an all-null list still yields IN ('').
--   * 'C' condition token (3 places: DATE, ordinary filters, TASK): appended verbatim. It must now be AND / OR
--                         (any case - the only values the legacy / new clients send); anything else voids the
--                         whole filter (RETURN NULL), exactly like public.filter_whereclause.
--   * TASK jPriority / Timeline: joined unquoted into  IN (1,2)  - a numeric value (optionally padded with ASCII
--                         whitespace, as the legacy Timeline "Custom" days box can send) is still joined as is
--                         (same text); anything else is now quote_literal()-ed (a literal: an error against the
--                         integer column instead of spliced SQL).
-- LINK, DATE 'V' (typed timestamps), scalar values (already quote_literal) and column names (fixed whitelist in
-- public.filter_columnnames) were already safe and are unchanged.
--
-- Callers (24; all pick the fix up with no change of their own): live et_bundledetail, et_bundledetail_search,
--   et_admin_bundles_filetypes, et_admin_searched_bundles ('FILES'), et_workspace_fact_list / _fact_issues /
--   _fact_files ('WRK'), et_navigate_factlist ('FCH'), et_navigate_facts_bycompany ('FCO'),
--   et_sidenave_tasks_facttaskissues ('TSK'), plus 14 *_backup / *_test / *_old copies.
--
-- NOT covered here (other splices inside the callers themselves): et_bundledetail  jFilter[0]->>'name'  / cFiletype /
--   cSortby / cSorttype, and the jsonb / text parameters of et_bundledetail_search, et_admin_bundles_filetypes,
--   et_admin_searched_bundles. public.et_navigate_factlist cFType is fixed in 2026-09-23_sec_sidenav_factlist_logbd.
--
-- No service change needed. The body is identical on dev and in the 2026-09-22 prod backup.
--
-- OPERATOR: run against the intended database only. Check first:
--     SELECT current_database();   -- dev = etabella_tech_uuid, prod = etabella.com.uuid
-- No hard current_database() guard on purpose: this file is meant to be applied to dev first and to
-- prod later by the operator. Before applying anywhere, re-dump each function (pg_get_functiondef)
-- and diff it against the .down.sql file; if it differs, rebuild both files from that dump.
--
-- Drafted 2026-09-23 from the live dev bodies (etabella_tech_uuid). NOT applied anywhere.

BEGIN;

-- ============ public.filter_whereclause_2 ============
CREATE OR REPLACE FUNCTION public.filter_whereclause_2(jfilters jsonb, ctype text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    result TEXT := '';
    current_filter JSONB;
    filter_name TEXT;
    actual_column_name TEXT;
    filter_type TEXT;
    filter_values JSONB;
    condition_type TEXT;
    i INT := 0;
	start_dt TIMESTAMP;
    end_dt TIMESTAMP;

	
	progress_conditions TEXT := '';
	prog_item TEXT;
	task_conditions TEXT := '';
    
BEGIN
    -- Loop through each filter in the JSONB array
    FOR i IN 0 .. jsonb_array_length(jfilters) - 1 LOOP
        current_filter := jfilters->i;
        filter_name := current_filter->>'name';
        filter_type := current_filter->>'type';
        filter_values := current_filter->'value';

		IF filter_name = 'DATE' THEN
			 IF filter_type = 'V' THEN
				-- Get the column name for DATE
				actual_column_name := public.filter_columnnames(filter_name, ctype);
				start_dt := (filter_values->>'startDt')::timestamp;
				end_dt := (filter_values->>'endDt')::timestamp;
		
				IF actual_column_name IS NOT NULL THEN
					result := result || '((' || actual_column_name || ' BETWEEN ' || quote_literal(start_dt) || ' AND ' || quote_literal(end_dt) || ')) ';
				END IF;
			ELSIF filter_type = 'C' THEN
                -- Append condition type (AND/OR) to the WHERE clause
                condition_type := filter_values::TEXT;
                result := result || replace(condition_type::text,'"','') || ' ';
            END IF;
			Raise notice 'result Date %',result;
        ELSIF filter_name != 'TASK' and filter_name != 'DATE' then
            IF filter_type = 'V' THEN
                -- Get the actual column name
                actual_column_name := public.filter_columnnames(filter_name,ctype);
                
                -- Append filter values to the WHERE clause
                IF jsonb_typeof(filter_values) = 'array' THEN
                    if(jsonb_array_length(filter_values) > 0) then
						if(filter_name = 'LINK') then
							if(filter_values ? 'I') then 
	                        	result := result || 'coalesce(ifs."nBundledetailid",''00000000-0000-0000-0000-000000000000''::uuid) != ''00000000-0000-0000-0000-000000000000''::uuid ' ;				   
							end if;
							if(filter_values ? 'O') then 
	                        	result := result || (case when filter_values ? 'I' then  ' OR ' else '' end) || 'f."nFSid" is not null ' || (case when ctype = 'FILES' then 'or idl."nDocid" is not null' else '' end) || ' ';				   
							end if;
						else
                        result := result || actual_column_name || ' IN (''' || array_to_string(array(SELECT jsonb_array_elements_text(filter_values)), ''',''') || ''') ';
						end if;
				     elsif(filter_name in ('RELEVANCE','IMPACT')) then
                        result := result || actual_column_name || ' IN (' || array_to_string(array(SELECT jsonb_array_elements_text(filter_values)), ',') || ') ';
                    else 
                        result := result || ' ';
                    end if;
                ELSE
                    result := result || actual_column_name || ' = ' || quote_literal(filter_values) || ' ';
                END IF;
            ELSIF filter_type = 'C' THEN
                -- Append condition type (AND/OR) to the WHERE clause
                condition_type := filter_values::TEXT;
                result := result || replace(condition_type::text,'"','') || ' ';
            END IF;

			Raise notice 'result not TASK %',result;
		ELSIF filter_name = 'TASK'  then
   			 BEGIN
				 IF filter_type = 'V' and filter_values !='{}'::jsonb THEN
		        -- jPriority
			        IF jsonb_array_length((filter_values->>'jPriority')::JSONB) > 0 THEN
			            task_conditions := task_conditions || '(' || 'td."nPriority"' || ' IN (' || array_to_string(array(SELECT jsonb_array_elements_text((filter_values->>'jPriority')::jsonb)), ',') || '))';
			        END IF;

					
					IF jsonb_array_length((filter_values->>'jPriority')::JSONB) > 0 AND  jsonb_array_length((filter_values->>'jProgress')::JSONB) > 0 THEN 
					 	task_conditions  = task_conditions || ' AND ';
					END IF;
			
			
			        -- Progress
			        IF jsonb_array_length((filter_values->>'jProgress')::JSONB) > 0 THEN
			            progress_conditions := '';
			            FOR prog_item IN SELECT jsonb_array_elements_text((filter_values->>'jProgress')::JSONB)
			            LOOP
			                CASE prog_item
			                    WHEN 'C' THEN
			                        progress_conditions := progress_conditions || 'td."nProgress" = 100 OR ';
			                    WHEN 'P' THEN
			                        progress_conditions := progress_conditions || 'td."nProgress" BETWEEN 1 AND 99 OR ';
			                    WHEN 'N' THEN
			                        progress_conditions := progress_conditions || 'td."nProgress" = 0 OR ';
			                END CASE;
			            END LOOP;
			
			            IF progress_conditions <> '' THEN
			                progress_conditions := '(' || left(progress_conditions, length(progress_conditions) - 4) || ')';
			                task_conditions := task_conditions || progress_conditions ;
			            END IF;
			        END IF;

					
						IF ((jsonb_array_length((filter_values->>'jPriority')::JSONB) > 0 OR  jsonb_array_length((filter_values->>'jPriority')::JSONB) > 0) AND jsonb_array_length((filter_values->>'Timeline')::JSONB) > 0) THEN 
						 	task_conditions  = task_conditions || ' AND ';
						END IF;
					
			
			        -- Timeline
			        IF jsonb_array_length((filter_values->>'Timeline')::JSONB) > 0 THEN
			            task_conditions := task_conditions || '(' ||
			                'CASE WHEN (td."jTimeline"->>''dEnd'') IS NOT NULL THEN ' ||
			                '(((td."jTimeline"->>''dEnd'')::date - CURRENT_DATE)::int + 1) IN (' ||
			                array_to_string(array(SELECT jsonb_array_elements_text((filter_values->>'Timeline')::JSONB)), ',') ||
			                ') ELSE FALSE END' || ')';
			        END IF;
			
					
			        -- Trim trailing 'OR' if present
			        IF right(trim(task_conditions), 2) = 'OR' THEN
			            task_conditions := trim(trailing 'OR ' FROM task_conditions);
			        END IF;
			
			        result := result || '(' || task_conditions || ') ';
				 ELSIF filter_type = 'C' THEN
                -- Append condition type (AND/OR) to the WHERE clause
                condition_type := filter_values::TEXT;
                result := result || replace(condition_type::text,'"','') || ' ';
            END IF;
		    END;
			
        end if;
    END LOOP;

    -- Trim the trailing condition type if exists
    result := rtrim(rtrim(result, ' '), 'AND');
    result := rtrim(rtrim(result, ' '), 'OR');

    RETURN nullif(result,'');
END;
$function$;

COMMIT;
