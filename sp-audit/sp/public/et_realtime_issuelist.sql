CREATE OR REPLACE FUNCTION public.et_realtime_issuelist(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nUserid uuid;nSessionid uuid;nIDid uuid;
BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nSessionid := NULLIF(parameter ->>'nSessionid','')::uuid; 
nIDid := NULLIF(parameter ->>'nIDid','')::uuid;

-- select * from et_realtime_issuelist('{"nCaseid":"bc669a9e-6388-42af-9a94-f438e907ea30","nSessionid":"52a7e5cf-3480-4d06-bb79-90ce02b728f0","nUserid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5"}','r');fetch all in "r"

open ref for
select im."nIid", im."cIName", im."cColor",ic."nICid","cCategory", coalesce("nTotalID",0) as "nTotalID"
,0 "nRelid",0 "nImpactid",im."nUserid",count(rh."nIid") as "nTotalHID"
From "RIssueMaster" im 
join "IssueCategory" ic on ic."nICid" = im."nICid"
left join issue_detail_count id on id."nIid" = im."nIid" 
    
and im."nCaseid" = id."nCaseid" 
and im."nUserid" = id."nUserid" and "nSessionid" = nSessionid

left join 
    (
    select "nIid"
    from "RHighlights" rh
    join "RHighlightMapid" m on m."nHid" = rh."nHid"
    where rh."nSessionId" = nSessionid and rh."nUserid" = nUserid 
    ) rh on rh."nIid" = im."nIid"
left join realtime."RIssueSequence" rs on rs."nIid" = im."nIid" 
where ic."nCaseid" = nCaseid and (im."nUserid" = nUserid or (im."nUserid" is null and im."nCaseid" = nCaseid))
group by rs."nSequence",im."nIid", im."cIName", im."cColor",ic."nICid","cCategory", "nTotalID"
,im."nUserid"
    
order by "nSequence","cIName";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
