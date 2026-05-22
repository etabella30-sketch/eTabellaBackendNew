CREATE OR REPLACE FUNCTION transcript.et_get_session(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nCaseid uuid;
BEGIN
	nCaseid := parameter->>'nCaseid';
	-- select * from "CaseMaster" order by 1 desc
    OPEN ref FOR
    SELECT "nSesid","cName"
    FROM "RSessionMaster" t where "nCaseid" = nCaseid order by "cName";

    RETURN ref;
END;
$function$
