CREATE OR REPLACE FUNCTION public.et_tag_list(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nUserid uuid;
alltags uuid[];

BEGIN
-- select * from "TagMaster" where "nCaseid" = 22 and "nUserid" = 59
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
-- select * from et_tag_list('{"nCaseid":22,"nMasterid":2}','r1','r2');fetch all in "r1"

alltags = (array (
	 select "nTagid" from "TagMaster" t
	where t."nCaseid" = nCaseid and t."nUserid" = nUserid and t."nParenttagid" IS NULL
));

open ref1 for 

select t."nTagid",t."cTag",t."cClr",t."cDesc",t."nParenttagid"
From "TagMaster" t where "nTagid" = any(alltags)
;

--select * from bundles where "nCaseid" = nCaseid and "nFolderid" = nFolderid;

 RETURN next ref1;    
 
 
open ref2 for 
select "nTagid","cTag","cClr","cDesc","nParenttagid" from "TagMaster" 
where "nParenttagid" = any(alltags)
;

--select * from bundles where "nCaseid" = nCaseid and "nFolderid" = nFolderid;

 RETURN next ref2;   -- Return the cursor to the caller
 
 
 
 
    END;
$function$
