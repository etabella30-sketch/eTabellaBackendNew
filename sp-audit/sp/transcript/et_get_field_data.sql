CREATE OR REPLACE FUNCTION transcript.et_get_field_data(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    column_nm text;
    searchstr text;
    cleaned_searchstr text;
    script text;
BEGIN
    column_nm := parameter->>'column_nm';
    searchstr := parameter->>'searchstr';

    -- Clean newlines and carriage returns
    cleaned_searchstr := replace(replace(searchstr, E'\n', ''), E'\r', '');

    -- Optional: Validate column_nm against a whitelist

    IF cleaned_searchstr IS NOT NULL AND cleaned_searchstr <> '' THEN
        script := format(
            'SELECT DISTINCT TRIM(%1$I) AS %1$I FROM transcript."Transcripts" WHERE %1$I ILIKE %2$L ORDER BY TRIM(%1$I) LIMIT 20',
            column_nm, '%' || cleaned_searchstr || '%'
        );
    ELSE
        script := format(
            'SELECT DISTINCT TRIM(%1$I) AS %1$I FROM transcript."Transcripts" ORDER BY TRIM(%1$I) LIMIT 20',
            column_nm
        );
    END IF;

    OPEN ref FOR EXECUTE script;
    RETURN ref;
END;
$function$
