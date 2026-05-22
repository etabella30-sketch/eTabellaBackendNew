CREATE OR REPLACE FUNCTION realtime.et_realtime_issuelist(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nUserid uuid;nSessionid uuid;nIDid uuid;
BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nSessionid := NULLIF(parameter ->>'nSessionid','')::uuid; 
nIDid := NULLIF(parameter ->>'nIDid','')::uuid;

-- select * from realtime.et_realtime_issuelist ('{"nCaseid":"e0cd23d4-12fa-4b80-bdc0-88ec4287957b","nSessionid":null,"nIDid":null,"nMasterid":"7ee7a723-d96d-4d63-81c1-4dc4a2be4699"}','r1');fetch all in "r1";

open ref for
select im."nIid", im."cIName", im."cColor",ic."nICid","cCategory",ic."cICtype", coalesce("nTotalID",0) as "nTotalID"
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
group by rs."nSequence", im."nIid", im."cIName", im."cColor",ic."nICid","cCategory", "nTotalID"
,im."nUserid"
    
order by "nSequence","cIName";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
