CREATE OR REPLACE FUNCTION public.et_fact_insert_issues(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
   DECLARE nFSid uuid;jIssues jsonb;
   
   -- select * from "FMIssue" limit 0
   BEGIN
   nFSid := NULLIF(parameter->>'nFSid','')::uuid;
   jIssues := parameter->>'jIssues';
   
       delete from "FMIssue" where "nFSid" = nFSid;
       -- select * from "FMIssue"

	   
       insert into "FMIssue" ("nFSid","nIssueid","nImpactid","nRelevanceid")	
       SELECT distinct nFSid,(i->>0)::uuid,coalesce((i->>1)::int,0),coalesce((i->>2)::int,0)  from jsonb_array_elements(jIssues) AS i 
	   where 
	   not exists 
	   (select * from "FMIssue" f where f."nFSid" = nFSid and f."nIssueid" = (i->>0)::uuid   );
       
       
       open ref for select 1 msg;
       RETURN ref;
   END;
   
$function$
