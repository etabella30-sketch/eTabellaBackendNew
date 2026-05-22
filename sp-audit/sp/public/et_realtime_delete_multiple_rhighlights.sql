CREATE OR REPLACE FUNCTION public.et_realtime_delete_multiple_rhighlights(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nSessionid uuid;nUserid uuid;jHids jsonb;
BEGIN
nUserid := NULLIF(parameter->>'nUserid','')::uuid;
jHids :=parameter->>'jHids';
/*
 select * from "RSessionDetail" order by 1 desc

select * from et_realtime_delete_multiple_rhighlights ('{""nSessionid"":58,""nUserid"":2,""nCaseid"":22,""cDefHIssues"":[{""nIid"":77},{""nIid"":32}],""nLID"":77,""jHids"":""[1918,1919,1920]""}','r1');fetch all in ""r1"";

truncate table "RHighlights" restart identity CASCADE;
truncate table "RHighlightMapid" restart identity;

*/

   
		delete from "RHighlightMapid" where jHids @> to_jsonb("nHid");
		delete from "RHighlights" where jHids @> to_jsonb("nHid");
	
	
	  
    OPEN ref FOR
		select 1 msg,'Deleted' message;
		  
		  
		 

    RETURN ref;
END;
$function$
