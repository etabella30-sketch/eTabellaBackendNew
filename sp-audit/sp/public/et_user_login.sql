CREATE OR REPLACE FUNCTION public.et_user_login(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare cUsername text;cPassword text;nUserid uuid;
BEGIN

cUsername := parameter ->> 'cUsername';
cPassword := parameter ->> 'cPassword';

-- select * from et_user_login ('{""cUsername"":""Rajendra@gmail.com"",""cPassword"":""123""}','refcursor'); FETCH All in ""refcursor"";
-- select * from et_user_login ('{""id"":1,""cUsername"":""Wadmin"",""cPassword"":""test""}','refcursor');FETCH All in ""refcursor"";
-- select * from et_user_login ('{""id"":1,""cUsername"":""user1@example.com"",""cPassword"":""password""}','refcursor');FETCH All in ""refcursor"";
-- select * From "UserMaster"

select "nUserid" into nUserid From "UserMaster" where 
trim(upper("cEmail")) = trim(upper(cUsername)) 
and "cPassword" = cPassword ; 

if(nUserid IS NOT NULL)then 

if exists(select * from "UserMaster" where "nUserid" = nUserid and ("cStatus" = 'A' or "isAdmin" = true ))then 

update "UserMaster" set "dLastlogindt" = now() where "nUserid" = nUserid;

open ref for 
select 1 as msg,'Login Successful' as value1,u.* --,r."cRole" 
from "UserMaster" u
--join "RoleMaster" r on r."nRoleid" = u."nRoleid"
where u."nUserid" = nUserid;

else 

open ref for select -2 as msg,'You are forbidden to access this site' as value1;

end if;

else
open ref for select -1 as msg,'Invalid Username or Password' as value1;
end if;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
