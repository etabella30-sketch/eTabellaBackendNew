CREATE OR REPLACE FUNCTION public.et_userdetail(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
/*
select * from et_userdetail ('{"nMasterid":"0"}','r1');fetch all in "r1";
select * from "UserMaster"  order by 1
*/

	
OPEN ref1 FOR 
	select 1 as msg,'User information' as "value","nUserid","cEmail","cFname","cLname","cProfile","isAdmin","cJwt" as "token" from "UserMaster" where "nUserid" = nMasterid
;	
		
    RETURN NEXT ref1;
    
	

	 
END;
$function$
