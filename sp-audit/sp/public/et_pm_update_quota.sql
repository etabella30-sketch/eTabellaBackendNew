CREATE OR REPLACE FUNCTION public.et_pm_update_quota(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nCaseid uuid;nQuota bigint;nUserid uuid;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nQuota := parameter ->>'nQuota';
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;

if not exists(select * from "UserSetting" where "nUserid" = nUserid and "nCaseid" = nCaseid)then
	insert into "UserSetting"("nCaseid" ,"nUserid","nQuota")
	values(nCaseid,nUserid,nQuota);
else
	update "UserSetting" set "nQuota" = nQuota where "nUserid" = nUserid and "nCaseid" = nCaseid;
end if;

OPEN ref1 FOR 
select 1 as msg,'Updated' as value;
RETURN NEXT ref1;

	 
END;
$function$
