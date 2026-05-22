CREATE OR REPLACE FUNCTION public.et_rolelist(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;isAdmin boolean;
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nMasterid;
/*
 select * from et_rolelist('{"nMasterid":29}','r1');FETCH All in "r1";
 
 
*/
	
OPEN ref1 FOR 
select "nRoleid","cRole","cRStatus" 
From "RoleMaster" --where case when isAdmin = false then "nRoleid" != 2 else true end
;
RETURN NEXT ref1;
	 
END;
$function$
