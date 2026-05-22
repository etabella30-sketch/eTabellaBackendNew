CREATE OR REPLACE FUNCTION present.et_present_unsave_highlights(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nPresentid uuid;

BEGIN
-- select * from present.et_present_unsave_highlights('{""nPresentid"":9, ""nMasterid"": 29}','r');fetch all in ""r""
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;

/*
select * From present.""PMHighlights""
	
select * From present.""PresentationMaster""

select * From present.""PMUser""
	
select * From present.""PMLinkShared""

*/

delete From present."PMHighlights" where "nPresentid" = nPresentid and "nUserid" = nMasterid;

delete From present."PMLinkShared" where "nPresentid" = nPresentid and "nUserid" = nMasterid;

	
open ref for
	select 1 as msg;

 -- Return the cursor to the caller
 RETURN ref;    
END;

$function$
