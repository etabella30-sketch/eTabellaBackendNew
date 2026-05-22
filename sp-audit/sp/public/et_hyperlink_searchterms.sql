CREATE OR REPLACE FUNCTION public.et_hyperlink_searchterms(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nCaseid uuid;cType text;nSectionid uuid;
-- select * from et_hyperlink_searchterms('{"nCaseid":289,"nSectionid":857,"nUserid":10}','r');fetch all in "r"
--select * from "SectionMaster" where "nCaseid" = 289
-- select * from "BundleDetail" where "nBundledetailid" = 555366

/*
select * from et_hyperlink_searchterms ('{"nCaseid":1136,"nMasterid":2,"nSectionid":857,"cType":"E"}','r1');fetch all in "r1";
select * from et_hyperlink_index_searchterms ('{"nBundledetailid":555372,"nSectionid":857,"nCaseid":289,"cType":"E","nMasterid":2,"cKeeptype":"R","isDeepscan":""}','r1','r2');fetch all in "r1";fetch all in "r2";
*/

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
cType = parameter ->>'cType';

open ref for
	select distinct case when cType = 'T' then b."cTab" else b."cExhibitno" end as "cTerm" ,('00000000-0000-0000-0000-000000000000')::uuid as "nBundledetailid"
	from "BundleDetail" b	
	join "SectionMaster" sm on sm."nSectionid" = b."nSectionid" 
	where sm."nCaseid" = nCaseid and
	-- where b."nSectionid" = nSectionid and 
	b."cStatus" = 'C'  --and b."cExhibitno" in ('Exhibit C-49')
	and coalesce(b."cIsindex",false) = false and ( case when cType = 'T' then nullif(b."cTab",'') else nullif(b."cExhibitno",'') end) is not null
;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
