CREATE OR REPLACE FUNCTION public.et_realtime_get_highlightlist(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nUserid uuid;nSessionid uuid;
BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid', '')::uuid;
nUserid := NULLIF(parameter ->>'nUserid', '')::uuid;
nSessionid := NULLIF(parameter ->>'nSessionid', '')::uuid;

--select * from et_realtime_get_highlightlist ('{""nCaseid"":1,""nUserid"":1,""nSessionid"":1}','r1');fetch all in ""r1"";
open ref for
select "nHid","cPageno","cLineno" From "RHighlights"
where "nCaseid" = nCaseid and "nUserid" = nUserid and "nSessionId" = nSessionid;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
