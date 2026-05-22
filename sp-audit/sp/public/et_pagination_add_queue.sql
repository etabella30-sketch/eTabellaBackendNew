CREATE OR REPLACE FUNCTION public.et_pagination_add_queue(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nPtaskid uuid;nQPtaskid uuid;
-- truncate table "Paginationtask" restart identity
BEGIN
nPtaskid := NULLIF(parameter ->>'nPtaskid','')::uuid;
nQPtaskid:= NULLIF(parameter ->>'nQPtaskid','')::uuid;
-- select * from "Paginationtask"
	update "Paginationtask" set "nQPtaskid" = nQPtaskid where "nPtaskid" = nPtaskid;
	
	

open ref for
select 1 as msg;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
