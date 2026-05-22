CREATE OR REPLACE FUNCTION present.et_present_clear_schedule(parameter json, ref refcursor)
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
select * from present.et_present_clear_schedule('{}','r1');fetch all in ""r1""
*/

delete from present."PMSetupDetail" where "nPresentid" = nPresentid;

delete from present."PMDocuments" where "nPresentid" = nPresentid;

open ref for
	select 1 as msg;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
