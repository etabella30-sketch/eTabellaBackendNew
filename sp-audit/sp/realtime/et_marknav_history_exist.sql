CREATE OR REPLACE FUNCTION realtime.et_marknav_history_exist(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE 
    nSesid uuid;
    nUserid uuid;
	cType text;
    nBundledetailid uuid;
    bisExists boolean;

BEGIN
    
    nSesid  := NULLIF(parameter->>'nSesid','')::uuid;
    nUserid := NULLIF(parameter->>'nUserid','')::uuid;
	cType := parameter->>'cType';
    nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;

 
 SELECT count(*) > 0
    INTO bisExists
    FROM realtime.history_marknav(nSesid, nBundledetailid, nUserid, cType, 1);

  OPEN ref FOR
        SELECT 1 AS "msg", bisExists AS "bisExists";

    RETURN ref;
END;
$function$
