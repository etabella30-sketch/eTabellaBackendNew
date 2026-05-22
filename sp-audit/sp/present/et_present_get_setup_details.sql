CREATE OR REPLACE FUNCTION present.et_present_get_setup_details(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare 
	nMasterid uuid;nPresentid uuid;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;

/*
select * From ""PresentationMaster""
select * From ""PMContact""
select * From ""PMUser""
select * From ""BundleDetail""
select * From ""Codemaster""
select * From ""PMDocuments""
select * from present.et_present_get_setup_details('{}','r');fetch all in ""r""
*/

open ref for
	select "nBundledetailid","nBundleid","cType" 
	from present."PMSetupDetail" 
	where "nPresentid" = nPresentid;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
