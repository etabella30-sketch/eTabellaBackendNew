CREATE OR REPLACE FUNCTION public.et_pm_get_case_permission(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;
nCaseid uuid;
-- select * from et_individual_doc_info('{""nBundledetailid"":287419,""nUserid"":10}','r');fetch all in ""r""
-- select ""cFilesize"" from ""BundleDetail"" where 
BEGIN
nMasterid := (parameter ->>'nMasterid')::uuid;
nCaseid := (parameter ->>'nCaseid')::uuid;

    if exists (SELECT 1 FROM "TeamRelation" where "nCaseid" = nCaseid and "nUserid" = nMasterid) then 
		open ref for select 1 msg;
	else 
		open ref for select -1 msg;
	end if;
	
 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
