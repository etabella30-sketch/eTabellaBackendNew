CREATE OR REPLACE FUNCTION public.et_batchfile_columns(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
-- select * from "BundleDetail" 
declare nUserid uuid;nCaseid uuid;nSectionid uuid;
cColumn text;
-- select * from "et_batchfile_getdata"('{""nMasterid"":59,""nCaseid"":127,""nSectionid"":703}','r');fetch all in "r"
BEGIN
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
-- select * from "Batchlog"

open ref for
select "cColumn" from "Batchlog" where "nCaseid" = nCaseid and "nSectionid" = nSectionid and "nCreateId" = nUserid order by "nBlogid" desc limit 1;

  
   return ref;-- Return the cursor to the caller
    END;
$function$
