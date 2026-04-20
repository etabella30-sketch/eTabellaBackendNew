-- 2026-04-17 — REVERT of 2026-04-17_et_marks_fallback_draft_coords.sql
--
-- Why the revert
-- --------------
-- The earlier 2026-04-17 migration added a `COALESCE(<transferred>, <draft>)`
-- fallback on et_marks so untransferred / transfer-failed annotations would
-- still render on the published view — using their original draft coordinates.
-- The goal was to bring back "page 1 annotations that disappear after publish".
--
-- In practice this reintroduced the exact bug the 2026-04-15 orphan work was
-- written to fix: draft annotations that anchored to content which was
-- edited out during publish (typical page-1 mic-check / preamble edits) had
-- their draft coords (page=1, line=1..3) dumped straight back onto the
-- published feed, where page=1 line=1..3 now hold unrelated text
-- ("(9.00 am)", "Introductions and procedural discussion",
-- "PRESIDENT: Good morning ..."). The highlight appears, but on the wrong
-- content — a worse UX than a missing highlight.
--
-- Why a simple COALESCE can't fix it
-- ----------------------------------
-- The active transfer script (assets/pythons/annot-transfer/run3.py) only
-- writes to the transferred columns on successful fuzzy match; it does NOT
-- set cTransferStatus. So at the SP level every "un-transferred" row looks
-- identical regardless of cause:
--
--    cTransferStatus | jTCordinates | meaning
--    ----------------|--------------|--------------------------------------
--    NULL            | <filled>     | transferred OK (run3.py success path)
--    NULL            | NULL         | could be EITHER an orphan (content
--                    |              | removed during publish) OR a legit
--                    |              | annotation the script just failed on.
--                    |              | We can't tell the two apart.
--
-- With no signal to distinguish them, a COALESCE(jTCordinates, jCordinates)
-- fallback treats orphans and legitimate-but-failed identically and both
-- render at draft coordinates. That's the "(9.00 am)" bug.
--
-- Correct fix (follow-up, not this migration)
-- -------------------------------------------
-- The transfer script must populate cTransferStatus on every row so the SP
-- can tell the two cases apart. Options:
--
--   (a) Un-comment the newer transfer paths in start_bytranscript.py —
--       issuetransfer.py / highlighttransfer.py already write 'T' on success
--       and 'O' on fuzzy-ratio-below-threshold. These would replace (or
--       augment) the run3.main() pipeline.
--
--   (b) Update run3.py to write 'T' on success and 'O' (or a new 'F' for
--       "failed, keep draft coords") on each failure path, so we can
--       COALESCE only for 'F' while still hiding 'O'.
--
-- Until one of those lands, the strict filter is the lesser-of-two-evils:
-- a missing annotation is easier to notice and investigate than a
-- highlight that silently points at unrelated text.
--
-- Restore: this migration re-installs the et_marks definition from
-- 2026-04-15_et_marks_hide_untransferred.sql verbatim.

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
