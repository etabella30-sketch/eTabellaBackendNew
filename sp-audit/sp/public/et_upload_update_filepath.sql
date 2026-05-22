CREATE OR REPLACE FUNCTION public.et_upload_update_filepath(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

Declare nJobid uuid;jFiles jsonb;
BEGIN

nJobid := NULLIF(parameter ->>'nJobid','')::uuid;
jFiles := parameter ->>'jFiles';

update "BundleDetail" b set 
"cFilename" = t."cFilename",
"cPath" = t."cPath" ,
"cFiletype" = upper(coalesce(split_part(b."cPath",'.',-1),'')) 
from jsonb_to_recordset(jFiles) as t("nBundledetailid" uuid,"cFilename" text,"cPath" text)
where b."nBundledetailid" = t."nBundledetailid" ;

open ref for
select 1 as msg;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
