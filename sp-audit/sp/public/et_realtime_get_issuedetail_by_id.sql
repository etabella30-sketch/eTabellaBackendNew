CREATE OR REPLACE FUNCTION public.et_realtime_get_issuedetail_by_id(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
nIDid uuid;
  begin

    nIDid := NULLIF(parameter ->> 'nIDid','')::UUID;
   
    OPEN ref FOR
        select "nIDid","cPageno" ,"cTPageno" ,"jCordinates","jTCordinates","cColor","nICount", "cNote","cONote","cIid","cUNote","jOCordinates"
        From "RIssuesummary" id
        Where "nIDid" = nIDid;
    RETURN ref;
END;
$function$
