CREATE OR REPLACE FUNCTION realtime.et_getfact_annotation(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

declare nFSid uuid;nUserid uuid;

BEGIN
-- select * from "Annotations" limit 1
nFSid := NULLIF(parameter ->>'nFSid','')::uuid;
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
-- select * from et_tag_list('{"nCaseid":22,"nMasterid":2}','r1','r2');fetch all in "r1"

open ref1 for 

select colorid color,"jOT" "fullText",t."nFSid" id,true "isTemp",rects "jCordinates",'F' linktype,"page" page,rects "rects",type,uuid,width
From "Annotations" t 
join "FactDetail" fd on t."nFSid"= fd."nFSid"
where t."nFSid" = nFSid
;

 RETURN next ref1;    
 
 
 
 
 
    END;
$function$
