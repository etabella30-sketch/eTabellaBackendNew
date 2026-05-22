CREATE OR REPLACE FUNCTION present.et_present_index_data(parameter jsonb)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid   uuid;
    nCaseid     uuid;
    nTypeid     int;
    nSubtypeid  int;
    dStartDt    date;
    dEndDt      date;
    cPname      text;
    jFiles      jsonb;
    nDTaskid    int;
    ref1        refcursor;
    ref2        refcursor;
BEGIN
    -- Parse parameters
    nMasterid  := (parameter ->> 'nMasterid')::uuid;
    nCaseid    := (parameter ->> 'nCaseid')::uuid;
    nTypeid    := (parameter ->> 'nTypeid')::int;
    nSubtypeid := (parameter ->> 'nSubtypeid')::int;
    dStartDt   := NULLIF(parameter ->> 'dStartDt','')::date;
    dEndDt     := NULLIF(parameter ->> 'dEndDt','')::date;
    cPname     := parameter ->> 'cPname';
    jFiles     := parameter ->> 'jFiles';
    nDTaskid   := (parameter ->> 'nDTaskid')::int;

    -- First cursor: case information
    OPEN ref1 FOR
        SELECT
            "nCaseid",
            "cCasename",
            "cCaseno",
            dStartDt::date::text     AS "dStartDt",
            dEndDt::date::text       AS "dEndDt",
            CASE
                WHEN cPname = '' OR coalesce(cPname,'A') = 'A' THEN 'All session'
                ELSE cPname
            END                     AS "cPname"
        FROM "CaseMaster"
        WHERE "nCaseid" = nCaseid;
    RETURN NEXT ref1;

    -- Second cursor: hierarchical tree + document list
    OPEN ref2 FOR
        SELECT
            t."nSerial"::text           AS "cTab",
            bd."nBundledetailid",
            bd."cFilename",
            bd."cTab"::text,
            bd."cExhibitno"::text,
            bd."cRefpage"::text,
            bd."dIntrestDt"::text,
            bd."cDesc"::text            AS "cDescription",
            array_to_string(t.sub_info,' / ') AS sub_info,
            t.kind::text,
            bd."nParentBundleid",
            t."cBundletag"::text,
            bd.sorted_tab,
            bd.sorted_name
        FROM (
            WITH tree_data AS (
                SELECT
                    row_number() OVER (ORDER BY pm."cName") AS serial,
                    pm."cName"                      AS "cFilename",
                    ARRAY[pm."cName"]              AS sub_info,
                    pm."dCreateDt"::date           AS dCreateDt,
                    pm."cName",
                    0                              AS "nParentBundleid"
                FROM present."PresentationMaster" pm
                JOIN present."PMDocuments" pmd
                  ON pm."nPresentid" = pmd."nPresentid"
                WHERE pm."nCreateid" = nMasterid
                  AND pm."nTypeid" = nTypeid
                  AND pm."cStatus" = 'C'
                  AND pm."nCaseid" = nCaseid
                  AND (jFiles IS NULL OR to_jsonb(pmd."nBundledetailid") <@ jFiles)
                  AND (nSubtypeid = 0 OR pm."nSubtypeid" = nSubtypeid)
                  AND ((dStartDt IS NOT NULL AND dEndDt IS NOT NULL AND
                        pm."dCreateDt"::date BETWEEN dStartDt AND dEndDt)
                       OR dStartDt IS NULL OR dEndDt IS NULL)
                  AND (cPname = '' OR pm."cName" = cPname)
                GROUP BY pm."cName", pm."dCreateDt"::date

                UNION ALL

                SELECT
                    row_number() OVER (ORDER BY pm."cName", pm."dCreateDt"::date) AS serial,
                    pm."dCreateDt"::date::text       AS "cFilename",
                    ARRAY[pm."cName", pm."dCreateDt"::date::text] AS sub_info,
                    pm."dCreateDt"::date             AS dCreateDt,
                    pm."cName",
                    1                                AS "nParentBundleid"
                FROM present."PresentationMaster" pm
                JOIN present."PMDocuments" pmd
                  ON pm."nPresentid" = pmd."nPresentid"
                WHERE pm."nCreateid" = nMasterid
                  AND pm."nTypeid" = nTypeid
                  AND pm."cStatus" = 'C'
                  AND pm."nCaseid" = nCaseid
                  AND (jFiles IS NULL OR to_jsonb(pmd."nBundledetailid") <@ jFiles)
                  AND (nSubtypeid = 0 OR pm."nSubtypeid" = nSubtypeid)
                  AND ((dStartDt IS NOT NULL AND dEndDt IS NOT NULL AND
                        pm."dCreateDt"::date BETWEEN dStartDt AND dEndDt)
                       OR dStartDt IS NULL OR dEndDt IS NULL)
                  AND (cPname = '' OR pm."cName" = cPname)
                GROUP BY pm."cName", pm."dCreateDt"::date
            )
            SELECT
                serial,
                0                                  AS "nBundledetailid",
                t."cFilename"::text,
                serial::text                       AS "cTab",
                ''::text                           AS "cExhibitno",
                ''::text                           AS "cRefpage",
                ''::text                           AS "dIntrestDt",
                ''::text                           AS "cDescription",
                t.sub_info,
                ''::text                           AS kind,
                serial::text                       AS "cBundletag",
                t."nParentBundleid",
                NULL                               AS sorted_tab,
                NULL                               AS sorted_name
            FROM tree_data t
        ) AS t
        LEFT JOIN "BundleDetail" bd
          ON bd."nBundledetailid" = ANY (
               SELECT (value->>'nBundledetailid')::uuid
                 FROM jsonb_array_elements(jFiles) AS value
             )
        LEFT JOIN "DownloadTDetail" dt
          ON dt."nBDid" = bd."nBundledetailid"
         AND dt."nDTaskid" = nDTaskid
        WHERE bd."nBundledetailid" IS NOT NULL
        ORDER BY t."serial", t.sub_info, bd.sorted_tab, bd.sorted_name
    ;
    RETURN NEXT ref2;
END;
$function$
