CREATE OR REPLACE FUNCTION public.et_issue_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nCaseid uuid;
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
/*
select * from et_issue_list ('{"nCaseid":22,"nMasterid":2}','r1');fetch all in "r1";
select * from "RIssueMaster"
select * from "IssueCategory" order by 1 desc
*/
open ref for
select i."nIid",i."cIName",i."cColor",i."nICid",ic."cCategory"
from "RIssueMaster" i
join "IssueCategory" ic on ic."nICid" = i."nICid"
where i."nUserid" = nMasterid and i."nCaseid" = nCaseid
order by i."dCreatedt"
;
 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
