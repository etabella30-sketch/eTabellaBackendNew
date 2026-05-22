CREATE OR REPLACE FUNCTION public.filter_whereclause_backup(jfilters jsonb, ctype text)
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
    
BEGIN
    -- Loop through each filter in the JSONB array
    FOR i IN 0 .. jsonb_array_length(jfilters) - 1 LOOP
        current_filter := jfilters->i;
        filter_name := current_filter->>'name';
        filter_type := current_filter->>'type';
        filter_values := current_filter->'value';

		IF filter_name = 'DATE' THEN
			-- Get the column name for DATE
			actual_column_name := public.filter_columnnames(filter_name, ctype);
			start_dt := (filter_values->>'startDt')::timestamp;
			end_dt := (filter_values->>'endDt')::timestamp;
	
			IF actual_column_name IS NOT NULL THEN
				result := result || '(' || actual_column_name || ' BETWEEN ' || quote_literal(start_dt) || ' AND ' || quote_literal(end_dt) || ') ';
			END IF;
		
        ELSIF filter_name != 'TASK' then
            IF filter_type = 'V' THEN
                -- Get the actual column name
                actual_column_name := public.filter_columnnames(filter_name,ctype);
                
                -- Append filter values to the WHERE clause
                IF jsonb_typeof(filter_values) = 'array' THEN
                    if(jsonb_array_length(filter_values) > 0) then
                        result := result || actual_column_name || ' IN (''' || array_to_string(array(SELECT jsonb_array_elements_text(filter_values)), ''',''') || ''') ';
				     elsif(filter_name in ('RELEVANCE','IMPACT')) then
                        result := result || actual_column_name || ' IN (' || array_to_string(array(SELECT jsonb_array_elements_text(filter_values)), ',') || ') ';
                    else 
                        result := result;
                    end if;
                ELSE
                    result := result || actual_column_name || ' = ' || quote_literal(filter_values) || ' ';
                END IF;
            ELSIF filter_type = 'C' THEN
                -- Append condition type (AND/OR) to the WHERE clause
                condition_type := filter_values::TEXT;
                result := result || replace(condition_type::text,'"','') || ' ';
            END IF;
        end if;
    END LOOP;

    -- Trim the trailing condition type if exists
    result := rtrim(rtrim(result, ' '), 'AND');
    result := rtrim(rtrim(result, ' '), 'OR');

    RETURN nullif(result,'');
END;
$function$
