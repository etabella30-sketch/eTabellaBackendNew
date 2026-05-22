CREATE OR REPLACE FUNCTION public.try_convert_to_dates_start_only(input_text text)
 RETURNS date
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
    -- Temporary variables to hold intermediate results
    start_date date;
    end_date text;
    temp_input text;
BEGIN

	temp_input := regexp_replace(
	        upper(input_text),
	        '\s(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s',
	        CASE 
	            WHEN regexp_match(upper(input_text), '\sJAN\s') IS NOT NULL THEN ' January '
	            WHEN regexp_match(upper(input_text), '\sFEB\s') IS NOT NULL THEN ' February '
	            WHEN regexp_match(upper(input_text), '\sMAR\s') IS NOT NULL THEN ' March '
	            WHEN regexp_match(upper(input_text), '\sAPR\s') IS NOT NULL THEN ' April '
	            WHEN regexp_match(upper(input_text), '\sMAY\s') IS NOT NULL THEN ' May '
	            WHEN regexp_match(upper(input_text), '\sJUN\s') IS NOT NULL THEN ' June '
	            WHEN regexp_match(upper(input_text), '\sJUL\s') IS NOT NULL THEN ' July '
	            WHEN regexp_match(upper(input_text), '\sAUG\s') IS NOT NULL THEN ' August '
	            WHEN regexp_match(upper(input_text), '\sSEP\s') IS NOT NULL THEN ' September '
	            WHEN regexp_match(upper(input_text), '\sOCT\s') IS NOT NULL THEN ' October '
	            WHEN regexp_match(upper(input_text), '\sNOV\s') IS NOT NULL THEN ' November '
	            WHEN regexp_match(upper(input_text), '\sDEC\s') IS NOT NULL THEN ' December '
	        END,
	        'g'
	    );

	temp_input := regexp_replace(
	        upper(temp_input),
	        '(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s',
	        CASE 
	            WHEN regexp_match(upper(temp_input), 'JAN\s') IS NOT NULL THEN 'January '
	            WHEN regexp_match(upper(temp_input), 'FEB\s') IS NOT NULL THEN 'February '
	            WHEN regexp_match(upper(temp_input), 'MAR\s') IS NOT NULL THEN 'March '
	            WHEN regexp_match(upper(temp_input), 'APR\s') IS NOT NULL THEN 'April '
	            WHEN regexp_match(upper(temp_input), 'MAY\s') IS NOT NULL THEN 'May '
	            WHEN regexp_match(upper(temp_input), 'JUN\s') IS NOT NULL THEN 'June '
	            WHEN regexp_match(upper(temp_input), 'JUL\s') IS NOT NULL THEN 'July '
	            WHEN regexp_match(upper(temp_input), 'AUG\s') IS NOT NULL THEN 'August '
	            WHEN regexp_match(upper(temp_input), 'SEP\s') IS NOT NULL THEN 'September '
	            WHEN regexp_match(upper(temp_input), 'OCT\s') IS NOT NULL THEN 'October '
	            WHEN regexp_match(upper(temp_input), 'NOV\s') IS NOT NULL THEN 'November '
	            WHEN regexp_match(upper(temp_input), 'DEC\s') IS NOT NULL THEN 'December '
	        END,
	        'g'
	    );

