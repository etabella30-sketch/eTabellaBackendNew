CREATE OR REPLACE FUNCTION present.et_present_toolbar_user_accept_reject(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nPresentid uuid;nUserid uuid;cStatus text;isHaveHighlight boolean default false;cOldUsrStatus text;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;
cStatus := parameter ->>'cStatus';

/*
select * from present.et_present_toolbar_user_accept_reject ('{"nPresentid":9,"nUserid":279,"cStatus":"A","nMasterid":366}','r1');fetch all in "r1";

select * from "Annotations" limit 1

select * from present."PMUser" where "nPresentid" = 9
select * from "UserMaster"
select * from present."PMHighlights"
select * from present."PMLinkShared"

*/

cOldUsrStatus := (select "cStatus" from present."PMUser" where "nPresentid" = nPresentid and "nUserid" = nUserid limit 1);

update present."PMUser" set "cAStatus" = coalesce(cStatus,'P'),"dActionDt" = now() ,
	"cStatus" = (case when cStatus = 'A' then 'A' else "cStatus" end)
where "nPresentid" = nPresentid and "nUserid" = nUserid;

if( coalesce(cStatus,'P') = 'A')then

	
	
	if exists (select * from present."PMHighlights" where "nPresentid" = nPresentid and "nUserid" = nUserid limit 1)then
		isHaveHighlight = true;
	
	end if;

    if exists(select * from present."PMLinkShared" where "nPresentid" = nPresentid and "nUserid" = nUserid limit 1)then

		isHaveHighlight = true;

	end if;

if(isHaveHighlight = false or cOldUsrStatus = 'I')then

	update present."PMUser" set "cAStatus" = 'J' where "nPresentid" = nPresentid and "nUserid" = nUserid;
	
end if;

end if;

open ref for 
	select 1 as msg,isHaveHighlight as "isHaveHighlight",cOldUsrStatus;
	

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
