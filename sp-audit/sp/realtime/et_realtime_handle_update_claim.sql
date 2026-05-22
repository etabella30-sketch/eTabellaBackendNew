CREATE OR REPLACE FUNCTION realtime.et_realtime_handle_update_claim(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nICid UUID;cCategory text;
	nUserid UUID;
	msg int;msg_text text;
BEGIN
    nICid := NULLIF(parameter ->> 'nICid','')::UUID;
	nUserid:= NULLIF(parameter ->> 'nUserid','')::UUID;
	cCategory:= parameter ->> 'cCategory';
	
    msg := 1;
        -- Check if the issue name exists
	update "IssueCategory" set "cCategory" = cCategory,"nUserid" = nUserid where "nICid" = nICid;

	msg_text := 'Updated';
	
    OPEN ref FOR SELECT msg, msg_text AS message;

    RETURN ref;
END;
$function$
