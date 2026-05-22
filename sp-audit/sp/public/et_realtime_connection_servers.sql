CREATE OR REPLACE FUNCTION public.et_realtime_connection_servers(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare cUnicuserid text;
BEGIN

cUnicuserid := parameter ->>'cUnicuserid';

/*
select * From "RSessionMaster" order by 1 desc
select * From "RealtimeServers" order by 1 desc
select * from et_realtime_connection_servers('{""cUnicuserid"":""gjmdmvmi3w""}','r');fetch all in ""r""
*/

 open ref for 
select 
rs."nRTSid",rs."cUrl",rs."nPort",rs."cName"
From "RSessionMaster" r
join "CaseMaster" c on c."nCaseid" = r."nCaseid"
join "RealtimeServers" rs on rs."nRTSid" = r."nRTSid"
where r."cUnicuserid" = cUnicuserid
group by rs."nRTSid",rs."cUrl",rs."nPort",rs."cName";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
