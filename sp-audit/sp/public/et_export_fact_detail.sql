CREATE OR REPLACE FUNCTION public.et_export_fact_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid;nFSid uuid;
fact_detail jsonb;issue_ls jsonb;task_ls jsonb;contact_ls jsonb;
filelist jsonb;user_list jsonb;bundle_detail jsonb;
nBundledetailid uuid;
BEGIN
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nFSid := NULLIF(parameter ->>'nFSid','')::uuid;
-- select * from et_export_fact_detail ('{"nFSid":1,"nMasterid":2}','refcursor'); FETCH All in "refcursor";

-- select * From "FactMaster"
-- select * From "IssueMaster"
-- select * From "TaskMaster"
-- select * From "BundleDetail"

nBundledetailid := (select "nBundledetailid" from "FactMaster" where "nFSid" = nFSid);

select jsonb_agg(t) into bundle_detail from (
select "nBundledetailid","nBundleid","cTab","cExhibitno","cFilename","cPath","cPage"
from "BundleDetail" where "nBundledetailid" = nBundledetailid
)t;
-- select * from "FactDetail"
select jsonb_agg(t) into fact_detail from (
select f."nFSid",fd."nTZid",b."cPage",fd."cFact",fd."jDate",c."cCodename" as "cTimezone",
ft."cCodename" as "cFiletype" ,s."cCodename" as "cStatus",fd."jTexts",fd."nStatus",
fd."nFiletype",fd."cType",fd."jLinktype","cTooltype",f."nBundledetailid",bm."cBundletag"
From "FactMaster" f
join "FactDetail" fd on fd."nFSid" = f."nFSid"
join "BundleDetail" b on b."nBundledetailid" = f."nBundledetailid"
left join "BundleMaster" bm on bm."nBundleid" = b."nBundleid"
left join "Codemaster" c on c."nCodeid" = fd."nTZid"
left join "Codemaster" ft on ft."nCodeid" = fd."nFiletype"
left join "Codemaster" s on s."nCodeid" = fd."nStatus"
where f."nFSid" = nFSid  --and f."nUserid" =  
)t;
-- select * from "RIssueMaster"
select jsonb_agg(t) into issue_ls from (
	select ic."nICid",ic."cCategory",jsonb_agg(distinct im) as "sublist"
	from "IssueCategory" ic
	join (
	select i."nIssueid",i."nImpactid",i."nRelevanceid",im."nICid",im."cIName" "cIssue",im."cColor" "cClr",r."cCodename" as "cRelevance",
	imp."cCodename" as "cImpact"--,imp."cImg" as "cImpimg"
	from "FactMaster" f 
	join "FMIssue" i on i."nFSid" = f."nFSid"
	join "RIssueMaster" im on im."nIid" = i."nIssueid"
	left join "Codemaster" r on r."nCodeid" = i."nRelevanceid" 
	left join "Codemaster" imp on imp."nCodeid" = i."nImpactid"
	where f."nFSid" = nFSid 
	) im on im."nICid" = ic."nICid"
	group by ic."nICid",ic."cCategory" 
)t;

-- select * From "tasks"

-- select * From "IssueMaster"
/*
select jsonb_agg(t) into task_ls from (
	select t."nTaskid",tm."cSubject",tm."cDesc",tm."jUsers",tm."jEmailnotify",tm."nClaimid",tm."nPriority",
	tm."nProgress",tm."jTimeline",tm."jReminder",c."cPriority",c."cImg",
	tm."teamlist",tm."cClr",tm."cImpimg",tm."cImpact",tm."cRelevance",tm."cIssue"
	from "FactMaster" f
	join "FMTasks" t on t."nFSid" = f."nFSid"
	join tasks tm on tm."nTaskid" = t."nTaskid"
	left join "PriorityMaster" c on c."nPriorityid" = tm."nPriority"
	where f."nFSid" = nFSid --and tm."dDelDt" is null
)t;

select jsonb_agg(t) into contact_ls from (
	select cm."nContactid",cm."nCaseid",cm."cProfile",cm."cFname",cm."cLname",cm."cAlias",cm."cLinkedin",cm."cEmail",
	cm."cCountrycode",cm."cMobile",cm."nTZid",cm."nRoleid",cm."nCompanyid",cm."cNote",tz."cCodename" as "cTimezone",
	cr."cRole",cc."cCompany"
	from "FactSheet" f,jsonb_populate_recordset(null::record,"jContact") as c("nContactid" int) 
	join "ContactMaster" cm on cm."nContactid" = c."nContactid"
	left join "Codemaster" tz on tz."nCodeid" = cm."nTZid" 
	left join "ContactRole" cr on cr."nCRoleid" = cm."nRoleid"
	left join "ContactCompany" cc on cc."nCompanyid" = cm."nCompanyid"
	where f."nFSid" = nFSid and cm."dDelDt" is null
)t;

*/
-- select * From "UserMaster"
-- select  * from "FactSheet"

open ref for 
select fact_detail,issue_ls,task_ls,contact_ls,filelist,user_list,bundle_detail
;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
