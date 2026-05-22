CREATE OR REPLACE FUNCTION present.et_present_toolbar_user_joined(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nPresentid uuid;nUserid uuid;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;

/*
select * from present.et_present_toolbar_user_joined ('{""nPresentid"":""88"",""nMasterid"":366,""cStatus"":""A"",""nUserid"":367}','r1');fetch all in ""r1"";

*/

update present."PMUser" set "cAStatus" = 'J'
where "nPresentid" = nPresentid 
and "nUserid" = nMasterid;
	

open ref for 
	select 1 as msg,"nCreateid" as "nUserid" 
	from present."PresentationMaster" where "nPresentid" = nPresentid;
	

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
