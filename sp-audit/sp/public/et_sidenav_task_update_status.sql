CREATE OR REPLACE FUNCTION public.et_sidenav_task_update_status(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
Declare nUserid uuid; nCaseid uuid; nTaskid uuid; cStatus text;
BEGIN
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nTaskid := NULLIF(parameter ->>'nTaskid','')::uuid;
cStatus := parameter ->>'cStatus';

	-- select * from et_sidenav_task_update_status('{""nTaskid"":1}','r');fetch all in ""r""
update "TaskMaster" set "dUpdateDt" = now() where "nTaskid" = nTaskid;
	update "TaskDetail" 
	set "cStatus" = cStatus,
	"nProgress" = CASE WHEN cStatus = 'C' THEN 100
				  WHEN cStatus = 'P' THEN 0
				  ELSE "nProgress"
				  END
	where "nTaskid" = nTaskid;
	open ref for
		select 1 as msg
	;

	

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
