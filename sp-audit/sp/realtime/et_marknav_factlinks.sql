CREATE OR REPLACE FUNCTION realtime.et_marknav_factlinks(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
   DECLARE nSesid uuid; nMasterid uuid; nBundledetailid uuid;
   BEGIN
   nSesid := NULLIF(parameter->>'nSesid','')::uuid;
   nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
   nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
   
	/*
			select * from realtime.et_marknav_factlinks ('{"nSesid":"79d6fa26-7d27-49a3-8204-1e128505b682","nMasterid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5","nBundledetailid":"8ff6724c-2057-4d9a-a0ef-e1e800387ca2"}','r1');fetch all in "r1";

			select * from realtime.et_marknav_factlinks ('{"nSesid":"f083ca63-1145-4711-aede-8d08a0260f68","nMasterid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5"}','r1');fetch all in "r1";

	select * from "FMLinks" where "nFSid" = 'aac31cad-bfea-4072-bc6e-f00111b64c0e'
	
	select * from "FMShared"
			
			
	select * from "FactMaster" order by "dCreateDt" desc

	f = aac31cad-bfea-4072-bc6e-f00111b64c0e
	s = 79d6fa26-7d27-49a3-8204-1e128505b682
	
	*/

if(nBundledetailid is not null) then

	open ref for 
		select f."nFSid",f."dCreateDt"
		from "FactMaster" f
		join "FMLinks" fl on fl."nFSid" = f."nFSid"
		left join "FMShared" fs on fs."nFSid" = f."nFSid" and fs."nUserid" = nMasterid
		where  (f."nUserid" = nMasterid or fs."nFMSdid" is not null) and fl."nBundledetailid" = nBundledetailid
		group by f."nFSid",f."dCreateDt";

else
-- select * from "FMShared"
	open ref for 
	select bd.*
	from "RSessionMaster" s
	join "BDAttributes" bt on bt."nSesid" = s."nSesid"
	join "BundleDetail" bd on bd."nBundledetailid" = bt."nBundledetailid"
	join "FMLinks" fl on fl."nBundledetailid" = bd."nBundledetailid"
	join "FactDetail" fd on fd."nFSid" = fl."nFSid"
	join "FactMaster" fm on fm."nFSid" = fd."nFSid"
	left join "FMShared" fs on fs."nFSid" = fm."nFSid" and fs."nUserid" = nMasterid
	--left join "BDPermission" p on p."nBundledetailid" = bt."nBundledetailid" and p."nUserid" = nMasterid
	where s."nSesid" = nSesid --and coalesce(p."nBDPid",'00000000-0000-0000-0000-000000000000')  = '00000000-0000-0000-0000-000000000000'
	and (fm."nUserid" = nMasterid or fs."nFMSdid" is not null);
	
/*
6a94da40-f9fc-4fd5-8c64-65fa7f9cf385

select * From "BDAttributes" where  "nBundledetailid" in ('6a94da40-f9fc-4fd5-8c64-65fa7f9cf385','6a94da40-f9fc-4fd5-8c64-65fa7f9cf385')
s= f083ca63-1145-4711-aede-8d08a0260f68

967fe973-8e11-465e-9320-a53a3164de6a
967fe973-8e11-465e-9320-a53a3164de6a

*/

end if;

	
       RETURN ref;
   END;
   
$function$
