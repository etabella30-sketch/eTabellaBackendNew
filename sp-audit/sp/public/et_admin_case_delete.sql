CREATE OR REPLACE FUNCTION public.et_admin_case_delete(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid;nCaseid uuid;

BEGIN

nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
/*
select * from et_admin_case_getdetail ('{""nCaseid"":0,""nMaster"":2}','refcursor'); FETCH All in ""refcursor"";

select * from "BundleMaster"
select * from "BundleDetail"

ALTER TABLE "Test2" ADD FOREIGN KEY ("t1id") REFERENCES "Test1"("t1id") ON DELETE CASCADE;

*/

if exists(select * from "UserMaster" where "nUserid" = nUserid and "isAdmin" = true)then 

			--INSERT INTO public."LogCaseMaster"("nLCatid", "nCaseid","cCasename", "cCaseno","nMasterid") 
			--select 45,"nCaseid","cCasename","cCaseno",nUserid from "CaseMaster" where "nCaseid" = nCaseid;
			
	
	delete from "CaseMaster" where "nCaseid" = nCaseid;

	delete from "RolePermission"  where "nCaseid" = nCaseid;

	open ref for 
	select 1 as msg,'Case deleted' as value;

else

	open ref for select  -1 as msg,'Admin rights required' as value;

end if;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
