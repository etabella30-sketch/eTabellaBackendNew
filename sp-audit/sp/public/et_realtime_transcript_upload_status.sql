CREATE OR REPLACE FUNCTION public.et_realtime_transcript_upload_status(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nSesid uuid;nUserid uuid;cFlag text;

BEGIN

nSesid := NULLIF(parameter ->> 'nSesid','')::uuid;
nUserid := NULLIF(parameter ->> 'nUserid','')::uuid;
cFlag := parameter ->>'cFlag';

if(cFlag = 'C')then 
update "RSessionMaster" r set "isUploaded" = true,"isTranscript" = false where "nSesid" = nSesid;

insert into "RSessionTranscripts"("nSesid","nUserid")
values(nSesid,nUserid);

elsif(cFlag = 'P')then
update "RSessionMaster" r set "isUploaded" = true,"isTranscript" = true,"cStatus" = 'P' where "nSesid" = nSesid;
end if;

 open ref for 
 select 1 as msg;

 RETURN ref;
 END;
$function$
