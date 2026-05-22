CREATE OR REPLACE FUNCTION realtime.et_manage_comments(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
   DECLARE nFSid uuid;nSesid uuid;cPermission text;nMasterid uuid;
   cMsg text;nCid uuid; nBundledetailid uuid;
   nDefaultSec int default 60;create_dt timestamp;
   BEGIN
   nCid := NULLIF(parameter->>'nCid','')::uuid;
   nFSid := NULLIF(parameter->>'nFSid','')::uuid;
   nSesid := NULLIF(parameter->>'nSesid','')::uuid;
   nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
   cPermission := parameter->>'cPermission';
   cMsg := parameter->>'cMsg';
   nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
	/*
select * from realtime.et_manage_comments ('{"cPermission":"N","cMsg":"dfsdd","nCid":"17017e35-cb39-4af6-b9bf-110bfdf7a95a","nFSid": "79d6fa26-7d27-49a3-8204-1e128505b682","nSesid":"00000000-0000-0000-0000-000000000000","nMasterid":"11111111-1111-1111-1111-111111111111"}','r1');fetch all in "r1";
	
	select * from realtime."Comments"

	alter table realtime."Comments" add column "nUserid" uuid

	*/

	if(cPermission = 'N') then
		if(trim(cMsg) != '')then
			insert into  realtime."Comments" ("nSesid","nFSid","cMsg","nUserid","nBundledetailid")
			values (nSesid,nFSid,cMsg,nMasterid, nBundledetailid)
			returning "nCid","dCreateDt" into nCid,create_dt;

			open ref for select 1 as msg,'Inserted' as value,nCid as "nCid",create_dt as "dCreateDt";
		else 
			open ref for select -1 as msg,'Enter Text' as value;
		end if;
	end if;

	if(cPermission = 'E')then
		if(trim(cMsg) != '')then
		
			if exists (select * from realtime."Comments" where "nCid" = nCid and nDefaultSec > EXTRACT(EPOCH FROM (now() - "dCreateDt")))then
				if exists (select * from realtime."Comments" c where c."nCid" = nCid and 
						not exists ( select * from  realtime."Comments" n where n."nFSid" = nFSid and  n."nCid" != c."nCid" and n."dCreateDt" > c."dCreateDt") limit 1
					)then
					
					update realtime."Comments" set "cMsg" = cMsg,"dUpdateDt" = now() where "nCid" = nCid;
					open ref for select 1 as msg,'Update' as value,now() as "dUpdateDt", nCid as "nCid";
					
				else 
					open ref for select -1 as msg,'Comment not editable becouse new comment' as value;
				end if;
			else 
				open ref for select -1 as msg,'Comment not editable' as value;
			end if;
			
		else 
			open ref for select -1 as msg,'Enter Text' as value;
		end if;
	end if;

	if(cPermission = 'D')then
		update realtime."Comments" set "dDelDt" = now() where "nCid" = nCid;
		open ref for select 1 as msg,'Deleted' as value;
	end if;	
	   
       RETURN ref;
   END;
   
$function$
