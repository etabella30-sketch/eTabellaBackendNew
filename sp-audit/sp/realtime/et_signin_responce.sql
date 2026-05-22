CREATE OR REPLACE FUNCTION realtime.et_signin_responce(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid UUID;email text;cSessionUnicId text;
BEGIN

nMasterid := (parameter ->>'nUserid')::UUID;
email := parameter ->>'cEmail';
cSessionUnicId := parameter ->>'cSessionUnicId';

/*
select * from realtime.et_signin ('{"cEmail":"mipl@gmail.com","password":"1234"}','r1');fetch all in "r1";

select * from realtime.et_signin_responce ('{"nUserid":"3a168b69-1bb8-4c7e-881f-dff78a854f80"}','r1');fetch all in "r1";

select * from realtime."LogUserLogins"

*/

insert into realtime."LogUserLogins"("nUserid","cSessionUnicId")
values(nMasterid,cSessionUnicId);
    
    OPEN ref1 FOR 
	select 1 as msg
    ;    
        
    RETURN NEXT ref1;
    
    

     
END;
$function$
