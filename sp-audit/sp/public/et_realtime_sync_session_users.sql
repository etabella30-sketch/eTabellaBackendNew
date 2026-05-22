CREATE OR REPLACE FUNCTION public.et_realtime_sync_session_users(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    jCaseids jsonb;
BEGIN
    jCaseids := parameter ->> 'jCaseids';

    OPEN ref FOR
	select u."nUserid",u."cEmail",u."cFname",u."cLname",
	jsonb_agg(c."nCaseid") as "jCases"
	from "CaseMaster" c 
	join "TeamRelation" tr on tr."nCaseid" = c."nCaseid"
	join "UserMaster" u on u."nUserid" = tr."nUserid"
	where jCaseids @> to_jsonb(c."nCaseid")
	group by u."nUserid",u."cEmail",u."cFname",u."cLname";

    RETURN ref;
END;
$function$
