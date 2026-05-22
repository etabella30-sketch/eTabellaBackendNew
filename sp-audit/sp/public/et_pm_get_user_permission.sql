CREATE OR REPLACE FUNCTION public.et_pm_get_user_permission(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nCaseid uuid;
isAdmin boolean := false;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nMasterid;

open ref for 
		
    select 1 as msg, jsonb_agg(pm."cType") filter (where up."nPMid" is not null ) "jPermission"
    FROM  "CaseMaster" c
	left join "UserPermission" up on up."nCaseid" = c."nCaseid" and up."nUserid" = nMasterid
	left join "PermissionModule" pm on pm."nPMid" = up."nPMid"
	where c."nCaseid" = nCaseid and case when isAdmin then false -- pm."cType" != 'UM' 
	else true end; 

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
