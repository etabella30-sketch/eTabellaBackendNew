-- 2026-04-15 — et_marks: hide ALL rows without valid transferred coords on published view
--
-- Supersedes 2026-04-15_et_marks_hide_orphans.sql. The previous migration only
-- filtered out explicit orphans (cTransferStatus='O'), but the admin-user
-- response still contained rows where the transfer never ran at all
-- (cTransferStatus IS NULL AND cTPageno IS NULL). The frontend AnnotationLayer
-- treats NULL coords as (0,0) and renders them at the top of published page 1 —
-- producing visible "stuck to page 1" highlights on the published view even for
-- sessions where the transfer hasn't executed yet.
--
-- Tighter filter: on published view, drop any row whose transferred-coord column
-- is NULL. This covers:
--   - explicit orphans (cTransferStatus='O') — transferred columns never populated
--   - legacy/untransferred rows — cTransferStatus IS NULL, cTPageno IS NULL
--   - partial rows where only some transferred fields populated
-- All three collapse to the same UX rule: "no transferred coord = not renderable
-- on published view, regardless of why". Draft view stays unchanged.
--
-- For RHighlights (ref2): check cTPageno (all 4 transferred fields are populated
-- together by highlighttransfer.py, so cTPageno is a reliable sentinel).
-- For FactDetail / DocDetail (ref1 / ref3): check jTCordinates IS NOT NULL.

CREATE OR REPLACE FUNCTION realtime.et_marks(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nUserid uuid;nSessionid uuid;nIid uuid;jFactids jsonb;

        isAdmin boolean default false;
        nRoleid uuid;nTeamid uuid;bTranscript boolean;

BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nSessionid := NULLIF(parameter ->>'nSessionid','')::uuid;
jFactids := parameter ->>'jFactids';
bTranscript := parameter ->>'bTranscript';

isAdmin := case when exists (select * from "UserMaster" where "nUserid" = nUserid and "isAdmin" = true )  then true  else false  end;

 if(nCaseid is null) then
        select "nCaseid" into nCaseid from "RSessionMaster" where "nSesid" = nSessionid;
 end if;


select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nUserid and "nCaseid" = nCaseid limit 1;

if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then
        isAdmin := true;
end if;


    OPEN ref1 FOR
                -- Facts: on published view, only return rows with transferred coords.
                -- DISTINCT handles the TeamRelation left-join row multiplication for
                -- admin users.
                select DISTINCT f."nFSid" as "id",f."cFType" as "cType",
                 CASE WHEN COALESCE(bTranscript,false) = false THEN d."jCordinates"  ELSE d."jTCordinates" END AS "jCordinates",
                d."nColorid",i."cColor" as "color"
                from "FactMaster" f
                join "FactDetail" d on d."nFSid" = f."nFSid"
                join "RIssueMaster" i on i."nIid" = d."nColorid"
                left join "TeamRelation" tr ON tr."nTeamid" = nTeamid
                left join "FMShared" s on s."nFSid" = f."nFSid" and s."nUserid" = nUserid
                where f."nSesid" = nSessionid
                  and ((f."nUserid" = nUserid or s."nUserid" = nUserid) or (case when isAdmin = true then  f."nUserid" = tr."nUserid" else false end))
                  and (
                    -- Draft view: show everything. Published view: only rows with
                    -- valid transferred coords (excludes orphans AND untransferred).
                    COALESCE(bTranscript, false) = false
                    OR (d."cTransferStatus" IS DISTINCT FROM 'O' AND d."jTCordinates" IS NOT NULL)
                  );

    RETURN NEXT ref1;

    OPEN ref2 FOR

          select DISTINCT h."nHid",
      CASE WHEN COALESCE(bTranscript,false) = false THEN h."cPageno"  ELSE h."cTPageno" END AS "cPageno",
          CASE WHEN COALESCE(bTranscript,false) = false THEN h."cLineno"  ELSE h."cTLineno"  END AS "cLineno",
      CASE WHEN COALESCE(bTranscript,false) = false THEN h."cTime"  ELSE h."cTTime"END AS "cTime",
          CASE WHEN COALESCE(bTranscript,false) = false THEN h."identity" ELSE h."tidentity" END AS "identity"
                  FROM "RHighlights" h
                left join "TeamRelation" tr ON tr."nTeamid" = nTeamid
                WHERE h."nSessionId" = nSessionid
                  AND (h."nUserid"  = nUserid or (case when isAdmin = true then  h."nUserid" = tr."nUserid" else false end))
                  AND (
                    COALESCE(bTranscript, false) = false
                    OR (h."cTransferStatus" IS DISTINCT FROM 'O' AND h."cTPageno" IS NOT NULL)
                  );

        RETURN NEXT ref2;

    OPEN ref3 FOR

        select DISTINCT m."nDocid" as "id",'D' as "cType" ,
        CASE WHEN COALESCE(bTranscript,false) = false THEN d."jCordinates"  ELSE d."jTCordinates" END AS "jCordinates"
        from "DocMaster" m
        join "DocDetail" d on d."nDocid" = m."nDocid"
        left join "DMShared" s on s."nDocid" = m."nDocid" and s."nUserid" = nUserid
                left join "TeamRelation" tr ON tr."nTeamid" = nTeamid
        where m."nSesid" = nSessionid
          and (m."nUserid" = nUserid or s."nUserid" = nUserid or (case when isAdmin = true then  m."nUserid" = tr."nUserid" else false end))
          and (
            COALESCE(bTranscript, false) = false
            OR (d."cTransferStatus" IS DISTINCT FROM 'O' AND d."jTCordinates" IS NOT NULL)
          )
          and (
            COALESCE(bTranscript, false) = true
            OR d."jCordinates" IS NOT NULL
          );

        RETURN NEXT ref3;

END;
$function$;
