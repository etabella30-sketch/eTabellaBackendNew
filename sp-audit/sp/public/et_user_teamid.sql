CREATE OR REPLACE FUNCTION public.et_user_teamid(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
   DECLARE nCaseid uuid;nMasterid uuid;
   
   -- select * from "FMIssue" limit 0
   BEGIN
   nCaseid := NULLIF(parameter->>'nCaseid','')::uuid;
   nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
   
     
       
       open ref for
	   select "nTeamid" from "TeamRelation" where "nCaseid" = nCaseid and "nUserid" = nMasterid ;
	   
       RETURN ref;
   END;
   
$function$
