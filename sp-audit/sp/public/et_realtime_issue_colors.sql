CREATE OR REPLACE FUNCTION public.et_realtime_issue_colors(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;
BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

/*
select * from et_realtime_issuelist('{"nCaseid":1}','r');fetch all in "r"

select * from "IssueCategory"
select * from "RIssueMaster"
*/
--select * from et_realtime_issuelist ('{"nCaseid":1}','r1');fetch all in "r1";
open ref for
select im."nIid" ,im."cIName", im."cColor",ic."nICid","cCategory" From "RIssueMaster" im join "IssueCategory" ic
on ic."nICid" = im."nICid"
where ic."nCaseid" =nCaseid
order by "cIName";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
