CREATE OR REPLACE FUNCTION download.et_delete(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
-- select * from "BundleDetail" 
declare nDPid uuid;nMasterid uuid;cUrl text;isNeedToClear boolean;

BEGIN
nDPid:= parameter ->>'nDPid';
nMasterid := parameter ->>'nMasterid';

-- select * from download.et_delete ('{"nDPid":1}','r1');fetch all in "r1";
-- select * from download."ProcessMaster" where "cStatus" = 'C' order by "dCreateDt" desc

		-- SEC4 (2026-07-02): defense-in-depth — the Users filter below already
		-- no-ops for a stranger (no Users row), but deny non-members of the
		-- job's case explicitly so this never becomes exploitable if the Users
		-- table is populated more broadly later.
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
		
   return ref ;-- Return the cursor to the caller
    END;
$function$
