CREATE OR REPLACE FUNCTION public.et_realtime_serverslist(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

BEGIN

/*
select * From "RealtimeServers" order by 1 desc
select * from et_realtime_serverslist('{""cUnicuserid"":""asd""}','r');fetch all in ""r""
*/

 open ref for 
select "nRTSid","cUrl","nPort","cName"
From "RealtimeServers";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
