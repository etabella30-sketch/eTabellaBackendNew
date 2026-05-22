CREATE OR REPLACE FUNCTION public.et_user_permission(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;
nCaseid uuid;
cType text;
BEGIN
-- select * from et_user_permission('{""nCaseid"":1079, ""nMasterid"": 29, ""cType"": ""PT""}','r');fetch all in ""r""
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
cType := parameter ->>'cType';

	
			if exists(select * from "UserPermission" where "nPMid" = (select "nPMid" from "PermissionModule" where "cType" = cType)
		and "nCaseid" = nCaseid and "nUserid" = nMasterid) then
					open ref for
						select false as "permisson";
			else 
				open ref for
						select true as "permisson";
			end if;

 -- Return the cursor to the caller
 RETURN ref;    
END;

$function$
