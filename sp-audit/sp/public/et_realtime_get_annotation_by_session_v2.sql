CREATE OR REPLACE FUNCTION public.et_realtime_get_annotation_by_session_v2(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nSessionid uuid;
        cZone text;
BEGIN
nSessionid := NULLIF(parameter->>'nSessionid','')::uuid;
SELECT coalesce(nullif(s."cTimezone", ''), current_setting('TimeZone')) INTO cZone
  FROM "RSessionMaster" s WHERE s."nSesid" = nSessionid;
cZone := coalesce(cZone, current_setting('TimeZone'));

    OPEN ref FOR
				select f."nFSid" as "nId",f."nUserid",d."jCordinates", f."cFType" as "cType",d."jOT" as "cONote",
				d."nTPage" as "cPageno",
				to_char((f."dCreateDt" at time zone current_setting('TimeZone')) at time zone cZone, 'HH24:MI:SS') as "cMadeAt"
				from "FactMaster" f
				join "FactDetail" d on d."nFSid" = f."nFSid"
				where f."nSesid" = nSessionid and "jCordinates" is not null
				union all
				select d."nDocid" as "nId",d."nUserid",	dt."jCordinates",'D' as "cType",dt."jOText" as "cONote",
				dt."nTPage" as "cPageno",
				to_char((d."dCreateDt" at time zone current_setting('TimeZone')) at time zone cZone, 'HH24:MI:SS')
				from "DocMaster" d
				join "DocDetail" dt on dt."nDocid" = d."nDocid"
				where d."nSesid" = nSessionid and "jCordinates" is not null
				;
    RETURN ref;
END;
$function$;