-- raise notice 'temp_input %  input_text %',temp_input,input_text;
-- select * from try_convert_to_dates('22-06-1991')
 BEGIN
	IF temp_input ~ '(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})' THEN
        start_date := to_date(regexp_replace(temp_input, '(\d{1,2})\s*-\s*\d{1,2}\s+([A-Za-z]+)\s+(\d{4})', '\1 \2 \3', 'g'), 'DD Month YYYY');
        end_date := to_date(regexp_replace(temp_input, '\d{1,2}\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})', '\1 \2 \3', 'g'), 'DD Month YYYY');
    
    -- Case 2: "10/20 August 2025" format
    ELSIF temp_input ~ '(\d{1,2})\s*/\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})' THEN
        start_date := to_date(regexp_replace(temp_input, '(\d{1,2})\s*/\s*\d{1,2}\s+([A-Za-z]+)\s+(\d{4})', '\1 \2 \3', 'g'), 'DD Month YYYY');
        end_date := to_date(regexp_replace(temp_input, '\d{1,2}\s*/\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})', '\1 \2 \3', 'g'), 'DD Month YYYY');
	ELSIF input_text ~ '(\d{1,2})\s*-\s*(\d{1,2})\s+(\d{1,2})\s+(\d{4})' THEN
        start_date := to_date(regexp_replace(input_text, '(\d{1,2})\s*-\s*\d{1,2}\s+(\d{1,2})\s+(\d{4})', '\1 \2 \3', 'g'), 'DD MM YYYY');
        end_date := to_date(regexp_replace(input_text, '\d{1,2}\s*-\s*(\d{1,2})\s+(\d{1,2})\s+(\d{4})', '\1 \2 \3', 'g'), 'DD MM YYYY');
	ELSIF trim(input_text) ~ '(^\d{1,2})-(\d{4})$' then 
		start_date := to_date(input_text, 'MM YYYY');
		end_date := (start_date::date + INTERVAL '1 MONTH' - INTERVAL '1 day')::date; -- Assuming end_date is not applicable in this fallback
	ELSIF temp_input ~ '^[A-Za-z]+\s*\d{4}$' THEN	
		--raise notice 'temp_input %  input_text %',temp_input,input_text;	
		
        start_date := to_date(temp_input, 'Month YYYY');
        end_date := (start_date::date + INTERVAL '1 MONTH' - INTERVAL '1 day')::date; -- Assuming end_date is not applicable in this fallback
		
	ELSIF input_text ~ '^[A-Za-z]+\s*\d{4}$' THEN	
		-- raise notice 'temp_input %  input_text %',temp_input,input_text;	
		
        start_date := to_date(input_text, 'MON YYYY');
        end_date := (start_date::date + INTERVAL '1 MONTH' - INTERVAL '1 day')::date; -- Assuming end_date is not applicable in this fallback
-- 		EXCEPTION WHEN OTHERS THEN
--             -- If direct conversion fails, return NULLs
--             start_date := NULL;
--             end_date := NULL;
				
	ELSIF input_text ~ '^\d{1,2}\.\d{1,2}\.\d{4}\s*[\s–\-]*\s*\d{1,2}\.\d{1,2}\.\d{4}$' THEN 
		
        start_date := to_date(regexp_replace(input_text, '^(\d{2}\.\d{2}\.\d{4})\s*–\s*\d{2}\.\d{2}\.\d{4}$', '\1', 'g'), 'DD.MM.YYYY');  
	    end_date := to_date(regexp_replace(input_text, '^\d{2}\.\d{2}\.\d{4}\s*–\s*(\d{2}\.\d{2}\.\d{4})$', '\1', 'g'), 'DD.MM.YYYY');
			
	ELSIF trim(input_text)  ~ '(^\d{1,2})+\s*-(\d{1,2})+\s*-(\d{4})$'  then 
		start_date := to_date(input_text, 'DD-MM-YYYY');
		end_date := start_date; -- Assuming end_date is not applicable in this fallback
