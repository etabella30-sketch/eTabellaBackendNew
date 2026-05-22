CREATE OR REPLACE FUNCTION public.et_case_user_info(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nCaseid uuid;nUserid uuid;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
/*
 select * from et_case_user_info('{""nMasterid"":2,""nUserid"" : 2,""nCaseid"":22}','r1');FETCH All in ""r1"";
 
 select * From "RoleMaster"
 select * From "UserSetting"
 
*/

	

OPEN ref1 FOR 

select u."nUserid",u."cFname",u."cLname",u."cEmail",t."nRoleid",u."cProfile",u."nTZid",t."nTeamid",u."isAdmin",r."nSrno"
from "UserMaster" u
left join "TeamRelation" t on t."nCaseid" = nCaseid and t."nUserid" = u."nUserid"
left join "RoleMaster" r on r."nRoleid" = t."nRoleid"
where u."nUserid" = nUserid
group by u."nUserid",u."cFname",u."cLname",u."cEmail",t."nRoleid",u."cProfile",u."nTZid",t."nTeamid","isAdmin",r."nSrno";

RETURN NEXT ref1;

	 
END;
$function$
