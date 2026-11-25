CREATE OR REPLACE FUNCTION realtime.et_marknav_needs_review(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
  nCaseid   uuid := (parameter->>'nCaseid')::uuid;
  nSesid    uuid := (parameter->>'nSesid')::uuid;
  nMasterid uuid := (parameter->>'nMasterid')::uuid;
BEGIN
  OPEN ref FOR
  SELECT m."nFSid" AS id, m."cFType"::text AS kind, d."jCordinates", d."jOT" AS "jTexts", m."dCreateDt",
         CASE WHEN d."jCordinates" IS NULL OR jsonb_typeof(d."jCordinates") <> 'array' OR jsonb_array_length(d."jCordinates") = 0
                OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(d."jCordinates") c WHERE coalesce(c->>'t', '') <> '')
              THEN 'no-time' ELSE 'outside-hearing' END AS reason
    FROM "FactMaster" m JOIN "FactDetail" d ON d."nFSid" = m."nFSid"
   WHERE m."nSesid" = nSesid AND m."nCaseid" = nCaseid AND m."nUserid" = nMasterid AND d."cTransferStatus" = 'O'
  UNION ALL
  SELECT m."nDocid", 'D', d."jCordinates", d."jOText", m."dCreateDt",
         CASE WHEN d."jCordinates" IS NULL OR jsonb_typeof(d."jCordinates") <> 'array' OR jsonb_array_length(d."jCordinates") = 0
                OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(d."jCordinates") c WHERE coalesce(c->>'t', '') <> '')
              THEN 'no-time' ELSE 'outside-hearing' END
    FROM "DocMaster" m JOIN "DocDetail" d ON d."nDocid" = m."nDocid"
   WHERE m."nSesid" = nSesid AND m."nCaseid" = nCaseid AND m."nUserid" = nMasterid AND d."cTransferStatus" = 'O'
  UNION ALL
  SELECT h."nHid", 'QM', h."jCordinates", to_jsonb(ARRAY[h."cNote"]), h."dCreatedt",
         CASE WHEN coalesce(h."cTime", '') = '' THEN 'no-time' ELSE 'outside-hearing' END
    FROM "RHighlights" h
   WHERE h."nSessionId" = nSesid AND h."nCaseid" = nCaseid AND h."nUserid" = nMasterid AND h."cTransferStatus" = 'O'
   ORDER BY 5;
  RETURN ref;
END;
$function$

