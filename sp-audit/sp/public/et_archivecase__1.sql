CREATE OR REPLACE FUNCTION public.et_archivecase(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nUserid uuid;nCaseid uuid;isArchived boolean;
BEGIN

nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
isArchived := coalesce((parameter ->>'bIsarchived')::boolean,false);
/*
 select * from et_archivecase('{"nCaseid":"2739-uuid-format","isArchived":false}','r1');fetch all in "r1";
select * from "LogCaseMaster" where "isArchived" = true
*/

update "CaseMaster" set "isArchived" = isArchived,"dUpdateDt" = now() where "nCaseid" = nCaseid;
			-- select * from "LogCategory" where "nLCatid" in (85,86)          
			INSERT INTO public."LogCaseMaster"("nLCatid", "nCaseid","nMasterid") 
			values ((case when isArchived = true then 86 else 85 end),nCaseid,nUserid);

open ref for 
select 1 as msg,'Case archived' as value;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
