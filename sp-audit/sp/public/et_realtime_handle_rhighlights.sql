CREATE OR REPLACE FUNCTION public.et_realtime_handle_rhighlights(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nHid UUID;
    nCaseid UUID;
    cNote TEXT;
    jCordinates JSONB;
    nSessionId UUID;
    nUserid UUID;
    dCreatedt TIMESTAMP;
    cPageno VARCHAR(10);
    cLineno VARCHAR(5);
    permission CHAR(1);
    inserted_id UUID;
    msg_text TEXT;
    msg SMALLINT;
    cTime text;
    cIidStr jsonb;
    nLID uuid;
    pageData jsonb;
    cTranscript char(1);
    oP int;
    oL int;
	identity text;
BEGIN
    nHid := NULLIF(parameter ->> 'nHid','')::UUID;
    nCaseid := NULLIF(parameter ->> 'nCaseid','')::UUID;
    cNote := parameter ->> 'cNote';
    nSessionId := NULLIF(parameter ->> 'nSessionid','')::UUID;
    nUserid := NULLIF(parameter ->> 'nUserid','')::UUID;
    dCreatedt := (parameter ->> 'dCreatedt')::TIMESTAMP;
    cPageno := parameter ->> 'cPageno';
    cLineno := parameter ->> 'cLineno';
    permission := (parameter ->> 'permission')::CHAR(1);
    cTime := parameter ->>'cTime';
    msg := 1;
    nLID := NULLIF(parameter ->> 'nLID','')::UUID;
    cIidStr := (parameter ->> 'cIidStr')::jsonb;
    cTranscript := (parameter ->> 'cTranscript')::CHAR(1);
    oP := nullif((parameter ->> 'oP'),'');
    oL := nullif((parameter ->> 'oL'),'');
	identity := parameter ->>'identity';
	-- select * From "RHighlights"

 -- select * from public.et_realtime_handle_rhighlights ('{"nCaseid":"2de50566-859e-4d12-b1f4-8cebbf1e58a3","nSessionid":"060ff340-bff8-4a20-8b1f-eac86994f5be","nUserid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5","cIidStr":[{"nIid":"1fa9cad3-5d4d-4deb-8fbd-852205312862"}],"cNote":"(The hearing adjourned until 9.30 am on the following day)","nLID":"1fa9cad3-5d4d-4deb-8fbd-852205312862","jCordinates":"[{\"x\":40,\"y\":1026.5897216796875,\"width\":875.9896240234375,\"height\":23.993057250976562}]","cPageno":"20","cLineno":"18","cTime":"14:35:14:18","cTranscript":"N","oP":19,"oL":10,"identity":"603973172365200","permission":"I"}','r1');fetch all in "r1";

 
    IF permission = 'I' THEN

        if (nLID is null)then
		    select "nIid" into nLID From "RIssueMaster" where "nCaseid" = nCaseid and "nUserid" is null;
        end if;
        --"jCordinates", 
		jCordinates := jsonb_agg(jsonb_build_object('t',cTime,'text',cNote,'otext',cNote,'identity',identity,'refreshCount',0,'isMain',true));
        INSERT INTO "RHighlights" ("cNote", "nCaseid", "nSessionId", "nUserid", "dCreatedt", "cPageno", "cLineno","cTime","nLID","cTPageno",
                                  "cTLineno","cTTime","oP","oL","identity","jCordinates")
		-- jCordinates,
        VALUES (cNote,  nCaseid, nSessionId, nUserid, now(),
                case when cTranscript ='N' then cPageno else null end,
                case when cTranscript ='N' then cLineno else null end,
                case when cTranscript ='N' then cTime else null end,
                
                nLID,
                      
                case when cTranscript ='Y' then cPageno else null end,
                case when cTranscript ='Y' then cLineno else null end,
                case when cTranscript ='Y' then cTime else null end,
                oP,oL,identity,jCordinates
               )
        RETURNING "nHid" INTO inserted_id;
        
        INSERT INTO "RHighlightMapid" ("nHid", "nIid")
        SELECT inserted_id, nLID;
       /* WITH cte AS (
        SELECT 
            NULLIF(jsonb_array_elements(cIidStr)->>'nIid','')::UUID AS nIid
        )
        INSERT INTO "RHighlightMapid" ("nHid", "nIid")
        SELECT inserted_id, nIid
        FROM cte;*/
        
        
        msg_text := 'Inserted';
        nHid := inserted_id;
    ELSIF permission = 'D' THEN
        
        select "nSessionId",case when cTranscript ='N' then "cPageno" else "cTPageno" end, "nUserid" 
        into nSessionId,cPageno,nUserid           
        from "RHighlights" where "nHid" = nHid;
        
        DELETE FROM "RHighlights" WHERE "nHid" = nHid;
        
        msg_text := 'Deleted';
    ELSE
        msg := -1;
        msg_text := 'Invalid operation type';
    END IF;

    if(cTranscript ='N') then 
    
    select jsonb_agg(t) into pageData from (
        select dt."nHid",dt."unique_no" as "nGroupid",dt."cLineno",dt.i as "issueids" from (
        select *, grp, DENSE_RANK() OVER (ORDER BY i,"cPageno",grp) AS unique_no From (
        SELECT "cLineno"::bigint - ROW_NUMBER() OVER (PARTITION BY "cPageno"::int,jsonb_agg(m."nIid" order by m."serialno",m."nIid") ORDER BY "cLineno"::int) AS grp, "cPageno", "cLineno",m."nHid",string_agg(m."nIid"::text,',') i
              FROM "RHighlights" h 
        JOIN "RHighlightMapid" m ON h."nHid" = m."nHid"
            where h."nSessionId" = nSessionId and h."nUserid" = nUserid and h."cPageno" = cPageno
        group by "cPageno","cLineno",m."nHid"
            order by m."nHid"
        ) dt order by "cPageno","cLineno","nHid",i
        ) dt order by "unique_no")t;
    else 
    
    
    select jsonb_agg(t) into pageData from (
        select dt."nHid",dt."unique_no" as "nGroupid",dt."cTLineno",dt.i as "issueids" from (
        select *, grp, DENSE_RANK() OVER (ORDER BY i,"cTPageno",grp) AS unique_no From (
        SELECT "cTLineno"::bigint - ROW_NUMBER() OVER (PARTITION BY "cTPageno"::int,jsonb_agg(m."nIid" order by m."serialno",m."nIid") ORDER BY "cTLineno"::int) AS grp, "cTPageno", "cTLineno",m."nHid",string_agg(m."nIid"::text,',') i
              FROM "RHighlights" h 
        JOIN "RHighlightMapid" m ON h."nHid" = m."nHid"
            where h."nSessionId" = nSessionId and h."nUserid" = nUserid and h."cTPageno" = cPageno
        group by "cTPageno","cTLineno",m."nHid"
            order by m."nHid"
        ) dt order by "cTPageno","cTLineno","nHid",i
        ) dt order by "unique_no")t;

    end if; 

        
    OPEN ref FOR
    
        SELECT msg, msg_text AS message, inserted_id AS "nHid",nSessionId,nHid, coalesce(pageData,'[]'::jsonb) as "pageData"
        
        
        ;
        
        
        
        
        
        
    RETURN ref;
END;
$function$
