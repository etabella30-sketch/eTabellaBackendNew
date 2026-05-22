CREATE OR REPLACE FUNCTION task.et_report_tasks_files(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE 
	nTid uuid;
	nRid uuid;
    nPageno INT;
    nBatchsize INT default 10;
    nOffset INT;
	cType text;jFiles jsonb;
BEGIN

nTid := NULLIF(parameter ->>'nTid','')::uuid;
nRid := NULLIF(parameter ->>'nRid','')::uuid;
cType := parameter ->>'cType';
nPageno := (parameter ->>'nPageno')::INTEGER;
jFiles := (parameter ->>'jFiles');
nOffset := (nPageno - 1) * nBatchsize;

/*
SELECT * FROM task.et_report_tasks_files('{"nTid": 4,"nPageno":1,"nRid":2,"cType":"F"}', 'r1');FETCH ALL IN "r1";

 -- ALL/P/I/F/C 

select * from task."TaskMaster" order by 1 desc

select * from task."TaskRemarks"

select * from task."TaskDetail" t
join task."TaskRemarkDetail" d on d."nTDid" =t."nTDid"
where "nTid" = 5 and "nRid" = 3 and "nStatus" is null

select * from task."TaskRemarkDetail" order by "dCreateDt"
alter table task."TaskRemarkDetail" add column "dCreateDt" timestamp

select * from "BundleDetail" where "nBundledetailid" = 154566

 select * from task.et_report_tasks_files ('{"nTid":5,"nRid":3,"nPageno":1,"cStatus":"P","cType":"P","nMasterid":366,"jFiles":"[154566]"}','r1');fetch all in "r1";

 select * from task.et_report_tasks_files ('{"nTid":5,"nRid":3,"nPageno":1,"cStatus":"P","cType":"I","nMasterid":366,"jFiles":"[154566]"}','r1');fetch all in "r1";
*/

    OPEN ref FOR 
		select t."nTDid",b."nBundledetailid",b."cTab",b."cExhibitno",b."cFilename",b."cFilesize",r."dStartDt",
		r."dEndDt",coalesce(r."nStatus",case when tm."cStatus" = 'C' then 2::smallint else 0::smallint end) as "nStatus"
		from task."TaskDetail" t
		join task."TaskMaster" tm on tm."nTid" = t."nTid"
		join "BundleDetail" b on b."nBundledetailid" = t."nBDid"
		join task."TaskRemarkDetail" r on r."nRid" = nRid and r."nTDid" = t."nTDid"
		where ( jsonb_array_length( coalesce(jFiles,'[]'::jsonb) )=0 and t."nTid" = nTid  
		and  case coalesce(cType,'ALL') when 'ALL' then true 
										--when 'P' then coalesce("nStatus",0) = 0 
										--when 'I' then coalesce("nStatus",0) = 0 
										when 'F' then coalesce("nStatus",0) = 2
										when 'C' then coalesce("nStatus",0) = 1 
		end and cType not in ('P','I') )
		or 
		( cType = 'I' and jsonb_array_length(coalesce(jFiles,'[]'::jsonb))>0 and t."nTid" = nTid  
		and jFiles @> to_jsonb(t."nBDid")
		)
		or
		(
		cType = 'P' and t."nTid" = nTid  and coalesce("nStatus",0) = 0 
			and (coalesce(jFiles,'[]'::jsonb) @> to_jsonb(t."nBDid")) = false
		)
										
    	ORDER BY r."dCreateDt" asc
		LIMIT nBatchsize OFFSET nOffset;

    RETURN ref; -- Return the cursor
END;
$function$