-- 		EXCEPTION WHEN OTHERS THEN
--             -- If direct conversion fails, return NULLs
--             start_date := NULL;
--             end_date := NULL;
	
	ELSIF trim(input_text)  ~ '(^\d{1,2})+\s*/(\d{1,2})+\s*/(\d{4})$'  then 
		start_date := to_date(input_text, 'DD/MM/YYYY');
		end_date := start_date; -- Assuming end_date is not applicable in this fallback
		
	ELSIF trim(input_text)  ~ '(^\d{1,2})+\s*.(\d{1,2})+\s*.(\d{4})$'  then 
		start_date := to_date(input_text, 'DD.MM.YYYY');
		end_date := start_date; -- Assuming end_date is not applicable in this fallback
	ELSIF temp_input ~ '^([A-Za-z]+)\s*-\s*([A-Za-z]+)\s+(\d{4})$' THEN  
        start_date := to_date(regexp_replace(temp_input, '^([A-Za-z]+)\s*-\s*[A-Za-z]+\s+(\d{4})$', '\1 \2', 'g'), 'Month YYYY');
        end_date := (date_trunc('MONTH', to_date(regexp_replace(temp_input, '^[A-Za-z]+\s*-\s*([A-Za-z]+)\s+(\d{4})$', '\1 \2', 'g'), 'Month YYYY')) 
                    + INTERVAL '1 MONTH' - INTERVAL '1 day')::date;
	ELSIF input_text ~ '^([A-Za-z]+)\s*-\s*([A-Za-z]+)\s+(\d{4})$' THEN  
        start_date := to_date(regexp_replace(input_text, '^([A-Za-z]+)\s*-\s*[A-Za-z]+\s+(\d{4})$', '\1 \2', 'g'), 'MON YYYY');
        end_date := (date_trunc('MONTH', to_date(regexp_replace(input_text, '^[A-Za-z]+\s*-\s*([A-Za-z]+)\s+(\d{4})$', '\1 \2', 'g'), 'MON YYYY')) 
                    + INTERVAL '1 MONTH' - INTERVAL '1 day')::date;
					
	ELSIF trim(input_text)  ~ '(^\d{1,2})+\s*-+\s*(\d{1,2})+\s+(\d{4})$'  then 	
	
		-- raise notice 'temp_input %  input_text %',temp_input,input_text;
		
        start_date := to_date(regexp_replace(input_text, '(^\d{1,2})+\s*-+\s*(\d{1,2})+\s+(\d{4})$', '\1 \3', 'g'), 'MM YYYY');
		end_date := (date_trunc('MONTH', to_date(regexp_replace(input_text, '^\d{1,2}\s*-\s*(\d{1,2})\s+(\d{4})$', '\1 \2', 'g'), 'MM YYYY'))   + INTERVAL '1 MONTH' - INTERVAL '1 day')::date;
-- 		EXCEPTION WHEN OTHERS THEN
--             -- If direct conversion fails, return NULLs
--             start_date := NULL;
--             end_date := NULL;
	
	ELSIF trim(input_text) ~ '^\d{4}$' then 
		start_date := to_date(input_text, 'YYYY'); 
		end_date := (start_date::date + INTERVAL '12 MONTH' - INTERVAL '1 day')::date; -- Assuming end_date is not applicable in this fallback
-- 		EXCEPTION WHEN OTHERS THEN
--             -- If direct conversion fails, return NULLs
--             start_date := NULL;
--             end_date := NULL;
	ELSIF trim(input_text) ~ '^\d{4}\s*-\s*(\d{4})$' then
		start_date := to_date(regexp_replace(input_text, '^(\d{4})\s*-\s*\d{4}$', '\1', 'g'), 'YYYY'); 
		end_date := (date_trunc('MONTH',to_date( regexp_replace(input_text, '^\d{4}\s*-\s*(\d{4})$', '\1', 'g'), 'YYYY')) + INTERVAL '1 YEAR' - INTERVAL '1 day')::date;
    ELSE
       BEGIN
            start_date := input_text::DATE;
            end_date := start_date; -- Assuming end_date is not applicable in this fallback
        EXCEPTION WHEN OTHERS THEN
            -- If direct conversion fails, return NULLs
            start_date := NULL;
            end_date := NULL;
        END;
    END IF;
EXCEPTION WHEN OTHERS THEN
            -- If direct conversion fails, return NULLs
            start_date := NULL;
            end_date := NULL;
        END;
		
    RETURN  start_date;
END;
$function$
