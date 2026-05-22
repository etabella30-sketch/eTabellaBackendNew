CREATE OR REPLACE FUNCTION public.et_workspace_fact_list_backup_multiple(parameter jsonb, ref refcursor)
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

BEGIN

    nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
    cFacttype := parameter ->>'cFacttype';
    nCaseid   := NULLIF(parameter ->>'nCaseid','')::uuid;

    IF nCaseid IS NULL THEN
        RAISE EXCEPTION 'nCaseid is required';
    END IF;

sql_query := '

SELECT

    f."nFSid",
    f."nBundledetailid",
    f."dCreateDt",
    f."cFType",

    d."cFact",

    ----------------------------------------------------
    -- CORRECT ISSUE INFO
    ----------------------------------------------------

    issue_info."nIssueid",
    issue_info."cIssuename",
    issue_info."cCategory",

    ----------------------------------------------------

    bd."cFilename",

    um."cFname" || '' '' || COALESCE(um."cLname", '''') AS "cCreateby"

FROM "FactMaster" f

JOIN "FactDetail" d ON d."nFSid" = f."nFSid"

JOIN "UserMaster" um ON um."nUserid" = f."nUserid"

JOIN "bundlesource" bd ON bd."nBundledetailid" = f."nBundledetailid"

------------------------------------------------------------
-- FINAL FIXED ISSUE JOIN
------------------------------------------------------------

LEFT JOIN LATERAL (
   SELECT
      fi."nIssueid",
      im."cIName" as "cIssuename",
      ic."cCategory"
   FROM "FMIssue" fi
   JOIN "RIssueMaster" im ON im."nIid" = fi."nIssueid"
   LEFT JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"
   WHERE fi."nFSid" = f."nFSid"
   LIMIT 1
) issue_info ON true

WHERE
    f."nCaseid" = ''' || nCaseid || '''::uuid

    AND (
        ' || quote_literal(cFacttype) || ' = ''ALL''

        OR (
            ' || quote_literal(cFacttype) || ' = ''F''
            AND f."cFType" IN (''F'',''QF'')
        )

        OR (
            ' || quote_literal(cFacttype) || ' = ''QF''
            AND f."cFType" = ''QF''
        )
    )

ORDER BY f."dCreateDt" DESC
';

OPEN ref FOR EXECUTE sql_query;

RETURN ref;

END;
$function$
