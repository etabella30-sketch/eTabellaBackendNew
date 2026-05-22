CREATE OR REPLACE FUNCTION realtime.et_fact_insert_issues(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
   DECLARE nFSid uuid;jIssues jsonb;
   
   -- select * from "FMIssue" limit 0
   BEGIN
   nFSid := NULLIF(parameter->>'nFSid','')::uuid;
   jIssues := parameter->>'jIssues';

   -- select * from public.et_fact_insert_issues_v2 ('{"nColorid":"f3de7dc9-4509-4583-a192-73db940bead4","jIssues":"[[\"f3de7dc9-4509-4583-a192-73db940bead4\",0,0]]","cFtype":"QF","cFFrom":"RT","nCaseid":"e0cd23d4-12fa-4b80-bdc0-88ec4287957b","jContacts":"[]","nMasterid":"7ee7a723-d96d-4d63-81c1-4dc4a2be4699","nFSid":"1bb8454a-64d3-43d0-8bba-afbaf3004b85"}','r1');fetch all in "r1";

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
