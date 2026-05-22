CREATE OR REPLACE FUNCTION public.et_task_update_status(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
Declare nUserid uuid; nProgress int; nTaskid uuid;nStatus int;
BEGIN
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nProgress := parameter ->>'nProgress';
nTaskid := NULLIF(parameter ->>'nTaskid','')::uuid;
nStatus := parameter ->>'nStatus';
	-- select * from et_sidenav_task_update_status('{""nTaskid"":1}','r');fetch all in ""r""
-- select * from public.et_task_update_status ('{"nTaskid":"8530a85e-d018-4680-bd29-dd061ac093aa","nStatus":240,"nProgress":76,"nMasterid":"7ee7a723-d96d-4d63-81c1-4dc4a2be4699"}','r1');fetch all in "r1";

	update "TaskMaster" set "dUpdateDt" = now() where "nTaskid" = nTaskid;
	update "TaskDetail" set "nStatus" = nStatus,"nProgress" = nProgress	where "nTaskid" = nTaskid;
	open ref for
		select 1 as msg,'Updated ' as value
	;

	

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
