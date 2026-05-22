CREATE OR REPLACE FUNCTION public.et_realtime_export_annotations_summary_test(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nSesid uuid;nUserid uuid;nCaseid uuid;isAnnotations boolean;isHighlight boolean;cTranscript text;
jHIssues jsonb;jIssues jsonb;
BEGIN
nSesid := NULLIF(parameter ->>'nSesid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
isAnnotations := nullif((parameter ->>'isAnnotations')::text,'');
isHighlight := nullif((parameter ->>'isHighlight')::text,'');
cTranscript := parameter ->>'cTranscript';
jHIssues := parameter ->>'jHIssues';
jIssues := parameter ->>'jIssues';

-- For UUID, we need to handle the default value differently
nSesid := COALESCE(nSesid, '00000000-0000-0000-0000-000000000001'::uuid);
raise notice 'nSesid - %, nCaseid - %,nUserid - %,isAnnotations - %,isHighlight - %,cTranscript - %',nSesid,nCaseid,nUserid,isAnnotations,isHighlight,cTranscript;
/*

select * from et_realtime_export_annotations_summary ('{""nCaseid"":1043,""nUserid"":366,""nSesid"":87,""cTranscript"":""N"",""isAnnotations"":true,""isHighlight"":""""}','r1','r2');fetch all in ""r1"";fetch all in ""r2"";

*/
-- select * from "RIssuesummary" limit 10
	
    OPEN ref1 FOR 

 with tbl as (
		select id."nIDid",case when coalesce(cTranscript,'N') = 'N' then id."cPageno" else id."cTPageno" end  "pageIndex",
		id."cColor",id."nICount" ,id."cONote",id."cNote",CASE 
  WHEN COALESCE(cTranscript, 'N') = 'N' 
    THEN COALESCE(id."jCordinates"->0->'l', '0') 
  ELSE 
    COALESCE(id."jTCordinates"->0->'l', '0') 
END  "cLineno"
		From "RIssuesummary" id
		Where id."nCaseid" = nCaseid and id."nSessionid" = nSesid and id."nUserid" = nUserid and isAnnotations = true
  ),dtl as (
		select r."nIDid",isu."cIName",isu."cColor",rel."cCodename" as "cRel",imp."cCodename" as "cImp" ,ri."nRelid",ri."nImpactid"
			from tbl r 
			join "RIssueMapid" ri on ri."nIDid" = r."nIDid"
			join "RIssueMaster" isu on isu."nIid" = ri."nIid"
			left join "Codemaster" rel on rel."nCodeid" = ri."nRelid"
			left join "Codemaster" imp on imp."nCodeid" = ri."nImpactid"
			where case when jsonb_array_length(jIssues) > 0 then jIssues @> to_jsonb(isu."nIid") else true end
  )select r."nIDid" ,r."pageIndex",r."cColor",r."cONote",r."cNote", r."cLineno",jsonb_agg(distinct t) as "issues"
			from tbl r
			join dtl t on t."nIDid" = r."nIDid"
			group by r."nIDid" ,r."pageIndex",r."cColor",r."cONote",r."cNote", r."cLineno"
	;

		
    RETURN NEXT ref1;

    OPEN ref2 FOR 
		with tbl as (
	select rh."nHid",
	case when coalesce(cTranscript,'N') = 'N' then "cPageno" else "cTPageno" end 
	as "cPageno",
	case when coalesce(cTranscript,'N') = 'N' then "cLineno" else "cTLineno" end 
	"cLineno","cTime","cColor" ,rg."nGroupid",rg."issueids",rh."cNote"
	From "RHighlights" rh 
	left join (
		with tbl as (
			select *, grp, DENSE_RANK() OVER (ORDER BY i,"cPageno",grp) AS unique_no From (
				SELECT  "cLineno"::bigint - ROW_NUMBER() OVER (PARTITION BY "cPageno"::int,jsonb_agg(m."nIid"  order by m."nIid") ORDER BY "cLineno"::int) AS grp,  "cPageno", "cLineno",m."nHid",string_agg(m."nIid"::text,',') i
				      FROM "RHighlights" h 
				JOIN "RHighlightMapid" m ON h."nHid" = m."nHid"
					where  h."nSessionId" = nSesid and h."nUserid" = nUserid 
				group by "cPageno","cLineno",m."nHid"
					order by m."nHid"
			) dt order by "cPageno","cLineno","nHid",i
		) select "nHid","unique_no" as "nGroupid",i as "issueids" from tbl order by "unique_no"
	) rg on rg."nHid" = rh."nHid"
	left join 	"RIssueMaster" im on im."nIid" = rh."nLID"
	where rh."nUserid" = nUserid and rh."nSessionId" = nSesid and isHighlight = true
		and case when jsonb_array_length(jHIssues) > 0 then jHIssues @> to_jsonb(im."nIid") else true end
	),dtl as (
	select t."nHid",r."cIName",r."cColor"
		from tbl t 
		join "RHighlightMapid" rm on rm."nHid" = t."nHid"
		join "RIssueMaster" r on r."nIid" = rm."nIid"
	)select t.* ,jsonb_agg(distinct d) as "issues"
		from tbl t
		left join dtl d on d."nHid" = t."nHid" 
		group by  t."nHid",t."cPageno",t."cLineno",t."cTime",t."cColor",t."nGroupid",t."issueids",t."cNote"
		
		
	;
	
 	RETURN NEXT ref2;
	
	
	
	
	
END;
$function$
