CREATE OR REPLACE FUNCTION public.et_signout(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
/*
select * from et_signout ('{"nMasterid":2,"cToken":"234234","cJwt":"fdffff","bResponce":true}','r1');fetch all in "r1";
select * from "UserMaster"  order by 1
*/

	update "UserMaster" set "dLastoutdt" = now()
	where "nUserid" = nMasterid; 

	
OPEN ref1 FOR 
select 1 as msg;	
		
    RETURN NEXT ref1;
    
	

	 
END;
$function$
