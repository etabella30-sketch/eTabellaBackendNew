CREATE OR REPLACE FUNCTION public.et_fact_get_issue(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFSid uuid; nMasterid uuid;
-- select * from ""FactMaster"" limit 0
-- select * from ""FMLinks"" order by 1 desc limit 1
-- select * from ""RIssueMaster"" order by 1 desc limit 1
-- update ""FactDetail"" f set ""nColorid"" = a.""colorid"" from ""Annotations"" a where a.""nFSid"" = f.""nFSid""

BEGIN
nFSid := NULLIF(parameter->>'nFSid','')::uuid;
nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;

	
	open ref for
   	
	 -- select * from ""FMIssue""
	 select fi."nFSid",fi."nFMIid",fi."nIssueid",issue."cIName",fi."nImpactid",imp."cCodename" "cImpect",fi."nRelevanceid",rel."cCodename" "cRelevance" from "FMIssue" fi
	join "RIssueMaster" issue on issue."nIid" = fi."nIssueid"
	left join "Codemaster" imp on imp."nCodeid" = fi."nImpactid"
	left join "Codemaster" rel on rel."nCodeid" = fi."nRelevanceid"
	 where fi."nFSid"  = nFSid;
	 
	 
	 RETURN ref;
	 
END;
$function$
