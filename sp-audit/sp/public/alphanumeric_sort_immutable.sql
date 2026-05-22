CREATE OR REPLACE FUNCTION public.alphanumeric_sort_immutable(input_text text)
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE PARALLEL SAFE
AS $function$
DECLARE
    parts text[];
    current_part text := '';
    i integer;
    c text;
    is_prev_digit boolean := false;
    is_curr_digit boolean;
BEGIN
    -- Handle NULL input
    IF input_text IS NULL THEN
        RETURN ARRAY['']::text[];
    END IF;
    
    -- Initialize array
    parts := ARRAY[]::text[];
    
    -- Loop through each character
    FOR i IN 1..length(input_text) LOOP
        c := substring(input_text from i for 1);
        is_curr_digit := c ~ '[0-9]';
        
        -- If character is alphanumeric
        IF c ~ '[a-zA-Z0-9]' THEN
            -- Start new part if switching between digits and letters
            IF is_prev_digit != is_curr_digit AND current_part != '' THEN
                parts := array_append(parts, current_part);
                current_part := '';
            END IF;
            
            current_part := current_part || c;
            is_prev_digit := is_curr_digit;
        ELSE
            -- For special characters, add current part if exists and skip special char
            IF current_part != '' THEN
                parts := array_append(parts, current_part);
                current_part := '';
            END IF;
        END IF;
    END LOOP;
    
    -- Add final part if exists
    IF current_part != '' THEN
        parts := array_append(parts, current_part);
    END IF;

    -- If no parts were added, return empty array with one element
    IF array_length(parts, 1) IS NULL THEN
        RETURN ARRAY['']::text[];
    END IF;
    
    -- Pad numeric parts with zeros for proper sorting
    FOR i IN 1..array_length(parts, 1) LOOP
        IF parts[i] ~ '^[0-9]+$' THEN
            parts[i] := lpad(parts[i], 10, '0');
        END IF;
    END LOOP;
    
    RETURN parts;
END;
$function$
