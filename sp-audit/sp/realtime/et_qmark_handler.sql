CREATE OR REPLACE FUNCTION realtime.et_qmark_handler(parameter json, ref refcursor)
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
    --jCordinates := parameter ->> 'jCordinates';
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

	
    IF permission = 'I' THEN

        if (nLID is null)then
		    select "nIid" into nLID From "RIssueMaster" where "nCaseid" = nCaseid and "nUserid" is null;
        end if;
        --"jCordinates", 
        INSERT INTO "RHighlights" ("cNote", "nCaseid", "nSessionId", "nUserid", "dCreatedt", "cPageno", "cLineno","cTime","nLID","cTPageno",
                                  "cTLineno","cTTime","oP","oL","identity")
		-- jCordinates,
        VALUES (cNote,  nCaseid, nSessionId, nUserid, now(),
                case when cTranscript ='N' then cPageno else null end,
                case when cTranscript ='N' then cLineno else null end,
                case when cTranscript ='N' then cTime else null end,
                
                nLID,
                      
                case when cTranscript ='Y' then cPageno else null end,
                case when cTranscript ='Y' then cLineno else null end,
                case when cTranscript ='Y' then cTime else null end,
                oP,oL,identity
               )
        RETURNING "nHid" INTO inserted_id;
        
       /* INSERT INTO "RHighlightMapid" ("nHid", "nIid")
        SELECT inserted_id, nLID;*/

        
        
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

/*    if(cTranscript ='N') then 
    
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
*/
        
    OPEN ref FOR
    
        SELECT msg, msg_text AS message, inserted_id AS "nHid",nSessionId,nHid --, coalesce(pageData,'[]'::jsonb) as "pageData"
        
        
        ;
        
        
        
        
        
        
    RETURN ref;
END;
$function$
