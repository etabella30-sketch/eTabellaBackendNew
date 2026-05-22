CREATE OR REPLACE FUNCTION public.et_realtime_sync_allusers(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
	
BEGIN

/*
select * from et_realtime_sync_allusers ('{}','r1');fetch all in "r1";
*/

	open ref for 

	select "nUserid","cFname","cLname","cEmail" 
	from "UserMaster" where "cStatus" = 'A' order by "nUserid";
	
    RETURN ref;
END;
$function$
