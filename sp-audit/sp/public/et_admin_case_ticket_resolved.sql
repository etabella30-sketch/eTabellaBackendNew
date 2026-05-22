CREATE OR REPLACE FUNCTION public.et_admin_case_ticket_resolved(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nTicketid uuid; jNotify jsonb; nPMid int;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid', '')::uuid;
nTicketid := NULLIF(parameter ->>'nTicketid', '')::uuid;

/*
select * from et_admin_case_ticket_resolved('{""nCaseid"":22,""nMasterid"":2}','r');fetch all in ""r""

select * from ""TicketMaster""

alter table ""TicketMaster"" add column ""isCleared"" boolean default false

*/
	nPMid := (select "nPMid"  from "PermissionModule" where "cType" = 'NF' );

	update "TicketMaster" set "cStatus" = 'C' where "nTicketid" = nTicketid;

	
	with tbl as (
		select u."nUserid",'Task Resolved' as "cTitle",
		 'Your Ticket has been resolved.' as "cMsg",
		 u."cToken",'TR' as "cType", t."nCaseid"
		 from "UserMaster" u
		 join "TicketMaster" t on t."nCreateId" = u."nUserid"
		 left join "UserPermission" up on up."nUserid" = u."nUserid"  and  up."nCaseid" = t."nCaseid" and up."nPMid" = nPMid
		 where t."nTicketid" = nTicketid
		 and coalesce(up."nUPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid 
		 ) select jsonb_agg(t) into jNotify from tbl t;
	
	
    OPEN ref1 FOR
	select 1 as msg,'Ticket resolved', coalesce(jNotify,'[]'::jsonb) as "jNotify";
	
    RETURN NEXT ref1;
    
	
	
	 
END;
$function$
