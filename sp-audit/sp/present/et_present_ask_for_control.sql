CREATE OR REPLACE FUNCTION present.et_present_ask_for_control(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nPresentid uuid;nUserid uuid;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;

/*
select * from present.et_present_ask_for_control ('{""nPresentid"":""2"",""nMasterid"":366,""cStatus"":""A"",""nUserid"":367}','r1');fetch all in ""r1"";

select *	from present.""PresentationMaster"" order by 1 desc
select *	from present.""PMUser"" where ""nPresentid"" = 2
*/

update present."PMUser" set "nControl" = 0
where "nPresentid" = nPresentid 
and "nUserid" = nMasterid;
	
select "nCreateid" into nUserid 
	from present."PresentationMaster" 
	where "nPresentid" = nPresentid;

open ref for 
	select 1 as msg,nUserid as "nUserid";
	

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
