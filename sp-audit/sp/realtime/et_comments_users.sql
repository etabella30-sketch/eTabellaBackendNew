CREATE OR REPLACE FUNCTION realtime.et_comments_users(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
   DECLARE nFSid uuid;
   BEGIN
   nFSid := NULLIF(parameter->>'nFSid','')::uuid;
   
	/*
select * from realtime.et_comments_users ('{"cPermission":"E","cMsg":"dfsdd","nCid":"17017e35-cb39-4af6-b9bf-110bfdf7a95a","nFSid": "79d6fa26-7d27-49a3-8204-1e128505b682","nSesid":"00000000-0000-0000-0000-000000000000","nMasterid":"11111111-1111-1111-1111-111111111111"}','r1');fetch all in "r1";

		select * from realtime."Comments"

	*/
	open ref for 
	
		select c."nUserid",u."cFname",u."cLname",u."cProfile"
		from realtime."Comments" c 
		join "UserMaster" u on u."nUserid" = c."nUserid"
		where c."nFSid"= nFSid and c."dDelDt" is null 
		
		group by c."nUserid",u."cFname",u."cLname",u."cProfile";

	   
       RETURN ref;
   END;
   
$function$
