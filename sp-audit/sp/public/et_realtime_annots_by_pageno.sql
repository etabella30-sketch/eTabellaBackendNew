CREATE OR REPLACE FUNCTION public.et_realtime_annots_by_pageno(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nSesid uuid;cPageno text;
BEGIN
nSesid := NULLIF(parameter->>'nSesid','')::uuid;
cPageno := parameter->>'cPageno';
    
    OPEN ref FOR
        select  "nIDid","jCordinates"
        From  "RIssueDetail" 
        where "nSessionid" = nSesid and coalesce("cONote",'') !=''
        and "jTCordinates" is null and "jCordinates" is not null
        and  "bTrf" = false and "cPageno" = cPageno
        order by "nIDid";  

-- select * from "RIssueDetail"

    RETURN ref;
END;
$function$
