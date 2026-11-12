CREATE OR REPLACE FUNCTION realtime.et_marknav_place_mark(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
  nCaseid   uuid := (parameter->>'nCaseid')::uuid;
  nSesid    uuid := (parameter->>'nSesid')::uuid;
  nMasterid uuid := (parameter->>'nMasterid')::uuid;
  nId       uuid := (parameter->>'id')::uuid;
  cKind     text := parameter->>'kind';
  jT        jsonb := (parameter->>'jT')::jsonb;
  nPage     integer := (parameter->>'nTPage')::integer;
  nLine     integer := (parameter->>'nTLine')::integer;
  n         integer := 0;
BEGIN
  IF cKind IN ('QF', 'F') THEN
    UPDATE "FactDetail" d SET "jTCordinates" = jT, "nTPage" = nPage, "nTLine" = nLine, "cTransferStatus" = 'T'
      FROM "FactMaster" m
     WHERE d."nFSid" = nId AND m."nFSid" = d."nFSid" AND m."nSesid" = nSesid AND m."nCaseid" = nCaseid
       AND m."nUserid" = nMasterid AND d."cTransferStatus" = 'O';
  ELSIF cKind = 'D' THEN
    UPDATE "DocDetail" d SET "jTCordinates" = jT, "nTPage" = nPage, "nTLine" = nLine, "cTransferStatus" = 'T'
      FROM "DocMaster" m
     WHERE d."nDocid" = nId AND m."nDocid" = d."nDocid" AND m."nSesid" = nSesid AND m."nCaseid" = nCaseid
       AND m."nUserid" = nMasterid AND d."cTransferStatus" = 'O';
  ELSIF cKind = 'QM' THEN
    UPDATE "RHighlights" h SET "cTPageno" = nPage::text, "cTLineno" = nLine::text, "cTTime" = parameter->>'cTTime',
           "tidentity" = parameter->>'tidentity', "jTCordinates" = jT, "cTransferStatus" = 'T'
     WHERE h."nHid" = nId AND h."nSessionId" = nSesid AND h."nCaseid" = nCaseid
       AND h."nUserid" = nMasterid AND h."cTransferStatus" = 'O';
  END IF;
  GET DIAGNOSTICS n = ROW_COUNT;
  OPEN ref FOR SELECT CASE WHEN n > 0 THEN 1 ELSE -1 END AS msg,
                      CASE WHEN n > 0 THEN 'Placed' ELSE 'Mark not found or already placed' END AS value,
                      n AS "nPlaced";
  RETURN ref;
END;
$function$

