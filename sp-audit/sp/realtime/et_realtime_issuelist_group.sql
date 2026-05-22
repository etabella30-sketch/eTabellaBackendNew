CREATE OR REPLACE FUNCTION realtime.et_realtime_issuelist_group(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nUserid uuid;nSessionid uuid;nIDid uuid;
BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nSessionid := NULLIF(parameter ->>'nSessionid','')::uuid; 
nIDid := NULLIF(parameter ->>'nIDid','')::uuid;

-- select * from realtime.et_realtime_issuelist_group ('{"nCaseid":"bc669a9e-6388-42af-9a94-f438e907ea30","nSessionid":null,"nIDid":null,"nUserid":"ba561c55-81f5-4180-8934-2ce6dcaa096c"}','r1','r2');fetch all in "r1";fetch all in "r2";

open ref1 for
select ic."nICid","cCategory"
From "RIssueMaster" im 
join "IssueCategory" ic on ic."nICid" = im."nICid"
left join  ( select "nIid" from "RHighlights" rh
    join "RHighlightMapid" m on m."nHid" = rh."nHid"
    where rh."nSessionId" = nSessionid and rh."nUserid" = nUserid ) rh on rh."nIid" = im."nIid"
left join realtime."RIssueSequence" rs on rs."nIid" = im."nIid" 
where ic."nCaseid" = nCaseid and (im."nUserid" = nUserid or (im."nUserid" is null and im."nCaseid" = nCaseid))
group by ic."nICid","cCategory";

open ref2 for
select im."nIid", im."cIName", im."cColor",ic."nICid","cCategory",ic."cICtype", coalesce("nTotalID",0) as "nTotalID"
,0 "nRelid",0 "nImpactid",im."nUserid",count(rh."nIid") as "nTotalHID",
um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby"
From "RIssueMaster" im 
JOIN "UserMaster" um ON um."nUserid" = im."nUserid"
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
,im."nUserid",um."cFname",um."cLname"
    
order by "nSequence","cIName";

 RETURN next ref1;                  
 RETURN next ref2;                  
 -- Return the cursor to the caller
    END;
$function$
