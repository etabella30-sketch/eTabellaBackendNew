CREATE OR REPLACE FUNCTION public.et_pm_rolepermission(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid; nCaseid uuid; isAdmin boolean = false;
nRoleid uuid;
BEGIN

nMasterid := (parameter ->>'nMasterid')::uuid;
nCaseid := (parameter ->>'nCaseid')::uuid;
/*
 select * from et_pm_rolepermission('{""nMasterid"":2,""pageNumber"":1,""nCaseid"":22}','r1','r2');FETCH All in ""r1"";FETCH All in ""r2""

select * from ""UserMaster"" where ""cFname"" like 'Solanki%'

select * from ""RolePermission""

*/
-- select * from ""TeamRelation""
-- select * from ""UserMaster"" where ""cEmail"" = 'patel@gmail.com'
 select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nMasterid;
 if(isAdmin = false) then
	select "nRoleid" into nRoleid from "TeamRelation" where "nUserid" = nMasterid;
 end if;

OPEN ref1 FOR 

select nRoleid, r."nRoleid",r."cRole", case when count(tr."nUserid") > 0 then 'A' else 'I' end "cStatus",max(tr."dModifyDt") as "dLastmodified"
From "RoleMaster" r
left join "RolePermission" rp on rp."nCaseid" = nCaseid and rp."nRoleid" = r."nRoleid"
left join "TeamRelation" tr on tr."nCaseid" = nCaseid and tr."nRoleid" = r."nRoleid" and tr."cStatus" = 'A'
left join "UserMaster" um on um."nUserid" = tr."nUserid" and um."cStatus" = 'A'
 where case when isAdmin = false and nRoleid IS NOT NULL then nRoleid != r."nRoleid" else true end 
group by r."nRoleid",r."cRole",r."cRStatus"
order by r."nRoleid"
;

RETURN NEXT ref1;

	 -- select * from ""UserMaster""
	
OPEN ref2 FOR 
select tr."nRoleid",um."nUserid",um."cFname",um."cLname",um."cProfile",tr."cStatus"
from "TeamRelation" tr 
join "UserMaster" um on um."nUserid" = tr."nUserid" 
where tr."nCaseid" = nCaseid;

RETURN NEXT ref2;
	 
	 
END;
$function$
