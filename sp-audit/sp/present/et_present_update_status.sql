CREATE OR REPLACE FUNCTION present.et_present_update_status(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nPresentid uuid;cStatus text;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;
cStatus := parameter ->>'cStatus';

/*
select * from present.et_present_update_status ('{""nPresentid"":393,""nMasterid"":464,""cStatus"":""I""}','r1');fetch all in ""r1"";

*/

update present."PresentationMaster" set "cStatus" = coalesce(cStatus,'I') where "nPresentid" = nPresentid;

	open ref for 
		select 1 as msg,'updated' as value;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
