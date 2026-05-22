CREATE OR REPLACE FUNCTION public.et_ticket_builder(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nCaseid uuid;cSession text;cDesc text;
cImage text;cImagename text;
BEGIN
-- select * from "TicketMaster"
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
cSession := parameter ->>'cSession';
cDesc := parameter ->>'cDesc';
cImage := parameter ->>'cImage';
cImagename := parameter ->>'cImagename';

-- if not exists(select * from "TicketMaster" where "nCreateId" = nMasterid and "cStatus" = 'P'  and "nCaseid" = nCaseid) then

	insert into "TicketMaster"("nCaseid","cSession","cDesc","cImgname","cImgpath","nCreateId")
	values(nCaseid,cSession,cDesc,cImagename,cImage,nMasterid);

	
    OPEN ref1 FOR
	select 1 msg,'Ticket submit Successful.' value;
	
-- else
-- 	open ref1 for select -1 as msg,'You have already rais a ticket please wait till your ticket close' as value;

-- end if;

	
    RETURN NEXT ref1;
    
	
	
	 
END;
$function$
