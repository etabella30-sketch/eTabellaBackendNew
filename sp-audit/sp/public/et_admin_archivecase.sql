CREATE OR REPLACE FUNCTION public.et_admin_archivecase(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nUserid uuid;nCaseid uuid;isArchived boolean;
BEGIN

nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
/*
 select * from et_admin_archivecase ('{"cCasename":"V2- test","cCaseno":"123","cDesc":"9988","cIndexheader":"","cClaimant":"","cRespondent":"","nMasterid":"2-uuid-format"}','r1');fetch all in "r1";
select * from "CaseMaster"
*/

update "CaseMaster" set "isArchived" = isArchived where "nCaseid" = nCaseid;

open ref for 
select 1 as msg,'Case archived' as value;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
