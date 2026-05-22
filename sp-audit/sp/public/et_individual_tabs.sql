CREATE OR REPLACE FUNCTION public.et_individual_tabs(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;jFiles jsonb;
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jFiles := parameter ->>'jFiles';

open ref for
select b."nBundledetailid",b."cFilename",b."cPath" as "originalPath",false as "isLoaded","cIsindex",
       b."cTab"
from "BundleDetail" b
left join "BDPermission" p on p."nUserid" = nMasterid and p."nBundledetailid" = b."nBundledetailid"
where p."nBDPid" is null and jFiles @> to_jsonb(b."nBundledetailid")
order by b."cFilename";

RETURN ref;
END;
$function$
