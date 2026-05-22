CREATE OR REPLACE FUNCTION public.et_realtime_issuedetail_by_issueid(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nUserid uuid;nSessionid uuid;nIid uuid;
BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nSessionid := NULLIF(parameter ->>'nSessionid','')::uuid;
nIid := NULLIF(parameter ->>'nIid','')::uuid;

--update "RIssueMaster" set "nCaseid"  =22
/*
select * from et_realtime_issuelist('{""nCaseid"":22,""nUserid"":3}','r');fetch all in ""r""

select * from "IssueCategory"
select * from "RIssueMaster"  where "nCaseid" =22
*/

open ref for
select rd."nIDid", rd."cNote",  rd."cPageno",  rd."cONote"
From "RIssueDetail" rd join "RIssueMapid" rm on rm."nIDid" = rd."nIDid"
where "nCaseid" = nCaseid and "nSessionid" = nSessionid and "nUserid" = nUserid
and "nIid" = nIid;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
