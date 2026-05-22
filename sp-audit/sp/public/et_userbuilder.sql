CREATE OR REPLACE FUNCTION public.et_userbuilder(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nUserid uuid;nCaseid uuid;cPermission text;
cFname text;cLname text;cEmail text;cPassword text;cProfile text;nTZid int;
nTeamid uuid;nRoleid uuid;
BEGIN

nMasterid := (parameter ->>'nMasterid')::uuid;
nCaseid := (parameter ->>'nCaseid')::uuid;
nUserid := (parameter ->>'nUserid')::uuid;
cPermission := parameter ->>'permission';

cFname := parameter ->>'cFname';
cLname := parameter ->>'cLname';
cEmail := parameter ->>'cEmail';
cPassword := parameter ->>'cPassword';
nTZid := parameter ->>'nTZid';
cProfile := parameter ->>'cProfile';
nTeamid := (parameter ->>'nTeamid')::uuid;
nRoleid := (parameter ->>'nRoleid')::uuid;

if(cPermission = 'N')then 
    if not exists(select * From "UserMaster" where upper(trim("cEmail")) = upper(trim(cEmail))) then
        insert into "UserMaster"("cFname","cLname","cEmail","cPassword","cStatus","dCreateDt","nCreateId","cProfile","nTZid")
        values(cFname,cLname,cEmail,cPassword,'A',now(),nMasterid,cProfile,nTZid)
		returning "nUserid" into nUserid;

        
        open ref for
            select 1 as msg,'User created' as value,nUserid as "nUserid";
    else
        open ref for 
            select -1 as msg,'Email already in use' as value;
    end if;
end if;

if(cPermission = 'E')then 
    if not exists(select * From "UserMaster" where upper(trim("cEmail")) = upper(trim(cEmail)) and "nUserid" != nUserid) then
        update "UserMaster" set 
        "cFname" = cFname,"cLname" = cLname,"cEmail" = cEmail,
        "dUpdateDt"=now(),"nUpdateId" = nMasterid,"cProfile" = cProfile,"nTZid" = nTZid
        where "nUserid" = nUserid;
        
        if(coalesce(cPassword,'')!='')then
            update "UserMaster" set "cPassword" = cPassword where "nUserid" = nUserid;
        end if;
        
        open ref for
            select 1 as msg,'User updated' as value,nUserid as "nUserid";
    else
        open ref for 
            select -1 as msg,'Email already in use' as value;
    end if;
end if;

if(cPermission = 'D')then 
    delete from "UserMaster" where "nUserid" = nUserid;
    open ref for 
        select 1 as msg,'User deleted' as value;
end if;
RETURN ref;
END;
$function$
