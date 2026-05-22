CREATE OR REPLACE FUNCTION public.et_workspace_fact_list_correct_backup(parameter jsonb, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

DECLARE
    nMasterid uuid;
    cFacttype text;
    nCaseid uuid;
    nContactid uuid;
    nIssueid uuid;
    jFilter jsonb;

    filter_string text;
    sql_query TEXT;

    isAdmin boolean default false;
    nRoleid uuid;
    nTeamid uuid;

BEGIN

    ------------------------------------------------------------
    -- PARAMETERS
    ------------------------------------------------------------

    nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
    cFacttype := parameter ->>'cFacttype';
    nCaseid   := NULLIF(parameter ->>'nCaseid','')::uuid;
    nContactid:= NULLIF(parameter ->>'nContactid','')::uuid;
    nIssueid  := NULLIF(parameter ->>'nIssueid','')::uuid;

    jFilter := coalesce((parameter->>'jFilter')::jsonb,'[]'::jsonb);

    IF nCaseid IS NULL THEN
        RAISE EXCEPTION 'nCaseid is required';
    END IF;

    ------------------------------------------------------------
    -- ADMIN / TEAM
    ------------------------------------------------------------

    IF nMasterid IS NOT NULL THEN

        SELECT "isAdmin"
        INTO isAdmin
        FROM "UserMaster"
        WHERE "nUserid" = nMasterid;

        SELECT "nTeamid","nRoleid"
        INTO nTeamid,nRoleid
        FROM "TeamRelation"
        WHERE "nUserid" = nMasterid
          AND "nCaseid" = nCaseid
        LIMIT 1;

        IF (
            isAdmin = false
            AND (SELECT "nSrno" FROM "RoleMaster" WHERE "nRoleid" = nRoleid) = 1
        ) THEN
            isAdmin := true;
        END IF;

    END IF;

    filter_string := (SELECT filter_whereclause_2(jFilter,'WRK'));

    ------------------------------------------------------------
    -- MAIN QUERY
    ------------------------------------------------------------

sql_query := '

WITH

----------------------------------------------------
-- CONTACT COUNT – PURE FROM FMContact
----------------------------------------------------
contact_ct AS (
   SELECT "nFSid", COUNT(*) AS contacts
   FROM "FMContact"
   GROUP BY "nFSid"
),

----------------------------------------------------
-- TASK COUNT
----------------------------------------------------
task_ct AS (
   SELECT "nFSid", COUNT(*) AS tasks
   FROM "FMTasks"
   GROUP BY "nFSid"
),

----------------------------------------------------
-- LINK COUNT
----------------------------------------------------
link_ct AS (
   SELECT "nFSid", COUNT(*) AS links
   FROM "FMLinks"
   GROUP BY "nFSid"
),

----------------------------------------------------
-- ISSUE COUNT
----------------------------------------------------
issue_ct AS (
   SELECT "nFSid", COUNT(*) AS issues
   FROM "FMIssue"
   GROUP BY "nFSid"
),

----------------------------------------------------
-- SHARED COUNT
----------------------------------------------------
shared_ct AS (
   SELECT "nFSid", COUNT(*) AS shared
   FROM "FMShared"
   GROUP BY "nFSid"
)

SELECT

    ----------------------------------------------------
    -- BASE FACT
    ----------------------------------------------------
    f."nFSid",
    f."nBundledetailid",
    f."dCreateDt",
    f."cFType",

    d."cFact",
    d."nTZid",
    d."jDate",
    d."nFiletype",
    d."nStatus",
    d."cType",
    d."jLinktype",
    d."jTexts",
    d."bIsHighlighted",
    d."jOT",

    ----------------------------------------------------
    -- CODEMASTER LOOKUPS
    ----------------------------------------------------
    (SELECT "cCodename" FROM "Codemaster"
      WHERE "nCodeid" = d."nStatus" LIMIT 1) AS "cStatus",

    (SELECT "cCodename" FROM "Codemaster"
      WHERE "nCodeid" = d."nFiletype" LIMIT 1) AS "cFiletype",

    ----------------------------------------------------
    -- BUNDLE INFO
    ----------------------------------------------------
    bd."cFilename",
    bd."cTab",
    bd."cExhibitno",
    bd."cBundletag",

    ----------------------------------------------------
    -- COUNTERS MATCHING UI
    ----------------------------------------------------
    COALESCE(issue_ct.issues,0)     AS "nIssues",
    COALESCE(contact_ct.contacts,0) AS "nContactcount",
    COALESCE(task_ct.tasks,0)       AS "nTaskcount",
    COALESCE(link_ct.links,0)       AS "nLinkscount",
    COALESCE(shared_ct.shared,0)    AS "nSUsers",

    ----------------------------------------------------
    um."cFname" || '' '' || COALESCE(um."cLname", '''') AS "cCreateby"

FROM "FactMaster" f

JOIN "FactDetail" d
  ON d."nFSid" = f."nFSid"

JOIN "UserMaster" um
  ON um."nUserid" = f."nUserid"

JOIN "bundlesource" bd
  ON bd."nBundledetailid" = f."nBundledetailid"

----------------------------------------------------
-- SAFE COUNTER JOINS (NO MULTIPLICATION)
----------------------------------------------------
LEFT JOIN issue_ct   ON issue_ct."nFSid"   = f."nFSid"
LEFT JOIN contact_ct ON contact_ct."nFSid" = f."nFSid"
LEFT JOIN task_ct    ON task_ct."nFSid"    = f."nFSid"
LEFT JOIN link_ct    ON link_ct."nFSid"    = f."nFSid"
LEFT JOIN shared_ct  ON shared_ct."nFSid"  = f."nFSid"

WHERE
(
    f."nFSid" IS NOT NULL
    AND f."nCaseid" = ''' || nCaseid || '''::uuid

    AND (
        ' || quote_literal(cFacttype) || ' = ''ALL''
        OR f."cFType" = ' || quote_literal(cFacttype) || '
    )

    ----------------------------------------------------
    -- PERMISSION LOGIC
    ----------------------------------------------------
    AND (
        ' || CASE
             WHEN nMasterid IS NULL THEN 'true'
             ELSE '
             (
                f."nUserid" = ''' || nMasterid || '''::uuid

                OR EXISTS (
                    SELECT 1 FROM "FMShared" s
                    WHERE s."nFSid" = f."nFSid"
                      AND s."nUserid" = ''' || nMasterid || '''::uuid
                )

                OR (
                    ' || isAdmin || '::boolean = true
                    AND EXISTS (
                        SELECT 1 FROM "TeamRelation" tr2
                        WHERE tr2."nTeamid" = '''|| nTeamid ||'''
                          AND tr2."nUserid" = f."nUserid"
                    )
                )
             )'
             END || '
    )

    ' || CASE WHEN filter_string IS NOT NULL
              THEN ' AND (' || filter_string || ') '
              ELSE '' END || '
)

ORDER BY
    COALESCE((d."jDate"->>''date1''), f."dCreateDt"::text) DESC
';

OPEN ref FOR EXECUTE sql_query;

RETURN ref;

END;
$function$
