CREATE OR REPLACE FUNCTION public.et_insert_recent_file(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

DECLARE
    nBDid UUID;
    nMasterid UUID;
    cType CHAR(1);
BEGIN
    -- Extract parameters from the JSON input
    nBDid := NULLIF(parameter ->> 'nBDid', '')::UUID;
    nMasterid := NULLIF(parameter ->> 'nMasterid', '')::UUID;
    cType := COALESCE(NULLIF(parameter ->> 'cType', ''), 'M');

if exists(select * from "RecentFiles" where "nBDid" = nBDid and "nUserid" = nMasterid and "cType" = cType) then
		update "RecentFiles" set "dCreateDt" = now() where "nBDid" = nBDid and "nUserid" = nMasterid and "cType" = cType;
	else
		insert into "RecentFiles"("nBDid","nUserid","dCreateDt", "cType")
		values (nBDid,nMasterid,now(), cType);
	end if;

    	open ref for 
		select 1 as msg,'file inserted. ' as value;

        

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
