CREATE OR REPLACE FUNCTION public.fun_defaultpermission(roleid uuid)
 RETURNS TABLE("nPMid" uuid, "cType" text)
 LANGUAGE plpgsql
AS $function$
    BEGIN
	
-- select * from fun_defaultpermission(1)
-- select * from "PermissionModule"
-- roleid
 RETURN QUERY
  
select p."nPMid",'R' "cType" --,case when i=0 then 'R' else 'W' end as "cType"
from "PermissionModule" p --,generate_series(0,1)i  
where case 
    when roleid = '2133ed3e-2878-4083-a597-eedd61307ac4'::uuid then p."nPMid" not in (
1,2,3,4,5,6,7,8,9,10,11,12,13,14) 
    when roleid = '16515be7-a996-4991-8d81-3e1d0715e130'::uuid then p."nPMid" not in (
1,2,3,4,6,7,8,9,10,11,12,13,14) 
    else true end;
  
    END;
$function$
