CREATE OR REPLACE FUNCTION public.et_realtime_get_export_annotations(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nSessionid uuid;
cIssueIds text;
nPageFrom int;
nPageTo int;
nUserid uuid;
BEGIN
nSessionid := NULLIF(parameter ->>'nSessionid', '')::uuid;
cIssueIds := parameter ->>'cIssueIds';
nPageFrom := (parameter ->>'nPFrom')::int;
nPageTo := (parameter ->>'nPTo')::int;
nUserid := NULLIF(parameter ->>'nUserid', '')::uuid;
nPageFrom = coalesce(nPageFrom,0);
nPageTo = coalesce(nPageTo,0);

IF cIssueIds IS NULL OR cIssueIds = '' OR cIssueIds = '0' THEN
 select string_agg("nIDid"::text,',') into cIssueIds from "RIssueDetail" where "nSessionid" = nSessionid;
 
END if;

    -- Open the ref cursor with a select statement
    OPEN ref FOR
	

		select "jTCordinates","cTPageno" From "RIssueDetail" rid
		join (select * From (select unnest(string_to_array(cIssueIds, ','))::uuid AS "nIDid")) i on i."nIDid" = rid."nIDid"
		where "nSessionid" = nSessionid
		AND (
		(nPageFrom > 0 AND nPageTo > 0 AND "cPageno"::int BETWEEN nPageFrom AND nPageTo)
		OR
		(nPageFrom <= 0 OR nPageTo <= 0)
	  ) and "jTCordinates" is not null;
		
		

 
  

    RETURN ref;
END;
$function$
