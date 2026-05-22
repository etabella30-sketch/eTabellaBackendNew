CREATE OR REPLACE FUNCTION public.et_user_tickets(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nCaseid uuid;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

/*
select * from et_user_tickets('{""nCaseid"":22,""nMasterid"":2}','r');fetch all in ""r""

select * from "TicketMaster"

*/

	
    OPEN ref1 FOR
	select t."nTicketid",t."nCaseid",t."cSession",t."cDesc",t."cImgname",t."cImgpath",t."cStatus",t."dCreateDt"
	From "TicketMaster" t 
	where t."nCaseid" = nCaseid 
	and t."nCreateId" = nMasterid order by "cStatus";
	
    RETURN NEXT ref1;
    
	
	
	 
END;
$function$
