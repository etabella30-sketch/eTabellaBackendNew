-- 2026-07-02 — Download/export AUTHZ hardening (SEC3/SEC4/SEC5)
-- Closes the IDOR class on the download job endpoints: get/url, retryjob and
-- delete previously acted on any nDPid without checking that the caller belongs
-- to the job's case. Adds one reusable membership predicate
-- (public.et_is_case_member) and wires it into the three download SPs.
-- Additive / CREATE OR REPLACE only; no schema changes. Mirrors the existing
-- inline TeamRelation pattern (et_individual_doc_info.sql). App-side companions:
-- SEC1 (JWT re-enabled on the two file-download controllers) and SEC2
-- (path-traversal guard in apps/export) ship in the same branch.

BEGIN;

-- SEC5: reusable case-membership predicate.
CREATE OR REPLACE FUNCTION public.et_is_case_member(p_nCaseid uuid, p_nUserid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public."TeamRelation"
    WHERE "nCaseid" = p_nCaseid AND "nUserid" = p_nUserid
  );
$function$;

-- SEC3: presigned-URL lookup now returns a row ONLY for case members.
CREATE OR REPLACE FUNCTION download.et_get_download_presigned_url(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nDPid uuid;
BEGIN
  nMasterid := parameter ->>'nMasterid';
  nDPid := parameter ->>'nDPid';

  OPEN ref FOR
    select p."cUrl"
    from download."ProcessMaster" p
    where p."nDPid" = nDPid
      and public.et_is_case_member(p."nCaseid", nMasterid);

  return ref;
END;
$function$;

-- SEC3: retry now denies non-members before mutating the job.
CREATE OR REPLACE FUNCTION download.et_process_retry(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare
  nDPid uuid;
  nMasterid uuid;
BEGIN
  nDPid := NULLIF(parameter ->>'nDPid','')::uuid;
  nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;

  if not exists (
    select 1 from download."ProcessMaster" p
    where p."nDPid" = nDPid and public.et_is_case_member(p."nCaseid", nMasterid)
  ) then
    open ref for select 0 as msg,'Not authorized for this job' as value;
    return ref;
  end if;

  update download."ProcessMaster" set "cStatus" = 'R' where "nDPid" = nDPid;

  insert into download."ProcessStatusLogs"("nDPid","cStatus","dLogDt")
  values(nDPid,'R',now());

  open ref for
  select 1 as msg,'Retried job' as value;

  RETURN ref;
END;
$function$;

-- SEC4: delete denies non-members (defense-in-depth over the Users filter).
CREATE OR REPLACE FUNCTION download.et_delete(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nDPid uuid;nMasterid uuid;cUrl text;isNeedToClear boolean;
BEGIN
  nDPid:= parameter ->>'nDPid';
  nMasterid := parameter ->>'nMasterid';

  if not exists (
    select 1 from download."ProcessMaster" p
    where p."nDPid" = nDPid and public.et_is_case_member(p."nCaseid", nMasterid)
  ) then
    open ref for select 0 as msg,null::text as "cUrl",'Not authorized for this job' as value,false as "isNeedToClear";
    return ref;
  end if;

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

-- SEC4: legacy export delete (coreapi) — was IDOR, now membership-gated.
CREATE OR REPLACE FUNCTION public.et_export_delete_file(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nUserid uuid;nExportid uuid;nEDid uuid;cType text;vCaseid uuid;
BEGIN
  nUserid := NULLIF(parameter->>'nMasterid','')::uuid;
  nExportid := NULLIF(parameter ->>'nExportid','')::uuid;
  nEDid := NULLIF(parameter ->>'nEDid','')::uuid;
  cType := parameter ->>'cType';

  if nExportid is null and nEDid is not null then
    select "nExportid" into nExportid from "ExportDetail" where "nEDid" = nEDid;
  end if;
  select "nCaseid" into vCaseid from "ExportMaster" where "nExportid" = nExportid;
  if vCaseid is null or not public.et_is_case_member(vCaseid, nUserid) then
    open ref for select 0 as msg,'Not authorized for this export' as value;
    return ref;
  end if;

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

COMMIT;
