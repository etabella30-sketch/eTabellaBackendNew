CREATE OR REPLACE FUNCTION realtime.et_annotations(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nUserid uuid;nSessionid uuid;nIid uuid;cTranscript text;

BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nSessionid := NULLIF(parameter ->>'nSessionid','')::uuid;
nIid := NULLIF(parameter ->>'nIid','')::uuid;
cTranscript := parameter ->>'cTranscript';

	
/*

select * From RIssuesummary

 select * from et_annotations('{""nCaseid"":22,""nUserid"":2,""nIid"":31,""nSessionid"":58}','r1','r2');FETCH All in ""r1""; 
 FETCH All in ""r2"";

select * From "RHighlights" order by "dCreatedt" desc

 
select * From "RIssueDetail" 
coalesce("cTLineno","cLineno") 

 select * from realtime.et_annotations ('{"nSessionid":"5a3c23ff-198e-4cb9-9286-54e8aacab411","nUserid":"d93f1450-5a89-41c9-9986-68a2533ddad9","nCaseid":"81765ff6-8040-4081-af51-be37c588727d","cTranscript":"N"}','r1','r2');fetch all in "r1";fetch all in "r2";

*/

		
    OPEN ref1 FOR 

SELECT
  "nIDid",
  CASE
    WHEN COALESCE(cTranscript , 'N') = 'N' THEN "cPageno"
    ELSE "cTPageno"
  END AS "pageIndex",
  CASE
    WHEN COALESCE(cTranscript, 'N') = 'N' THEN "jCordinates"
    ELSE "jTCordinates"
  END AS "cordinates",
  "cColor"   AS "color",
  "nICount",
  "bTrf"
FROM realtime."RIssuesummary"
WHERE
  COALESCE("nCaseid", null)   = COALESCE(nCaseid , null)
  AND "nSessionid" = nSessionid
  AND "nUserid"    = nUserid
  and coalesce("isInActivated",false) = false;

	
	/*
select rd."nIDid", rd."cNote",  coalesce(rd."cTPageno",rd."cPageno") as "cPageno",  rd."cONote",rl."cCodename" as "cRelevance",
imp."cCodename" as "cImpact",rm."nRelid",rm."nImpactid",rd."jCordinates"
From "RIssueDetail" rd 
join "RIssueMapid" rm on rm."nIDid" = rd."nIDid"
left join "Codemaster"  rl on rl."nCodeid" = rm."nRelid"
left join "Codemaster"  imp on imp."nCodeid" = rm."nImpactid"
	
where "nCaseid" = nCaseid and "nSessionid" = nSessionid and rd."nUserid" = nUserid
and case when nIid is not null then  "nIid" = nIid else true end;*/
		
    RETURN NEXT ref1;
    
	
	
	
	
    OPEN ref2 FOR 

-- select * From "RHighlights"
-- alter table "RHighlights" add column "identity" character varying(200)

WITH
  dt AS (
    SELECT
      h."nHid",
      h."cPageno"::integer AS "cPageno",
      h."cLineno"::integer AS "cLineno",
      string_agg(m."nIid"::text, ',' ORDER BY m."serialno") AS "issueids"
    FROM "RHighlights" h
    JOIN (
      SELECT "nIid", "nHid", "serialno"
      FROM "RHighlightMapid"
      ORDER BY "serialno"
    ) m
      ON h."nHid" = m."nHid"
    WHERE
      h."nSessionId" = nSessionid
      AND h."nUserid"    = nUserid
    GROUP BY
      h."nHid",
      h."cPageno"::integer,
      h."cLineno"::integer
  ),
  tbl AS (
    SELECT
      dt."nHid",
      dt."issueids",
      dt."cPageno",
      dt."cLineno",
      (
        dt."cLineno"
        - ROW_NUMBER() OVER (
            PARTITION BY dt."cPageno", dt."issueids"
            ORDER BY   dt."cLineno"
          )
      ) AS "grp"
    FROM dt
  ),
  rg AS (
    SELECT
      tbl."nHid",
      DENSE_RANK() OVER (
        ORDER BY tbl."issueids", tbl."cPageno", tbl."grp"
      ) AS "nGroupid",
      tbl."issueids"
    FROM tbl
  )
SELECT
  rh."nHid",
  CASE
    WHEN COALESCE(cTranscript,'N') = 'N' THEN rh."cPageno"
    ELSE rh."cTPageno"
  END AS "cPageno",
  CASE
    WHEN COALESCE(cTranscript,'N') = 'N' THEN rh."cLineno"
    ELSE rh."cTLineno"
  END AS "cLineno",
    CASE
    WHEN COALESCE(cTranscript,'N') = 'N' THEN rh."cTime"
    ELSE rh."cTTime"
  END AS "cTime",
  --rh."cTime",
  im."cColor",
  --rh."identity" as "identity",
    CASE
    WHEN COALESCE(cTranscript,'N') = 'N' THEN rh."identity"
    ELSE rh."tidentity"
  END AS "identity",
  rh."oL",
  rg."nGroupid",
  rg."issueids"
FROM "RHighlights" rh
LEFT JOIN rg
  ON rg."nHid" = rh."nHid"
LEFT JOIN "RIssueMaster" im
  ON im."nIid" = rh."nLID"
WHERE
  rh."nUserid"    = nUserid
  AND rh."nSessionId" = nSessionid
ORDER BY
  rg."nGroupid";

-- select * From "RHighlights"

		/*with tbl as (
		select *, grp, DENSE_RANK() OVER (ORDER BY i,(coalesce("cTPageno","cPageno")),grp) AS unique_no From (
		SELECT (coalesce("cTLineno","cLineno") )::bigint - ROW_NUMBER() OVER (PARTITION BY (coalesce("cTPageno","cPageno"))::int ORDER BY (coalesce("cTLineno","cLineno") )::int) AS grp,  coalesce("cTPageno","cPageno") as "cPageno",
		"cTPageno",coalesce("cTLineno","cLineno")  "cLineno","cTLineno",m."nHid",h."identity",h."oL",string_agg(m."nIid"::text,',') i
		      FROM "RHighlights" h 
		JOIN "RHighlightMapid" m ON h."nHid" = m."nHid"
			where  h."nSessionId" = nSessionid and h."nUserid" = nUserid and case when nIid is not null then  m."nIid" = nIid else true end --m."nIid" = nIid
			
		group by "cTPageno","cPageno","cTLineno","cLineno",m."nHid",h."identity",h."oL"
			order by m."nHid"
		) dt order by coalesce("cTPageno","cPageno") ,"cLineno","nHid",i
		)
		select t."unique_no" as "nGroupid",t.i as "issueids" ,jsonb_agg(rh) as "highlights"
		from tbl t
		join(
		select "nHid","cNote",coalesce("cTPageno","cPageno") as "cPageno",coalesce("cTLineno","cLineno") "cLineno","identity","oL" From "RHighlights"
		) rh on rh."nHid" = t."nHid"
		group by t."unique_no",t.i 
		
		order by "unique_no";*/

	
 	RETURN NEXT ref2;
	
	
	
	 
END;
$function$
