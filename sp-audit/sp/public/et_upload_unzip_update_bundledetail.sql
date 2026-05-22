CREATE OR REPLACE FUNCTION public.et_upload_unzip_update_bundledetail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
Declare nJobid uuid;jFiles jsonb;cIsFinal text;
BEGIN

nJobid := NULLIF(parameter ->>'nJobid','')::uuid;
jFiles := parameter ->>'jFiles';
cIsFinal := parameter ->>'cIsFinal';

update "BundleDetail" b set 
"cStatus" = (case  when (t."status" = false  ) then 'V' else 'C' end ),
"cFilesize" = t."totalsizeoffile",
"cPage" = case when coalesce(t."totalpages",'0') = '0' then null else  ( '1-' || t."totalpages") end ,
"cFiletype" = upper(coalesce(split_part(b."cPath",'.',-1),'')) --,
--"pagerotation" = t."pagerotation"
from jsonb_to_recordset(jFiles) as t("nBundledetailid" uuid,"status" boolean,"isValidate" boolean,"totalpages" text,"totalsizeoffile" text,"cSnap" text,"pagerotation" text)
where b."nBundledetailid" = t."nBundledetailid" ;

update "BDAttributes" b set "pagerotation" = t."pagerotation"
from jsonb_to_recordset(jFiles) as t("nBundledetailid" uuid,"pagerotation" text)
where b."nBundledetailid" = t."nBundledetailid" ;

if(cIsFinal = 'Y')then
	update "JobMaster" set "cStatus" = 'C' where "nJobid" = nJobid;
end if;

open ref for
select 1 as msg;

 RETURN ref;                                                       -- Return the cursor to the caller
END;
$function$
