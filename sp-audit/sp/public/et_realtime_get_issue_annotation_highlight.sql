CREATE OR REPLACE FUNCTION public.et_realtime_get_issue_annotation_highlight(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nSessionid UUID;
    nCaseid UUID;
    nUserid UUID;
    cTranscript text;
    nIDid uuid;
    jIssues jsonb;
    jPages jsonb;
  begin

    nSessionid := NULLIF(parameter ->> 'nSessionid','')::UUID;
    nCaseid := NULLIF(parameter ->> 'nCaseid','')::UUID;
    nUserid := NULLIF(parameter ->> 'nUserid','')::UUID;
    cTranscript := (parameter ->>'cTranscript')::text;
    nIDid := NULLIF(parameter ->>'nIDid','')::UUID;

    jIssues := coalesce((parameter ->>'jIssues')::jsonb,'[]'::jsonb);
    jPages := coalesce((parameter ->>'jPages')::jsonb,'[]'::jsonb);
 
 
 -- select * from public.et_realtime_get_issue_annotation_highlight ('{"nSessionid":"5a3c23ff-198e-4cb9-9286-54e8aacab411","nUserid":"2411ad8a-e2c7-434a-9e3c-4bbe168620e9","nCaseid":"81765ff6-8040-4081-af51-be37c588727d","cTranscript":"A"}','r1','r2');fetch all in "r1";fetch all in "r2";

 
    OPEN ref1 FOR
        select "nIDid",case when coalesce(cTranscript,'N') = 'N' then "cPageno" else "cTPageno" end  "pageIndex",case when coalesce(cTranscript,'N') = 'N' then  "jCordinates" else "jTCordinates" end  cordinates,"cColor" color,"nICount" ,"bTrf"
        From "RIssuesummary" id
        Where 
        (case when jIssues != '[]'::jsonb then jIssues @> to_jsonb("nIDid") else false end  and id."nSessionid" = nSessionid ) 
        or 
        (id."nCaseid" = nCaseid and id."nSessionid" = nSessionid and id."nUserid" = nUserid and jIssues = '[]'::jsonb)
        ;

    RETURN NEXT ref1;
    
    OPEN ref2 FOR 
    select rh."nHid",
    case when coalesce(cTranscript,'N') = 'N' then "cPageno" else "cTPageno" end 
    as "cPageno",
    case when coalesce(cTranscript,'N') = 'N' then "cLineno" else "cTLineno" end 
    "cLineno","cTime","cColor" ,rg."nGroupid",rg."issueids"
    From "RHighlights" rh 
    left join (
        with tbl as (
        select *, grp, DENSE_RANK() OVER (ORDER BY i,"cPageno",grp) AS unique_no From (
        SELECT  "cLineno"::bigint - ROW_NUMBER() OVER (PARTITION BY "cPageno"::int,jsonb_agg(m."nIid"  order by m."serialno",m."nIid") ORDER BY "cLineno"::int) AS grp,  "cPageno", "cLineno",m."nHid",string_agg(m."nIid"::text,',') i
              FROM "RHighlights" h 
        JOIN "RHighlightMapid" m ON h."nHid" = m."nHid"
            where h."nSessionId" = nSessionid and h."nUserid" = nUserid 
        group by "cPageno","cLineno",m."nHid"
            order by m."nHid"
        ) dt order by "cPageno","cLineno","nHid",i
        ) select "nHid","unique_no" as "nGroupid",i as "issueids" from tbl order by "unique_no"
    ) rg on rg."nHid" = rh."nHid"
    left join "RIssueMaster" im on im."nIid" = rh."nLID"
    where rh."nCaseid" = nCaseid and rh."nUserid" = nUserid and rh."nSessionId" = nSessionid
    and jIssues = '[]'::jsonb 
    and case when jPages != '[]'::jsonb then jPages @> to_jsonb(case when coalesce(cTranscript,'N') = 'N' then "cPageno"::int else "cTPageno"::int end) else true end
    ;
    
    RETURN NEXT ref2;
END;
$function$
