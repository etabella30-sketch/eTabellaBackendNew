CREATE OR REPLACE FUNCTION realtime.et_navigate_factlist(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

DECLARE
    nMasterid uuid;
    nSesid uuid;
    nBundledetailid uuid;
    cSortby text;
    cSorttype text;
    pageNumber int;
    offsetCount int;
    perPage int := 10;
    factids jsonb;
    sql_query TEXT;

    jFilter jsonb;
    cFType text;
    nID uuid;
    historyEnabled boolean;

    isAdmin boolean default false;
    nRoleid uuid;
    nTeamid uuid;
    nCaseid uuid;
    bIsTranscipt boolean default false;

BEGIN
    --------------------------------------------------
    -- PARAMETERS
    --------------------------------------------------
    nSesid := NULLIF(parameter->>'nSesid','')::uuid;
    nMasterid := NULLIF(parameter->>'nUserid','')::uuid;

    cSorttype := parameter->>'cSorttype';
    cSortby := parameter->>'cSortby';

    pageNumber := COALESCE((parameter->>'nPageNumber')::int, 1);
    jFilter := parameter->>'jFilter';

    offsetCount := (pageNumber - 1) * perPage;

    cFType := NULLIF(parameter->>'cFType','');
    nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;

    historyEnabled := COALESCE(parameter->>'historyEnabled','false')::boolean;
    bIsTranscipt := COALESCE(parameter->>'bIsTranscipt','false')::boolean;

    nID := (CASE WHEN nSesid IS NULL THEN nBundledetailid ELSE nSesid END);

    --------------------------------------------------
    -- ADMIN / TEAM LOGIC
    --------------------------------------------------

    isAdmin :=
        CASE WHEN EXISTS (
            SELECT 1 FROM "UserMaster"
            WHERE "nUserid" = nMasterid
              AND "isAdmin" = true
        )
        THEN true ELSE false END;

    IF nBundledetailid IS NOT NULL THEN
        SELECT "nCaseid"
        INTO nCaseid
        FROM bundlesource
        WHERE "nBundledetailid" = nBundledetailid;
    ELSE
        SELECT "nCaseid"
        INTO nCaseid
        FROM "RSessionMaster"
        WHERE "nSesid" = nSesid;
    END IF;

    SELECT "nTeamid","nRoleid"
    INTO nTeamid,nRoleid
    FROM "TeamRelation"
    WHERE "nUserid" = nMasterid
      AND "nCaseid" = nCaseid
    LIMIT 1;

    IF isAdmin = false
       AND (SELECT "nSrno" FROM "RoleMaster" WHERE "nRoleid" = nRoleid) = 1
    THEN
        isAdmin := true;
    END IF;

    --------------------------------------------------
    -- COLLECT FACT IDS
    --------------------------------------------------

    sql_query := '
    SELECT jsonb_agg(DISTINCT f."nFSid")
    FROM "FactMaster" f
    JOIN "FactDetail" d ON d."nFSid" = f."nFSid"

    LEFT JOIN "FMShared" s ON s."nFSid" = f."nFSid"

    LEFT JOIN "TeamRelation" tr
        ON tr."nTeamid" = ' || quote_literal(nTeamid) || '

    WHERE
    (
        f."nSesid" = ' || quote_nullable(nSesid) || '
        OR
        f."nBundledetailid" = ' || quote_nullable(nBundledetailid) || '
    )

    AND
    (
        f."nUserid" = ' || quote_nullable(nMasterid) || '
        OR s."nUserid" = ' || quote_nullable(nMasterid) || '

        OR
        (
            ' || isAdmin || '::boolean = true
            AND f."nUserid" = tr."nUserid"
        )
    )
    ';

    IF cFType IS NOT NULL THEN
        sql_query := sql_query ||
            ' AND f."cFType" = ' || quote_literal(cFType);
    END IF;

    IF jFilter IS NOT NULL AND jFilter <> '{}'::jsonb THEN
        sql_query := sql_query || '
        AND EXISTS (
            SELECT 1
            FROM realtime.filter_marknav(
                ' || quote_literal(jFilter::text) || '::jsonb,
                ' || quote_nullable(nID) || ',
                ' || quote_nullable(nMasterid) || ',
                ''ALL'',
                ' || quote_nullable(nTeamid) || ',
                ' || isAdmin || '
            ) t
            WHERE t."id" = f."nFSid"
        )';
    END IF;

    EXECUTE sql_query INTO factids;

    IF factids IS NULL THEN
        factids := '[]'::jsonb;
    END IF;

    --------------------------------------------------
    -- REF1 – MAIN FACT LIST (DEDUP FIXED)
    --------------------------------------------------

    OPEN ref1 FOR

    WITH
    shared_ct AS (
        SELECT "nFSid", COUNT(*) AS t_shared
        FROM "FMShared"
        GROUP BY "nFSid"
    ),

    task_ct AS (
        SELECT "nFSid", COUNT(*) AS t_tasks
        FROM "FMTasks"
        GROUP BY "nFSid"
    ),

    contact_ct AS (
        SELECT "nFSid", COUNT(*) AS t_contact
        FROM "FMContact"
        GROUP BY "nFSid"
    )

    SELECT DISTINCT ON (f."nFSid")

        CASE WHEN f."cFType" = 'F' THEN 'F' ELSE 'QF' END AS "cSource",

        f."nFSid",
        f."dCreateDt",

        um."cFname" || ' ' || COALESCE(um."cLname",'') AS "cCreateby",
        um."nUserid",

        f."nBundledetailid",

        fd."nFiletype",
        fd."nTZid",
        tz."cCodename" AS "cTimezone",

        fd."jLinktype",
        fd."cType",
        f."cFType",

        fd."jTexts",
        fd."jOT",

        fd."nColorid",
        fd."nStatus",

        fd."jCordinates",
        -- CASE on bIsTranscipt so the published view picks up nTPage written by
        -- run3.py during transferAnnotations. Mirrors et_marks.sql:57-58.
        CASE WHEN COALESCE(bIsTranscipt,false) THEN fd."nTPage" ELSE fd."nPage" END AS "nPage",

        cl."cColor",

        fd."jDate",

        cm."cCodename" as "cDatetype",
        st."cCodename" as "cStatus",
        ftp."cCodename" as "cFiletype",

        COALESCE(s.t_shared,0)  as "t_shared",
        COALESCE(ft.t_tasks,0)  as "t_tasks",
        COALESCE(fc.t_contact,0) as "t_contact",

        cmt."total" as "t_comments"

    FROM "FactMaster" f

    JOIN "UserMaster" um ON um."nUserid" = f."nUserid"
    JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"

    LEFT JOIN shared_ct s ON s."nFSid" = f."nFSid"
    LEFT JOIN task_ct ft ON ft."nFSid" = f."nFSid"
    LEFT JOIN contact_ct fc ON fc."nFSid" = f."nFSid"

    LEFT JOIN "Codemaster" cm
        ON cm."nCodeid" = (fd."jDate"->>'nValue')::int

    LEFT JOIN "Codemaster" tz
        ON tz."nCodeid" = fd."nTZid"

    LEFT JOIN "Codemaster" st
        ON st."nCodeid" = fd."nStatus"
		AND st."nCategoryid" = 24

    LEFT JOIN "Codemaster" ftp
        ON ftp."nCodeid" = fd."nFiletype"
		AND ftp."nCategoryid" = 23
	
    JOIN "RIssueMaster" cl
        ON cl."nIid" = fd."nColorid"

    LEFT JOIN realtime."comments" cmt
        ON cmt."nFSid" = f."nFSid"

    WHERE factids @> to_jsonb(f."nFSid")
      -- Orphan filter: on the published view, suppress facts whose annotation
      -- could not be re-anchored. Mirrors et_marks.sql:48-50.
      AND (
        COALESCE(bIsTranscipt, false) = false
        OR (fd."cTransferStatus" IS DISTINCT FROM 'O' AND fd."jTCordinates" IS NOT NULL)
      )

    ORDER BY
        f."nFSid",
        f."dCreateDt" DESC;

    --------------------------------------------------
    -- REF2 – ISSUES
    --------------------------------------------------

    OPEN ref2 FOR
    SELECT jsonb_agg(f."nFSid") AS "jFSids",
           fi."nIssueid", fi."nImpactid", fi."nRelevanceid",
           im."nICid", ic."cCategory", im."cIName", im."cColor"
    FROM "FactMaster" f
    JOIN "FMIssue" fi ON fi."nFSid" = f."nFSid"
    JOIN "RIssueMaster" im ON im."nIid" = fi."nIssueid"
    JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"
    WHERE factids @> to_jsonb(f."nFSid")
    GROUP BY fi."nIssueid", fi."nImpactid", fi."nRelevanceid",
             im."nICid", ic."cCategory", im."cIName", im."cColor";

    --------------------------------------------------
    -- REF3 – LINKS
    --------------------------------------------------

    OPEN ref3 FOR
    SELECT fl."nFSid", fl."nFMLid",
           fl."nBundledetailid",
           bd."cFilename" AS "cName",
           bd."cExhibitno", bd."cTab",
           fl."jLinktype", bd."cPage"
    FROM "FMLinks" fl
    JOIN "BundleDetail" bd
      ON bd."nBundledetailid" = fl."nBundledetailid"
    WHERE factids @> to_jsonb(fl."nFSid");

    RETURN NEXT ref1;
    RETURN NEXT ref2;
    RETURN NEXT ref3;

END;
$function$
