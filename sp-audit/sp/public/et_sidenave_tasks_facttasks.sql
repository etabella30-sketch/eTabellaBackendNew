CREATE OR REPLACE FUNCTION public.et_sidenave_tasks_facttasks(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nCaseid uuid; nIssueid uuid;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nIssueid := NULLIF(parameter ->>'nIssueid','')::uuid;

    /*
select * from ""TaskMaster"" order by 1 desc
select * from ""TaskShared"" where ""nTaskid"" = 140
select * from ""FMTasks"" order by 1 desc
select * from ""FMIssue"" order by 1 desc    158
select * from et_sidenave_tasks_facttasks ('{""nCaseid"":289,""nIssueid"":167,""nMasterid"":59}','r1','r2','r3');fetch all in ""r1"";fetch all in ""r2"";fetch all in ""r3"";

*/
    open ref1 for
        select f."nFSid",tm."nTaskid",tm."dCreateDt",td."cSubject",td."cDesc",td."jEmailnotify",td."nPriority",td."nProgress",
    td."jTimeline",td."cStatus",tm."dUpdateDt",pr."cCodename" "cPriority",um."cFname",um."cLname",
	case when ts."nTaskid" is not null and ts."nUserid" = nMasterid then true else false end "isShared"
    from "FactMaster" f
    join "FMTasks" ft on ft."nFSid" = f."nFSid"
    join "FMIssue" fi on fi."nFSid" = ft."nFSid"
    join "TaskMaster" tm on tm."nTaskid" = ft."nTaskid"
    join "TaskDetail" td on td."nTaskid" = tm."nTaskid"
    join "UserMaster" um on um."nUserid" = tm."nUserid"
	LEFT JOIN "TaskShared" ts ON ts."nTaskid" =  tm."nTaskid"
	left join "Codemaster" pr on pr."nCodeid" = td."nPriority"
    where (f."nUserid" = nMasterid or ts."nUserid" = nMasterid ) and f."nCaseid" = nCaseid and fi."nIssueid" = nIssueid
    group by  f."nFSid", ts."nTaskid", tm."nTaskid",tm."dCreateDt",td."cSubject",td."cDesc",td."jEmailnotify",td."nPriority",td."nProgress",
    td."jTimeline",td."cStatus",tm."dUpdateDt",pr."cCodename",um."cFname" ,um."cLname", ts."nUserid";

     RETURN next ref1;
     -- select * from ""FMTasks""
     open ref2 for
    
    select jsonb_agg(ft."nTaskid") "jTaskid",ts."nUserid","cFname","cLname","cProfile"
    from  "FactMaster" f
    join "FMTasks" ft on ft."nFSid" = f."nFSid"
    join "FMIssue" fi on fi."nFSid" = ft."nFSid"
    join "TaskShared" ts on ts."nTaskid" = ft."nTaskid"
	LEFT JOIN "FMShared" fs ON fs."nFSid" = f."nFSid"
	left join "UserMaster" um on um."nUserid" = ts."nUserid"
    where (f."nUserid" = nMasterid or fs."nUserid" = nMasterid) and f."nCaseid" = nCaseid and fi."nIssueid" = nIssueid
     group by ts."nUserid","cFname","cLname","cProfile";
     
     
     RETURN next ref2;
     
      open ref3 for 
    select tr."nTaskid",jsonb_agg(jsonb_build_object('nm',"nm",'value',value)) "jReminders"
    from "TaskReminders" tr
    join "FMTasks" ft on ft."nTaskid" = tr."nTaskid"
    join "FactMaster" f on f."nFSid" = ft."nFSid"
    join "FMIssue" fi on fi."nFSid" = ft."nFSid"
	LEFT JOIN "FMShared" fs ON fs."nFSid" = f."nFSid"
    where (f."nUserid" = nMasterid or fs."nUserid" = nMasterid) and f."nCaseid" = nCaseid and fi."nIssueid" = nIssueid
    group by tr."nTaskid";
 RETURN next ref3;  
     
END;
$function$
