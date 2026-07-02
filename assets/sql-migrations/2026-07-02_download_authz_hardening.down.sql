-- Rollback 2026-07-02 download/export AUTHZ hardening.
-- Restores the pre-SEC3/4 SP bodies (no membership check) and drops the SEC5
-- helper. NOTE: rolling this back re-opens the IDOR — only for emergency revert.

BEGIN;

CREATE OR REPLACE FUNCTION download.et_get_download_presigned_url(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nDPid uuid;
BEGIN
  nMasterid := parameter ->>'nMasterid';
  nDPid := parameter ->>'nDPid';

  OPEN ref FOR
    select "cUrl"
    from download."ProcessMaster" where "nDPid" = nDPid;

  return ref;
END;
$function$;

CREATE OR REPLACE FUNCTION download.et_process_retry(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare
  nDPid uuid;
BEGIN
  nDPid := NULLIF(parameter ->>'nDPid','')::uuid;

  update download."ProcessMaster" set "cStatus" = 'R' where "nDPid" = nDPid;

  insert into download."ProcessStatusLogs"("nDPid","cStatus","dLogDt")
  values(nDPid,'R',now());

  open ref for
  select 1 as msg,'Retried job' as value;

  RETURN ref;
END;
$function$;

CREATE OR REPLACE FUNCTION download.et_delete(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nDPid uuid;nMasterid uuid;cUrl text;isNeedToClear boolean;
BEGIN
  nDPid:= parameter ->>'nDPid';
  nMasterid := parameter ->>'nMasterid';

  update download."Users" set "dDelDt" = now() where "nDPid" = nDPid and "nUserid" = nMasterid;

  if not exists(select * from download."Users" where "nDPid" = nDPid and "dDelDt" is null )then
    delete from download."ProcessBatchs" where "nDPid" = nDPid;

    update download."ProcessMaster" set "dDelDt" = now() where "nDPid" = nDPid
    returning "cUrl" into cUrl;

    isNeedToClear = true;
  end if;

  OPEN ref FOR
    select 1 as msg,cUrl as "cUrl",'Deleted!' as value,isNeedToClear as  "isNeedToClear";

  return ref;
END;
$function$;

CREATE OR REPLACE FUNCTION public.et_export_delete_file(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nUserid uuid;nExportid uuid;nEDid uuid;cType text;
BEGIN
  nUserid := NULLIF(parameter->>'nMasterid','')::uuid;
  nExportid := NULLIF(parameter ->>'nExportid','')::uuid;
  nEDid := NULLIF(parameter ->>'nEDid','')::uuid;
  cType := parameter ->>'cType';

  if(cType='S')then
    delete from "ExportMaster" where "nExportid" = nExportid;
    delete from  "ExportDetail"  where "nExportid" = nExportid;
  else
    delete from  "ExportDetail" where "nEDid" = nEDid;
  end if;

  open ref for
  select 1 as msg,'Deleted' value;

  RETURN ref;
END;
$function$;

DROP FUNCTION IF EXISTS public.et_is_case_member(uuid, uuid);

COMMIT;
