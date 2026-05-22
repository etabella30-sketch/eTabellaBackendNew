CREATE OR REPLACE FUNCTION public.et_checkemail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;cEmail text;nCaseid uuid;
BEGIN
-- select * from "UserMaster"
-- select * from et_checkemail ('{"cEmail":"roshan@gmail.com","nCaseid":"1079","nMasterid":"29"}','r1');fetch all in "r1";
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
cEmail := parameter ->>'cEmail';
	
OPEN ref FOR 

select u."nUserid",
       u."cFname",
       u."cLname",
	   u."cEmail",
       u."cProfile" ,t."nTeamid",t."nRoleid",u."nTZid"
From "UserMaster" u
left join "TeamRelation" t on t."nCaseid" = nCaseid and t."nUserid" = u."nUserid"
left join "RoleMaster" r on r."nRoleid" = t."nRoleid"
WHERE lower(trim("cEmail")) = lower(trim(cEmail));

RETURN ref;

	 
END;
$function$
