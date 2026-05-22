CREATE OR REPLACE FUNCTION realtime.history_marknav(nsesid uuid, nbundledetailid uuid, nuserid uuid, ctype text, pageno integer)
 RETURNS TABLE(id uuid, type text)
 LANGUAGE plpgsql
AS $function$
declare offsetCount int;perPage int default 20;

BEGIN

offsetCount := (pageno - 1) * perPage;

-- alter table realtime."MarkNavHistory" add column "nBundledetailid" uuid
-- 
/*
select * from realtime."MarkNavHistory"
select * From realtime.history_marknav('',null,)

select * from realtime.history_marknav('79d6fa26-7d27-49a3-8204-1e128505b682', null,'7ee7a723-d96d-4d63-81c1-4dc4a2be4699', 'ALL', 1 )

*/

return query 
	--select null as id, 'f' as type;

	select 
	
	(case ctype  when 'ALL' then 
	coalesce("nFSid"::uuid,coalesce("nHid"::uuid,"nDocid"::uuid))
	when 'F' then "nFSid"::uuid 
	when 'QF' then "nFSid"::uuid 
	when 'QM' then "nHid"::uuid 
	when 'D' then "nDocid"::uuid 
	when 'FL' then "nFSid"::uuid end)
	as "id", "cType"::text as "type" 
	From realtime."MarkNavHistory"
	where ("nSesid" = nsesid or "nBundledetailid" = nbundledetailid) and
	"nUserid" = nuserid and 
	case ctype  when 'ALL' then true
	when 'F' then  ("nFSid" is not null and "cType" = 'F') 
	when 'QF' then ("nFSid" is not null and "cType" = 'QF')
	when 'QM' then "nHid" is not null 
	when 'D' then "nDocid" is not null
	when 'FL' then ("nFSid" is not null and "cType" = 'FL')
	else false
	end 
	order by "dCreateDt" desc
	LIMIT perPage
	OFFSET offsetCount;
	
	
END;
$function$
