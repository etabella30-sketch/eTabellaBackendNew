CREATE OR REPLACE FUNCTION realtime.et_navigate_quick_mark(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nSesid uuid;
bIsTranscipt boolean default false;
cSortby text;
historyEnabled boolean;
sql_query text;
  jFilter jsonb; 

begin
-- select et_navigate_fact_companies('{ ""nBundledetailid"": 530060, ""cType"": ""N"", ""jFilter"": ""[]"", ""sortby"": {}, ""nMasterid"": 59 }','r');fetch all in ""r""

nSesid := NULLIF(parameter ->>'nSesid','')::uuid;
nMasterid := NULLIF(parameter ->>'nUserid','')::uuid;
bIsTranscipt := COALESCE(parameter ->> 'bIsTranscipt','false')::boolean;
cSortby := parameter->>'cSortby';
historyEnabled := COALESCE(parameter ->> 'historyEnabled','false')::boolean;
 jFilter := parameter->>'jFilter';

-- select rh."nHid", um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
-- 	rh."dCreatedt" "dCreateDt",
-- 	CASE WHEN bIsTranscipt THEN rh."tidentity" ELSE rh."identity" END AS "identity",
-- 	(CASE WHEN bIsTranscipt THEN rh."cTPageno" ELSE rh."cPageno" END)::INT AS "nPage",
-- 	(CASE WHEN bIsTranscipt THEN rh."cTLineno" ELSE rh."cLineno" END)::INT AS "nLine"
-- 	from "RHighlights" rh 
-- 	join "UserMaster" um on um."nUserid" = rh."nUserid"
-- 	where rh."nUserid" = nMasterid
-- 	and "nSessionId" = nSesid
-- 	 ORDER BY 
-- 		 	CASE WHEN cSortby = 'asc' THEN rh."dCreatedt" END ASC,
-- 			CASE WHEN cSortby = 'desc' THEN rh."dCreatedt" END DESC,
-- 			rh."dCreatedt" desc;

sql_query :=
			'SELECT rh."nHid",
			um."cFname" || '' '' || COALESCE(um."cLname", '''') AS "cCreateby",
			rh."dCreatedt" AS "dCreateDt",
			CASE WHEN ' || bIsTranscipt || ' THEN rh."tidentity" ELSE rh."identity" END AS "identity",
			(CASE WHEN ' || bIsTranscipt || ' THEN rh."cTPageno" ELSE rh."cPageno" END)::INT AS "nPage",
			(CASE WHEN ' || bIsTranscipt || ' THEN rh."cTLineno" ELSE rh."cLineno" END)::INT AS "nLine",
			(CASE WHEN ' || bIsTranscipt || ' THEN rh."cTTime" ELSE rh."cTime" END) AS "cTime"
			FROM "RHighlights" rh
			JOIN "UserMaster" um ON um."nUserid" = rh."nUserid"
			'||(
                CASE WHEN historyEnabled = true 
                     THEN 'JOIN realtime.history_marknav('|| quote_nullable(nSesid) ||',null,'|| quote_nullable(nMasterid) ||',''QM'','|| 1 || ') his ON his."id" = rh."nHid"'
                     ELSE '' END
              ) ||'
			WHERE rh."nUserid" = ' || quote_nullable(nMasterid) || '
			AND rh."nSessionId" = ' || quote_nullable(nSesid);
			
			IF jFilter IS NOT NULL AND jFilter <> '{}'::jsonb THEN
				sql_query := sql_query || '
					AND EXISTS (
						SELECT *
						FROM realtime.filter_marknav(''' || jFilter::text || '''::jsonb,
													' || quote_nullable(nSesid) || ',
													' || quote_nullable(nMasterid) || ',
													''QM'') t
						WHERE t."id" = rh."nHid"
					)';
			END IF;
			
		sql_query := sql_query	 || '
				ORDER BY  "nPage", "nLine", ' ||
				CASE 
					WHEN cSortby = 'asc'  THEN 'rh."dCreatedt" ASC'
					WHEN cSortby = 'desc' THEN 'rh."dCreatedt" DESC'
					ELSE 'rh."dCreatedt" DESC'
				END;

raise notice 'sql_query %', sql_query;
    OPEN ref FOR EXECUTE sql_query;

	

	 return ref;
    END;
$function$
