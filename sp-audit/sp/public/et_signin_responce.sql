CREATE OR REPLACE FUNCTION public.et_signin_responce(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;cToken text;cJwt text;bResponce boolean;
BEGIN

nMasterid := (nullif(parameter ->>'nMasterid',''))::uuid;
cToken := parameter ->>'cToken';
cJwt := parameter ->>'cJwt';
bResponce := parameter ->>'bResponce';
/*
select * from et_signin_responce ('{"nMasterid":2,"cToken":"234234","cJwt":"fdffff","bResponce":true}','r1');fetch all in "r1";
select * from "UserMaster"  order by 1
*/

if(bResponce=true)then

	update "UserMaster" set "dLastlogindt" = now(),"cToken" = cToken,"cJwt" = cJwt
	where "nUserid" = nMasterid; 
end if;

		
	
OPEN ref1 FOR 
	select "nUserid","cEmail","cFname","cLname","cProfile","isAdmin" from "UserMaster" where "nUserid" = nMasterid
;	
		
		
    RETURN NEXT ref1;
    
	

	 
END;
$function$
