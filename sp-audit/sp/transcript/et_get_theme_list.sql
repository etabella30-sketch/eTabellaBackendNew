CREATE OR REPLACE FUNCTION transcript.et_get_theme_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;

BEGIN
nMasterid := parameter->>'nMasterid';

    OPEN ref FOR
    SELECT "cThemeid", "cName","bIsdefault" FROM transcript."Themes" ;

    RETURN ref;
END;
$function$
