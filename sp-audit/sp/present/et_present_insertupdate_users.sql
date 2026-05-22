CREATE OR REPLACE FUNCTION present.et_present_insertupdate_users(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nPresentid uuid;nUserid uuid;cPermission text;cStatus text;nPUid uuid;nTotal int;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
cPermission := parameter ->>'cPermission';
cStatus := parameter ->>'cStatus';

/*
select * from et_present_insertupdate_users ('{""nPresentid"":88,""nMasterid"":366}','r1');fetch all in ""r1"";
select * from present.et_present_insertupdate_users ('{""nPresentid"":88,""nUserid"":279,""cPermission"":""D"",""cStatus"":""I"",""nMasterid"":366}','r1');fetch all in ""r1"";
select * from ""Annotations"" limit 1

select * from ""PMUser"" where ""nPresentid"" = 88

*/

if(cPermission = 'N')then

	if not exists(select * from present."PMUser" where "nPresentid" = nPresentid and "nUserid" = nUserid)then
		insert into present."PMUser"("nPresentid","nUserid","cStatus")
		values(nPresentid,nUserid,'A') returning "nPUid" into nPUid;
	end if;

elsif(cPermission = 'E')then
	
	update present."PMUser" p set "cStatus" = coalesce(cStatus,'A') 
	where p."nPresentid" = nPresentid and p."nUserid" = nUserid;

elsif(cPermission = 'D')then

	delete from present."PMUser" where "nPresentid" = nPresentid and "nUserid" = nUserid;

end if;

select count("nPUid") into nTotal 
	from present."PMUser" where "nPresentid" = nPresentid ;

open ref for 
	select 1 as msg,nPUid as "nPUid",nTotal as "nTotal";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
