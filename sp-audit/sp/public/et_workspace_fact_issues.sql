CREATE OR REPLACE FUNCTION public.et_workspace_fact_issues(parameter jsonb, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

DECLARE
   nMasterid uuid;
   cFacttype text;
   nCaseid uuid;
   nContactid uuid;
   nIssueid uuid;

   sql_query TEXT;
   jFilter jsonb default '[]'::jsonb;
   filter_string text;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
cFacttype := parameter ->>'cFacttype';
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nContactid := NULLIF(parameter ->>'nContactid','')::uuid;
nIssueid := NULLIF(parameter ->>'nIssueid','')::uuid;

jFilter := coalesce((parameter->>'jFilter')::jsonb,'[]'::jsonb);

filter_string := (select filter_whereclause_2(jFilter,'WRK'));

sql_query := '

SELECT
   f."nFSid",

   fi."nIssueid",
   fi."nImpactid",
   fi."nRelevanceid",

   im."nICid",
   ic."cCategory",
   im."cIName",
   im."cColor",

   rl."cCodename" AS "cRelevance",
   impct."cCodename" AS "cImpact",

   rl."nSerialno" AS "nRelevanceseq",
   impct."nSerialno" AS "nImpactseq"

FROM "FactMaster" f

JOIN "FactDetail" d ON d."nFSid" = f."nFSid"

LEFT JOIN "FMShared" fs ON fs."nFSid" = f."nFSid"

JOIN "FMIssue" fi ON fi."nFSid" = f."nFSid"

JOIN "RIssueMaster" im ON im."nIid" = fi."nIssueid"

JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"

LEFT JOIN "FMContact" fc ON fc."nFSid" = f."nFSid"

LEFT JOIN "Codemaster" rl
   ON rl."nCodeid" = fi."nRelevanceid"

LEFT JOIN "Codemaster" impct
   ON impct."nCodeid" = fi."nImpactid"

WHERE

(
   f."nCaseid" = ''' || nCaseid || '''::uuid

   AND (
      ' || CASE
            WHEN nMasterid IS NULL THEN 'true'
            ELSE '
               f."nUserid" = '''||nMasterid||'''::uuid
               OR fs."nUserid" = '''||nMasterid||'''::uuid

               OR EXISTS (
                  SELECT 1 FROM "TeamRelation" tr
                  WHERE tr."nUserid" = f."nUserid"
                    AND tr."nCaseid" = '''||nCaseid||'''::uuid
               )
            '
         END || '
   )

   AND (
      ' || quote_literal(cFacttype) || ' = ''ALL''
      OR f."cFType" = ' || quote_literal(cFacttype) || '
   )

   AND (
      ' || CASE
            WHEN nIssueid IS NULL THEN 'true'
            ELSE 'fi."nIssueid" = '''||nIssueid||'''::uuid'
         END || '
   )

   AND (
      ' || CASE
            WHEN nContactid IS NULL THEN 'true'
            ELSE 'fc."nContactid" = '''||nContactid||'''::uuid'
         END || '
   )
)

' || CASE
      WHEN filter_string IS NOT NULL
      THEN ' AND ('||filter_string||') '
      ELSE ''
   END || '

GROUP BY
   f."nFSid",
   fi."nIssueid",
   fi."nImpactid",
   fi."nRelevanceid",

   im."nICid",
   ic."cCategory",
   im."cIName",
   im."cColor",

   rl."cCodename",
   impct."cCodename",

   rl."nSerialno",
   impct."nSerialno"

ORDER BY f."dCreateDt" DESC
';

OPEN ref FOR EXECUTE sql_query;

RETURN ref;

END;
$function$
