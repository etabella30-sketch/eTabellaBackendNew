CREATE OR REPLACE FUNCTION public.et_excel_bundle_batch(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
-- select * from "BundleDetail" 
declare nUserid uuid;nCaseid uuid;nFolderid uuid;bundlelist jsonb;tablelist jsonb;cCasename text;

BEGIN
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nFolderid:= NULLIF(parameter ->>'nFolderid','')::uuid;
nUserid:= NULLIF(parameter ->>'nUserid','')::uuid;
-- select * from "Folders" where "nCaseid" = 63 order by 1 desc
-- select * from et_excel_bundle_batch ('{"nCaseid":63,"nFolderid":377,"nUserid":10}','refcursor'); FETCH All in "refcursor";
-- select * from "Folders" where "nCaseid" = 22
select "cCasename" into cCasename from "CaseMaster" where "nCaseid" = nCaseid;

select jsonb_agg(t  order by  left(array_to_string("sub_info",''), 1),substring(array_to_string(sub_info,''), '\D+'),substring(array_to_string(sub_info,''), '\D+'),
  substring(array_to_string("sub_info",''), '\d+')::bigint NULLS FIRST,array_to_string(sub_info,',')) into bundlelist from (
 select b."nBundleid",b."nParentBundleid",REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(b."cBundlename", '/', ''), '\', ''),'\"',''),':',''),'?',''),'<',''),'>',''),E'\n',''),E'\r','') "cBundlename",b."nLevel",b."cSerial",
CASE WHEN count(COALESCE(tbl."nBundledetailid")) > 0 THEN jsonb_agg(tbl.* order by --left("cFilename", 1),substring("cFilename", '\d+')::numeric NULLS FIRST , "cFilename"
																	left("cTab", 1)
																	,CAST(NULLIF(SPLIT_PART(SUBSTRING("cTab" FROM '[0-9\.]+'), '.', 1),'') AS bigint) NULLS FIRST
																	,CAST(NULLIF(SPLIT_PART(SUBSTRING("cTab" FROM '[0-9\.]+'), '.', 2),'') AS bigint) NULLS FIRST
																	,CAST(NULLIF(SPLIT_PART(SUBSTRING("cTab" FROM '[0-9\.]+'), '.', 3),'') AS bigint)  NULLS FIRST
																	,CAST(NULLIF(SPLIT_PART(SUBSTRING("cTab" FROM '[0-9\.]+'), '.', 4),'') AS bigint) NULLS FIRST
																	,CAST(NULLIF(SPLIT_PART(SUBSTRING("cTab" FROM '[0-9\.]+'), '.', 5),'') AS bigint) NULLS FIRST
																	,CAST(NULLIF(SPLIT_PART(SUBSTRING("cTab" FROM '[0-9\.]+'), '.', 6),'') AS bigint) NULLS FIRST
																	,CAST(NULLIF(SPLIT_PART(SUBSTRING("cTab" FROM '[0-9\.]+'), '.', 7),'') AS bigint) NULLS FIRST
																	,CAST(NULLIF(SPLIT_PART(SUBSTRING("cTab" FROM '[0-9\.]+'), '.', 8),'') AS bigint) NULLS FIRST,substring("cTab", '\D+'),"cTab",substring("cFilename", '\d+'),CAST(NULLIF(REGEXP_REPLACE("cFilename", '[^0-9]', '', 'g'),'') AS numeric),(substring("cFilename", '\D+')),left("cFilename", 1),substring("cFilename", '\D+'),"cFilename")
ELSE '[]'::jsonb END AS tablelist,
b."sub_info",replace(replace(replace(replace(replace(replace(b."sub_info"::text,'{',''),'}',''),'\"',''),',','/'),E'\n',''),E'\r','') "sub_info1"
from bundles b -- bundles  b
left join (
	 SELECT f."nBundledetailid",f."nBundleid",f."cPath",(case when coalesce(f."cTab",'') !='' then coalesce(f."cTab",'') || '-' else '' end) || REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(f."cFilename", '/', ''), '\', ''),'\"',''),':',''),'?',''),'<',''),'>',''),E'\n',''),E'\r','') || (CASE
    WHEN POSITION(('.' || upper(substring("cPath" from '.*\.([^.]+)$'))) IN upper(f."cFilename")) > 0 THEN ''
    ELSE  ('.' || upper(substring("cPath" from '.*\.([^.]+)$'))) end)  "cFilename","nFolderid","cRefpage","cTab","jPagination","dIntrestDt" "dIntrestDt","cExhibitno","cDescription" "cDescription","cFiletype"
           FROM "BundleDetail" f  where f."nCaseid" = nCaseid and f."nFolderid" =nFolderid and "dDelDt" is null
)tbl on tbl."nBundleid" = b."nBundleid" 
where b."nCaseid" = nCaseid and b."nFolderid" =nFolderid
group by b."nBundleid",b."nFolderid",b."nParentBundleid",b."cBundlename",b."cBundletag",b."nLevel",b."nCaseid",b."cSerial",b."sub_info"
 order by  left(array_to_string("sub_info",''), 1),substring(array_to_string(sub_info,''), '\D+'),substring(array_to_string(sub_info,''), '\D+'),
  substring(array_to_string("sub_info",''), '\d+')::bigint NULLS FIRST,array_to_string(sub_info,',')
) t;

	select jsonb_agg(t) into tablelist from (
	select b."nCaseid",b."nBundledetailid",b."cPath",(case when coalesce(b."cTab",'') !='' then coalesce(b."cTab",'') || '-' else '' end) || REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(b."cFilename", '/', ''), '\', ''),'\"',''),':',''),'?',''),'<',''),'>',''),E'\n',''),E'\r','') || (CASE
    WHEN POSITION(('.' || upper(substring("cPath" from '.*\.([^.]+)$'))) IN upper(b."cFilename")) > 0 THEN ''
    ELSE  ('.' || upper(substring("cPath" from '.*\.([^.]+)$'))) end) "cFilename",
	"nFolderid","cRefpage","cTab","jPagination",null "dIntrestDt","cExhibitno","cDescription"
	from "BundleDetail" b
	where b."nBundleid" IS NULL and "nCaseid" = nCaseid and "nFolderid" = nFolderid and b."dDelDt" is null ) t;
open ref for select bundlelist,tablelist,nCaseid "nCaseid",cCasename "cCasename";

-- select * from highlights

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
