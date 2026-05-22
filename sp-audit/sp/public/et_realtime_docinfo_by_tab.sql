CREATE OR REPLACE FUNCTION public.et_realtime_docinfo_by_tab(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;cTab text;

BEGIN
 -- select * from et_realtime_docinfo_by_tab('{""cTab"":""T3"",""nCaseid"":22}','r');fetch all in ""r""
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
cTab := parameter ->>'cTab';
-- select * from "BundleDetail"

	open ref for select b."nBundledetailid",b."cFilename" as "cName",b."cPath",b."cPage" from "BundleDetail" b
	join "SectionMaster" s on s."nSectionid" = b."nSectionid"
	where b."cTab" = cTab and s."nCaseid" = nCaseid order by b."nBundledetailid" asc limit 1;
	
 
 

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
