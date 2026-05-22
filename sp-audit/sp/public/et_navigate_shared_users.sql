CREATE OR REPLACE FUNCTION public.et_navigate_shared_users(parameter json, ref1 refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;
    nId uuid;cType text;
BEGIN
    -- Extract parameters
    nId := NULLIF(parameter->>'nId','')::uuid;
    cType := (parameter->>'cType');
    nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;

    -- Check if user is admin (moved outside the subquery for better performance)

/*
select * from et_navigate_shared_users ('{""nBundledetailid"":555364,""cSorttype"":""H"",""cSortby"":""D"",""nPageNumber"":1,""nMasterid"":2}','r1');fetch all in ""r1"";

		select * from "DMShared" 
*/

if(cType = 'D')then
    OPEN ref1 FOR 
		select "nUserid" from "DMShared" where "nDocid" = nId;

elsif(cType = 'F')then
	OPEN ref1 FOR 
		select "nUserid" from "FMShared" where "nFSid" = nId;

elsif(cType = 'W')then
	OPEN ref1 FOR 
		select "nUserid" from "WMShared" where "nWebid" = nId;

end if;

   RETURN ref1;

END;
$function$
