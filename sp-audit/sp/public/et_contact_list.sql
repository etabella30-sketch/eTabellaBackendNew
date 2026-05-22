CREATE OR REPLACE FUNCTION public.et_contact_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$DECLARE
    nCaseid UUID;
    nMasterid UUID;
    ZeroUUID UUID := '00000000-0000-0000-0000-000000000000'::uuid;
    cType text;
    jContactIds jsonb;
    nTeamid uuid;
    nBundledetailid UUID;
    nSesid UUID;
BEGIN
    nCaseid := NULLIF(parameter ->> 'nCaseid', '')::uuid;
    nMasterid := NULLIF(parameter ->> 'nMasterid', '')::uuid;
    cType := COALESCE(NULLIF(parameter ->> 'cType', ''), 'C');
    nBundledetailid := NULLIF(parameter ->> 'nBundledetailid', '')::uuid;
    nSesid := NULLIF(parameter ->> 'nSesid', '')::uuid;

    nTeamid := (
        SELECT "nTeamid"
        FROM "TeamRelation"
        WHERE "nUserid" = nMasterid
          AND "nCaseid" = nCaseid
        LIMIT 1
    );

    OPEN ref FOR
    SELECT
        c."nContactid",
        c."cProfile",
        c."cFname",
        c."cLname",
        c."cEmail",
        c."cMentiontag",

        /* 🔧 FIXED lookups (scalar, no fan-out) */
        (
            SELECT cr."cRole"
            FROM "ContactRole" cr
            WHERE cr."nCRoleid" = c."nRoleid"
            ORDER BY cr."nCRoleid"
            LIMIT 1
        ) AS "cRole",

        (
            SELECT cc."cCompany"
            FROM "ContactCompany" cc
            WHERE cc."nCompanyid" = c."nCompanyid"
            ORDER BY cc."nCompanyid"
            LIMIT 1
        ) AS "cCompany",

        (
            SELECT cm."cCodename"
            FROM "Codemaster" cm
            WHERE cm."nCodeid" = c."nPartyid"
			AND cm."nCategoryid" = 22
            ORDER BY cm."nCodeid"
            LIMIT 1
        ) AS "cPartyname",

        true AS "bCanView",
        CASE WHEN c."nUserid" = nMasterid THEN true ELSE false END AS "bCanEdit",
        CASE WHEN c."nUserid" = nMasterid THEN true ELSE false END AS "bCanDelete"

    FROM "ContactMaster" c
    WHERE c."nCaseid" = nCaseid
      AND c."cType" = cType

      AND EXISTS (
            SELECT 1
            FROM "TeamRelation" tu
            WHERE tu."nUserid" = c."nUserid"
              AND tu."nTeamid" = nTeamid
      )

      AND (
            (nSesid IS NULL AND nBundledetailid IS NULL)
           OR
            EXISTS (
                SELECT 1
                FROM "FMContact" fc
                JOIN "FactMaster" f ON f."nFSid" = fc."nFSid"
                WHERE fc."nContactid" = c."nContactid"
                  AND (
                        (nBundledetailid IS NOT NULL AND f."nBundledetailid" = nBundledetailid)
                     OR (nSesid IS NOT NULL AND f."nSesid" = nSesid)
                  )
            )
           OR
            EXISTS (
                SELECT 1
                FROM "BDContacts" bc
                WHERE bc."nContactid" = c."nContactid"
                  AND nBundledetailid IS NOT NULL
                  AND bc."nBundledetailid" = nBundledetailid
            )
      )
    ORDER BY c."cFname", c."cLname";

    RETURN ref;
END;
$function$
