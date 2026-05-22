CREATE OR REPLACE FUNCTION transcript.et_get_case_combo(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
BEGIN

	-- select * from "CaseMaster" order by 1 desc
    OPEN ref FOR
    SELECT "nCaseid","cCasename","cCaseno"
    FROM "CaseMaster" t order by "cCasename";

    RETURN ref;
END;
$function$
