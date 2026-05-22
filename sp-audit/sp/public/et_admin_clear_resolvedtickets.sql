CREATE OR REPLACE FUNCTION public.et_admin_clear_resolvedtickets(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nCaseid uuid;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

/*
select * from et_admin_clear_resolvedtickets('{""nCaseid"":22,""nMasterid"":2}','r');fetch all in ""r""

select * from "TicketMaster"

alter table "TicketMaster" add column "isCleared" boolean default false

*/

	update "TicketMaster" set "isCleared" = true where "cStatus" = 'C' and "nCaseid" = nCaseid;

    OPEN ref1 FOR
	select 1 as msg,'Ticket resolved';
	
    RETURN NEXT ref1;
    
	
	
	 
END;
$function$
