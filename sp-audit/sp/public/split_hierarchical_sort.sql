CREATE OR REPLACE FUNCTION public.split_hierarchical_sort(input_text text)
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
    parts text[];
    result text[];
    i integer;
    first_part text;
    numeric_part text;
BEGIN
    -- Handle NULL input
    IF input_text IS NULL THEN
        RETURN ARRAY[]::text[];
    END IF;
    
    -- First, handle special case for simple values (like A1, A2, A31)
    IF input_text !~ '\.' THEN
        -- Extract the alpha and numeric parts
        first_part := substring(input_text from '^[A-Za-z]+');
        numeric_part := substring(input_text from '[0-9]+$');
        
        IF numeric_part IS NOT NULL THEN
            RETURN ARRAY[first_part, lpad(numeric_part, 10, '0')];
        ELSE
            RETURN ARRAY[input_text];
        END IF;
    END IF;
    
    -- For hierarchical values, split and process normally
    parts := string_to_array(input_text, '.');
    
    IF parts IS NULL OR array_length(parts, 1) IS NULL THEN
        RETURN ARRAY[]::text[];
    END IF;
    
    result := ARRAY[]::text[];
    
    -- Process first part specially (A1, A2 etc)
    first_part := substring(parts[1] from '^[A-Za-z]+');
    numeric_part := substring(parts[1] from '[0-9]+$');
    
    IF numeric_part IS NOT NULL THEN
        result := result || first_part || lpad(numeric_part, 10, '0');
    ELSE
        result := result || parts[1];
    END IF;
    
    -- Process remaining parts
    FOR i IN 2..array_length(parts, 1) LOOP
        IF parts[i] ~ '^[0-9]+$' THEN
            result := result || lpad(parts[i], 10, '0');
        ELSE
            result := result || parts[i];
        END IF;
    END LOOP;
    
    RETURN result;
END;
$function$
