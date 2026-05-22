CREATE OR REPLACE FUNCTION public.et_user_tickets_clear(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid; nCaseid uuid;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

/*
select * from et_user_tickets_clear('{"nCaseid":"22","nMasterid":"2"}','r');fetch all in "r"

select * from "TicketMaster"

*/

	delete from "TicketMaster" where "nCaseid" = nCaseid and "nCreateId" = nMasterid and "cStatus" = 'C';

	
    OPEN ref1 FOR
	select 1 as msg,'Cleared' as value;
	
    RETURN NEXT ref1;
    
	
	
	 
END;
$function$
