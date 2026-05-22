CREATE OR REPLACE FUNCTION public.et_sidenav_task_fact(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
Declare nUserid uuid;nCaseid uuid;jFilter jsonb;variable text;
BEGIN
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
jFilter := parameter ->>'jFilter';

	-- select * from ""CaseMaster"" where ""nCaseid"" = 289
	open ref for
	
	
	select ic."nICid",case when "cCategory" is null then 'Unassign issue' else "cCategory" end,count(im."nIid") "issuecount" 
	from "RIssueMaster" im 	
	join "FMIssue" fi on im."nIid" = fi."nIssueid"
	join "FMTasks" ft on  fi."nFSid" = ft."nFSid"	
	left join "IssueCategory" ic on ic."nICid" = im."nICid"
	left join "TaskShared" ts on ts."nTaskid" = ft."nTaskid"
	where im."nCaseid" = nCaseid and im."nUserid" = nUserid
	group by ic."nICid";
	

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
