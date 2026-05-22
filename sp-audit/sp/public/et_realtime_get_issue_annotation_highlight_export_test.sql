CREATE OR REPLACE FUNCTION public.et_realtime_get_issue_annotation_highlight_export_test(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nSessionid UUID;
    nCaseid UUID;
    nUserid UUID;
    cTranscript text;
    jIssues jsonb;
    jHIssues jsonb;
    jPages jsonb;
    bQfact boolean;
    bQmark boolean;
  begin

    nSessionid := NULLIF(parameter ->> 'nSessionid','')::UUID;
    nCaseid := NULLIF(parameter ->> 'nCaseid','')::UUID;
    nUserid := NULLIF(parameter ->> 'nUserid','')::UUID;
    cTranscript := (parameter ->>'cTranscript')::text;
    jIssues := coalesce((parameter ->>'jIssues')::jsonb,'[]'::jsonb);
    jHIssues := coalesce((parameter ->>'jHIssues')::jsonb,'[]'::jsonb);
    jPages := coalesce((parameter ->>'jPages')::jsonb,'[]'::jsonb);

    bQfact := nullif((parameter ->> 'bQfact'),'');
    bQmark := nullif((parameter ->> 'bQmark'),'');
/*
 select * from public.et_realtime_get_issue_annotation_highlight_export_test ('{"nUserid":"b144d9ce-7c7e-402e-94f9-a637d78a7318","nCaseid":"085da82d-1cc8-440a-a918-d0b37d54db1e","cPath":"","nSessionid":"78aafeab-f404-4d2a-b08d-6239bacb24fb","bQfact":true,"bQmark":true,"jHIssues":"[]","jIssues":"[]","cTranscript":"N"}','r1','r2');fetch all in "r1";fetch all in "r2";

*/

 
    OPEN ref1 FOR

  with tbl as (
        select id."nIDid",case when coalesce(cTranscript,'N') = 'N' then id."cPageno" else id."cTPageno" end  "pageIndex",
        case when coalesce(cTranscript,'N') = 'N' then id."jCordinates" else id."jTCordinates" end cordinates,
        id."cColor" color,id."nICount" ,id."cONote"
        From "RIssuesummary" id
        Where id."nCaseid" = nCaseid and id."nSessionid" = nSessionid and id."nUserid" = nUserid and bQfact = true 
		
  )select t.* 
        From tbl t
        left join "RIssueMapid" rs on rs."nIDid" = t."nIDid"
        where 
	   t."nIDid" = '7f741387-556c-40f2-b124-98bb2cf78700' and
		case when jsonb_array_length(jIssues)>0 then jIssues @> to_jsonb(rs."nIid") else true end
        and case when jsonb_array_length(jPages)>0 then jPages @> to_jsonb(t."pageIndex"::int) else true end
        group by t."nIDid",t."pageIndex",t."cordinates",
        t."color",t."nICount" ,t."cONote" 
        ;
        
    RETURN NEXT ref1;

	
    OPEN ref2 FOR 

	with tbl as (
		select h."nHid",h."nLID",t."t" as "cTime",t."text" as "cNote",t."otext" as "cFNote",t."identity",t."refreshCount",h."nLID"::text as "issueids",
	
		CASE WHEN COALESCE(cTranscript,'N') = 'N' THEN  h."cPageno" ELSE  h."cTPageno" END as "cPageno",
		CASE WHEN COALESCE(cTranscript,'N') = 'N' THEN  h."cLineno" ELSE  h."cTLineno" END as "cLineno"
		 
		
		From "RHighlights" h ,
		jsonb_to_recordset(CASE WHEN COALESCE(cTranscript,'N') = 'N' THEN  h."jCordinates" ELSE  h."jTCordinates" END) as t("t" text,"text" text,"otext" text,"identity" text,"refreshCount" int,"isMain" boolean)
		where h."nUserid"  = nUserid AND h."nSessionId" = nSessionid
		and  
		(
			(	
			
				t."isMain" = true
				--t."t" =  (CASE WHEN COALESCE(cTranscript,'N') = 'N' THEN  h."cTime" ELSE  h."cTTime" END) 
			)
			or 
			(
				
				coalesce(t."isMain",false) = false
				--t."t" !=  (CASE WHEN COALESCE(cTranscript,'N') = 'N' THEN  h."cTime" ELSE  h."cTTime" END)
				and 
				(t."text" = t."otext" or  array_length(regexp_split_to_array(trim(t."text"), '\s+'), 1) > 2 ) 
			)
		)
	) select t.*,m."cColor" from tbl t
	join "RIssueMaster" m on m."nIid" = t."nLID" limit 0
	;

	
  /*      with tbl as (
    select rh."nHid",
    case when coalesce(cTranscript,'N') = 'N' then "cPageno" else coalesce("cTPageno","cPageno") end 
    as "cPageno",
    case when coalesce(cTranscript,'N') = 'N' then "cLineno" else coalesce("cTLineno","cLineno") end 
    "cLineno",
	case when coalesce(cTranscript,'N') = 'N' then "cTime" else coalesce("cTTime","cTime") end  "cTime",
	"cColor" ,rg."nGroupid",rg."issueids",case when coalesce(cTranscript,'N') = 'N' then rh."identity" else rh."tidentity" end  "identity"
    From "RHighlights" rh 
    left join (
        with tbl as (
        select *, grp, DENSE_RANK() OVER (ORDER BY i,"cPageno",grp) AS unique_no From (
        SELECT  "cLineno"::bigint - ROW_NUMBER() OVER (PARTITION BY "cPageno"::int,jsonb_agg(m."nIid"  order by m."nIid") ORDER BY "cLineno"::int) AS grp,  "cPageno", "cLineno",m."nHid",string_agg(m."nIid"::text,',') i
              FROM "RHighlights" h 
        JOIN "RHighlightMapid" m ON h."nHid" = m."nHid"
            where h."nSessionId" = nSessionid and h."nUserid" = nUserid 
        group by "cPageno","cLineno",m."nHid"
            order by m."nHid"
        ) dt order by "cPageno","cLineno","nHid",i
        ) select "nHid","unique_no" as "nGroupid",i as "issueids" from tbl order by "unique_no"
    ) rg on rg."nHid" = rh."nHid"
    left join "RIssueMaster" im on im."nIid" = rh."nLID"
    where rh."nCaseid" = nCaseid and rh."nUserid" = nUserid and rh."nSessionId" = nSessionid and bQmark = true
    ) select t.* 
        from tbl t
        left join "RHighlightMapid" rm on rm."nHid" = t."nHid"
        where case when jsonb_array_length(jHIssues)>0 then jHIssues @> to_jsonb(rm."nIid") else true end
        and case when jsonb_array_length(jPages)>0 then jPages @> to_jsonb(t."cPageno"::int) else true end
        group by t."nHid",t."cPageno",t."cLineno",t."cTime",t."cColor",t."nGroupid",t."issueids",t."identity" ;*/

    
    RETURN NEXT ref2;
    
END;
$function$
