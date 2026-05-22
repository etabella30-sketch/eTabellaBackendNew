CREATE OR REPLACE FUNCTION public.et_fact_permissions(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nUserid UUID;
	nFSid uuid;

	
	isAdmin boolean default false;
	nRoleid uuid;nCaseid uuid;
BEGIN
    nFSid := NULLIF(parameter ->> 'nFSid','')::UUID;
    nUserid := NULLIF(parameter ->> 'nUserid','')::UUID;

	isAdmin := case when exists (select * from "UserMaster" where "nUserid" = nUserid and "isAdmin" = true )  then true  else false  end;
	
	select "nCaseid" into nCaseid from "FactMaster" where "nFSid" = nFSid;

	
	select "nRoleid" into nRoleid  from "TeamRelation" where "nUserid" = nUserid and "nCaseid" = nCaseid limit 1;
	if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then 
		isAdmin := true;
	end if;

    OPEN ref FOR
        SELECT f."nFSid",f."nUserid",
		case when (f."nUserid" = nUserid or isAdmin) then true else s."bCanComment" end "bCanComment",
		case when (f."nUserid" = nUserid  or isAdmin) then true else s."bCanEdit" end "bCanEdit",
		case when (f."nUserid" = nUserid  or isAdmin) then true else s."bCanReshare" end "bCanReshare",
		case when (f."nUserid" = nUserid  or isAdmin) then true else s."nFSid" is not null end "bCanView"
		from "FactMaster" f
		left join "FMShared" s on s."nFSid" = f."nFSid" and s."nUserid" = nUserid
		where f."nFSid" = nFSid; --and "nUserid" = nUserid;

		
    RETURN ref;
END;
$function$
