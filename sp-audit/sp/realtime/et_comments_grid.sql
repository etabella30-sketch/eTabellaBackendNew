CREATE OR REPLACE FUNCTION realtime.et_comments_grid(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
   DECLARE nFSid uuid;nCid uuid;
   BEGIN
   nFSid := NULLIF(parameter->>'nFSid','')::uuid;
   nCid := NULLIF(parameter->>'nCid','')::uuid;
   
	/*
select * from realtime.et_comments_grid ('{"cPermission":"E","cMsg":"dfsdd","nCid":"17017e35-cb39-4af6-b9bf-110bfdf7a95a","nFSid": "79d6fa26-7d27-49a3-8204-1e128505b682","nSesid":"00000000-0000-0000-0000-000000000000","nMasterid":"11111111-1111-1111-1111-111111111111"}','r1');fetch all in "r1";

		select * from realtime."Comments"

	*/
	open ref for 
	
		select c."nFSid",c."nSesid",c."nCid",c."cMsg",c."dCreateDt",
		c."dUpdateDt",c."nUserid",u."cFname",u."cLname",u."cProfile",(now() at time zone 'Asia/Kolkata') as "todate"
		from realtime."Comments" c 
		join "UserMaster" u on u."nUserid" = c."nUserid"
		where c."nFSid"= nFSid and c."dDelDt" is null and 
		case when nCid is not null then c."nCid" = nCid else true end
		order by c."dCreateDt" asc;

	   
       RETURN ref;
   END;
   
$function$
