CREATE OR REPLACE FUNCTION public.et_realtime_get_annotation_by_session_v2(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nSessionid uuid;
BEGIN
nSessionid := NULLIF(parameter->>'nSessionid','')::uuid;
 	
    OPEN ref FOR
				select f."nFSid" as "nId",f."nUserid",d."jCordinates", f."cFType" as "cType",d."jOT" as "cONote",
				d."nTPage" as "cPageno"
				from "FactMaster" f 
				join "FactDetail" d on d."nFSid" = f."nFSid"
				where f."nSesid" = nSessionid and "jCordinates" is not null  -- and d."nPage" >= cPageno
				union all
				select d."nDocid" as "nId",d."nUserid",	dt."jCordinates",'D' as "cType",dt."jOText" as "cONote",
			dt."nTPage" as "cPageno"
				from "DocMaster" d
				join "DocDetail" dt on dt."nDocid" = d."nDocid"
				where d."nSesid" = nSessionid and "jCordinates" is not null   --and dt."nPage" >= cPageno
				;

/*
 
select * from "FactDetail" f

select * from "DocDetail"

select * from "FactMaster" f
join "FactDetail" d on d."nFSid" = f."nFSid"
where  f."nSesid" = '02cbb86c-7b37-4881-83d3-8612c88e32e7'

SELECT * FROM et_realtime_get_annotation_by_session_v2('{"nSessionid":"02cbb86c-7b37-4881-83d3-8612c88e32e7"}', 'ref'); fetch all in ref;
*/

	-- select * from "FactDetail"
    	/*    	select  "nIDid","cONote","jCordinates", "cPageno" 
		From  "RIssueDetail" 
		where "nSessionid" = nSessionid and coalesce("cONote",'') !=''
		and "jTCordinates" is null 
		and "jCordinates" is not null 
		--and  "bTrf" = false
--and "dCreatedt"::date = now()::date
		--and "nIDid" in(699, 700)
		order by "nIDid";    */

    RETURN ref;
END;
$function$
