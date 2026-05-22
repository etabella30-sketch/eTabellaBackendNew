CREATE OR REPLACE FUNCTION present.et_present_remote_req_manage(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nPresentid uuid;nControl smallint;nUserid uuid;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;
nControl := parameter ->>'nControl';
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;

/*
select * from present.et_present_remote_req_manage ('{""nPresentid"":""2"",""nMasterid"":366,""cStatus"":""A"",""nControl"":1,""nUserid"":35}','r1');fetch all in ""r1"";

select * from present."PresentationMaster" order by 1 desc
select * from present."PMUser" where "nPresentid" = 2
*/

if(nControl = 1)then

	update present."PMUser" set "nControl" = null
	where "nPresentid" = nPresentid 
	and "nControl" = 1; 
	
end if;

update present."PMUser" set "nControl" = nControl
where "nPresentid" = nPresentid 
and "nUserid" = nUserid;
	

open ref for 
	select 1 as msg;
	

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
