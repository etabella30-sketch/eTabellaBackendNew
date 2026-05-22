CREATE OR REPLACE FUNCTION helpcenter.et_help_get_common_topic(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;

BEGIN
/*
select * from helpcenter.et_help_get_common_topic('{"nMasterid": "29"}','r');fetch all in "r"
	select * from helpcenter."SearchKeyWords"

*/

-- alter table helpcenter."SubModule" add column "nCount" bigint
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;

	open ref for
		SELECT "nSMid","cTitle","cLink" FROM helpcenter."SubModule" ORDER BY "nCount" DESC LIMIT 5;
 
 -- Return the cursor to the caller
 RETURN ref;    
END;

$function$
