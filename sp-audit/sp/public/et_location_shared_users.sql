CREATE OR REPLACE FUNCTION public.et_location_shared_users(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nMasterid uuid;nBundledetailid uuid;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
-- select * from et_location_shared_users('{""nBundledetailid"":1,""jUsers"":[1,2,3],""nMasterid"":2}','r');fetch all in ""r""

-- select * from ""LocationShare""

	open ref for 
		select "nUserid" 
		From "LocationShare" where "nShareby" = nMasterid and "nBundledetailid" = nBundledetailid;

    RETURN ref;
END;
$function$
