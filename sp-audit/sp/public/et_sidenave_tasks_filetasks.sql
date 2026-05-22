CREATE OR REPLACE FUNCTION public.et_sidenave_tasks_filetasks(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nCaseid uuid;
    sql_query TEXT;jFilter jsonb default '[]'::jsonb;
	filter_string text;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
jFilter := coalesce((parameter->>'jFilter')::jsonb,'[]'::jsonb);

	/*

select * From et_sidenave_tasks_filetasks('{"nMasterid":2,"nIssueid":110,"nCaseid":289}','r1','r2','r3');fetch all in "r1";fetch all in "r2";fetch all in "r3"

*/

filter_string := (select filter_whereclause(jFilter,'TSK'));
sql_query := ('select tm."nTaskid",tm."dCreateDt",td."cSubject",td."cDesc",td."jEmailnotify",td."nPriority",td."nProgress",
	td."jTimeline",td."cStatus",count(distinct bt."nBDTsid") as "nTotal",um."cFname",um."cLname",pr."cCodename" "cPriority",
	case when ts."nTaskid" is not null and ts."nUserid" = '''||nMasterid||'''::uuid then true else false end "isShared"
	from "TaskMaster" tm 
	join "TaskDetail" td on td."nTaskid" = tm."nTaskid"
	join "BDTasks" bt on bt."nTaskid" = tm."nTaskid"
	join "UserMaster" um on um."nUserid" = tm."nUserid"
	left join "Codemaster" pr on pr."nCodeid" = td."nPriority"
  	left join "FactMaster" fm on fm."nBundledetailid" = bt."nBundledetailid" and fm."nUserid" = '''|| nMasterid||'''::uuid			  
  	left join "FMContact" fc on fc."nFSid" = fm."nFSid" 
	left join "FMIssue" fi on fi."nFSid" = fm."nFSid"
	left join "RIssueMaster" im on im."nIid" = fi."nIssueid"
	left join "FactDetail" d on d."nFSid" = fm."nFSid"
	left join "TaskShared" ts on ts."nTaskid" = tm."nTaskid"
	where tm."nCaseid" = '''||nCaseid||'''::uuid and (bt."nUserid" = '''||nMasterid||'''::uuid or ts."nUserid" = '''||nMasterid||'''::uuid)
			    ' || (case when filter_string is not null then (' and (' || filter_string || ') ') else '' end)  || ' 
	group by tm."nTaskid",tm."dCreateDt",td."cSubject",td."cDesc",td."jEmailnotify",td."nPriority",td."nProgress",
	td."jTimeline",td."cStatus",um."cFname",um."cLname",pr."cCodename", ts."nTaskid", ts."nUserid";');

    RAISE NOTICE 'Filter String: %', sql_query;

open ref1 for EXECUTE sql_query;
			  
	/* open ref1 for

select  tm."nTaskid",tm."dCreateDt",td."cSubject",td."cDesc",td."jEmailnotify",td."nPriority",td."nProgress",
	td."jTimeline",td."cStatus",count(distinct bt."nBDTsid") as "nTotal",um."cFname",um."cLname",pr."cCodename" "cPriority"
	from "TaskMaster" tm 
	join "TaskDetail" td on td."nTaskid" = tm."nTaskid"
	join "BDTasks" bt on bt."nTaskid" = tm."nTaskid"
	join "UserMaster" um on um."nUserid" = tm."nUserid"
	left join "Codemaster" pr on pr."nCodeid" = td."nPriority"
	where bt."nUserid" = nMasterid and tm."nCaseid" = nCaseid
	group by  tm."nTaskid",tm."dCreateDt",td."cSubject",td."cDesc",td."jEmailnotify",td."nPriority",td."nProgress",
	td."jTimeline",td."cStatus",um."cFname",um."cLname",pr."cCodename";
	*/	
   	
	 
	 RETURN next ref1;
			 
	 -- select * from "FMTasks"
	 open ref2 for

select jsonb_agg(distinct tm."nTaskid") "jTaskid",ts."nUserid","cFname","cLname","cProfile"
		 from "TaskMaster" tm
	join "TaskShared" ts on ts."nTaskid" = tm."nTaskid"
	join "BDTasks" bt on bt."nTaskid" = tm."nTaskid"
	join "UserMaster" um on um."nUserid" = ts."nUserid"
		where (bt."nUserid" = nMasterid or ts."nUserid" = nMasterid) and tm."nCaseid" = nCaseid
		 group by ts."nUserid","cFname","cLname","cProfile";
	
	 
	 
	 RETURN next ref2;

	  open ref3 for 

	select tm."nTaskid",jsonb_agg(jsonb_build_object('nm',"nm",'value',value)) "jReminders"
		from "TaskMaster" tm
		join "TaskReminders" tr on tr."nTaskid" = tm."nTaskid"
	join "BDTasks" bt on bt."nTaskid" = tm."nTaskid"
	left join "TaskShared" ts on ts."nTaskid" = tm."nTaskid"
	where (bt."nUserid" = nMasterid or ts."nUserid" = nMasterid) and tm."nCaseid" = nCaseid
	 group by tm."nTaskid";

 RETURN next ref3;  
	 
END;
$function$
