CREATE OR REPLACE FUNCTION public.et_navigate_task_facts(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

declare 
    nMasterid uuid;
    nBundledetailid uuid;
    isAdmin boolean;
    cSortby text;
    cSorttype text;
    pageNumber int;
    offsetCount int;
    perPage int := 10;
    docids uuid[];

BEGIN
    nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
    nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
    cSorttype := parameter->>'cSorttype';
    cSortby := parameter->>'cSortby';
    pageNumber := COALESCE((parameter->>'nPageNumber')::int, 1);
    offsetCount := (pageNumber - 1) * perPage;

/*
select * from et_navigate_task_facts ('{""nBundledetailid"":555366,""cTasktype"":""FT"",""nMasterid"":2}','r1','r2','r3');
fetch all in ""r1"";fetch all in ""r2"";fetch all in ""r3"";
select * from ""FactMaster"" order by 1 desc
select * from ""FMShared"" order by 1 desc
*/

open ref1 for 
	select f."nFSid",fd."jLinktype",
	t."nTaskid",t."nUserid" "nCreateId",td."cSubject",td."cDesc",td."nPriority",
	td."nProgress",td."jTimeline" ,pr."cCodename" "cPriority"
	from "FactMaster" f 
	join "FactDetail" fd on fd."nFSid" = f."nFSid"
	join "FMTasks" fmt on fmt."nFSid" = f."nFSid"
	join "TaskMaster" t on t."nTaskid" = fmt."nTaskid"
	join "TaskDetail" td on td."nTaskid" = t."nTaskid"
	left join "Codemaster" pr on pr."nCodeid" = td."nPriority" 
	left join "TaskShared" ts on ts."nTaskid" = t."nTaskid" 
	where f."nBundledetailid" = nBundledetailid and f."nUserid" = nMasterid 
	group by f."nFSid",fd."jLinktype",
	t."nTaskid",t."nUserid",td."cSubject",td."cDesc",td."nPriority",
	td."nProgress",td."jTimeline",pr."cCodename" order by f."nFSid" desc;

RETURN next ref1;     

open ref2 for 
	
select jsonb_agg(t."nTaskid") as "jTaskids",
	u."cFname",u."cLname",u."cEmail",u."cProfile"
	from "FactMaster" f
	join "FMTasks" t on t."nFSid" = f."nFSid"
	join "TaskShared" s on s."nTaskid" = t."nTaskid"
	join "UserMaster" u on u."nUserid" = s."nTaskid"
	where f."nBundledetailid" = nBundledetailid and f."nUserid" = nMasterid
	group by u."cFname",u."cLname",u."cEmail",u."cProfile" ;
	
RETURN next ref2;

/* 
select * from ""FMIssue""
select * from ""FMTasks""
select * from ""RIssueMaster""
*/
open ref3 for 
	select jsonb_agg(distinct t."nTaskid") as "jTaskids",fi."nIssueid",i."cColor",i."cIName",fi."nImpactid",
		imp."cCodename" "cImpact",fi."nRelevanceid",rel."cCodename" "cRelevance" ,i."nICid",ic."cCategory"
	From "FactMaster" f
	join "FMTasks" t on t."nFSid" = f."nFSid"
	join "FMIssue" fi on fi."nFSid" = f."nFSid"
	join "RIssueMaster" i on i."nIid" = fi."nIssueid"
	join "IssueCategory" ic on ic."nICid" = i."nICid"
	left join "Codemaster" imp on imp."nCodeid" = fi."nImpactid"
	left join "Codemaster" rel on rel."nCodeid" = fi."nRelevanceid"
	where f."nBundledetailid" = nBundledetailid and f."nUserid" = nMasterid
	group by fi."nIssueid",i."cColor",i."cIName",fi."nImpactid",
		imp."cCodename",fi."nRelevanceid",rel."cCodename" ,i."nICid",ic."cCategory";
	
RETURN next ref3;

    END;
$function$
