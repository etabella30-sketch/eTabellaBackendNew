CREATE OR REPLACE FUNCTION public.et_getfact_annotation(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

declare nFSid uuid;nUserid uuid;

BEGIN
-- select * from "TagMaster" where "nCaseid" = 22 and "nUserid" = 59
nFSid := NULLIF(parameter ->>'nFSid','')::uuid;
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
-- select * from et_tag_list('{"nCaseid":22,"nMasterid":2}','r1','r2');fetch all in "r1"

open ref1 for 

select *
From "Annotations" t where "nFSid" = nFSid
;

 RETURN next ref1;    
 
 
 
 
 
    END;
$function$
