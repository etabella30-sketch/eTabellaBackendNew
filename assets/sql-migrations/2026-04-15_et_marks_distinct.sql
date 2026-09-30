-- 2026-04-15 — fix et_marks JOIN explosion for admin users
--
-- Symptom: when the caller is isAdmin=true (or has a top-level RoleMaster role
-- with nSrno=1, which the SP promotes to admin), et_marks returns duplicate rows
-- for every annotation/highlight/doc-link. Observed on session
-- d5bb2972-e881-45e7-b305-6d28c3ed4f0c user 043c3b64: 120 rows for 6 distinct
-- nHid values. The duplicates flow to the frontend AnnotationLayerComponent,
-- which renders each highlight N times.
--
-- Root cause: `LEFT JOIN "TeamRelation" tr ON tr."nTeamid" = nTeamid` is not
-- bound to the annotation's owning user. For a team of N members, the join
-- produces N rows per annotation. The WHERE clause then filters most of them,
-- but the same nUserid-matching row survives once per team member it shares a
-- team with.
--
-- Fix: add DISTINCT to each of the three refcursor SELECTs that use this join.
-- DISTINCT is the minimum-risk fix — no change to access semantics (the CASE
-- WHEN isAdmin predicates still decide visibility), just removes the row-level
-- duplication caused by the unbound join. All returned columns are scalar
-- projections, so DISTINCT is correct and cheap.
--
-- Verified against the test session: after this change, et_marks returns 6
-- distinct rows (matching RHighlights row count) for the admin user instead
-- of 120.
--
-- Apply: psql -h <host> -U <user> -d <db> -f 2026-04-15_et_marks_distinct.sql

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
                -- DISTINCT: de-dupes rows multiplied by the unbound TeamRelation
                -- left-join (safe because every selected column is scalar).
                select DISTINCT f."nFSid" as "id",f."cFType" as "cType",
                 CASE WHEN COALESCE(bTranscript,false) = false THEN d."jCordinates"  ELSE d."jTCordinates" END AS "jCordinates",
                d."nColorid",i."cColor" as "color"
                from "FactMaster" f
                join "FactDetail" d on d."nFSid" = f."nFSid"
                join "RIssueMaster" i on i."nIid" = d."nColorid"
                left join "TeamRelation" tr ON tr."nTeamid" = nTeamid
                left join "FMShared" s on s."nFSid" = f."nFSid" and s."nUserid" = nUserid
                where f."nSesid" = nSessionid and ((f."nUserid" = nUserid or s."nUserid" = nUserid) or (case when isAdmin = true then  f."nUserid" = tr."nUserid" else false end));

    RETURN NEXT ref1;

    OPEN ref2 FOR

          select DISTINCT h."nHid",
      CASE WHEN COALESCE(bTranscript,false) = false THEN h."cPageno"  ELSE h."cTPageno" END AS "cPageno",
          CASE WHEN COALESCE(bTranscript,false) = false THEN h."cLineno"  ELSE h."cTLineno"  END AS "cLineno",
      CASE WHEN COALESCE(bTranscript,false) = false THEN h."cTime"  ELSE h."cTTime"END AS "cTime",
          CASE WHEN COALESCE(bTranscript,false) = false THEN h."identity" ELSE h."tidentity" END AS "identity"
                  FROM "RHighlights" h
                left join "TeamRelation" tr ON tr."nTeamid" = nTeamid
                WHERE h."nSessionId" = nSessionid AND (h."nUserid"  = nUserid or (case when isAdmin = true then  h."nUserid" = tr."nUserid" else false end));

        RETURN NEXT ref2;

    OPEN ref3 FOR

        select DISTINCT m."nDocid" as "id",'D' as "cType" ,
        CASE WHEN COALESCE(bTranscript,false) = false THEN d."jCordinates"  ELSE d."jTCordinates" END AS "jCordinates"
        from "DocMaster" m
        join "DocDetail" d on d."nDocid" = m."nDocid"
        left join "DMShared" s on s."nDocid" = m."nDocid" and s."nUserid" = nUserid
                left join "TeamRelation" tr ON tr."nTeamid" = nTeamid
        where m."nSesid" = nSessionid and (m."nUserid" = nUserid or s."nUserid" = nUserid or (case when isAdmin = true then  m."nUserid" = tr."nUserid" else false end)) and "jCordinates" is not null;

        RETURN NEXT ref3;

END;
$function$;
