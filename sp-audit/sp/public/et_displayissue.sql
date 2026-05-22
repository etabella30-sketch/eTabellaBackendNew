CREATE OR REPLACE FUNCTION public.et_displayissue(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nCaseid uuid;nUserid uuid;nSectionid uuid; cFoldertype text;
nBundleid uuid;
BEGIN
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nSectionid:= NULLIF(parameter ->>'nSectionid','')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;
/*
 
 select * from et_displayissue ('{"nSectionid":857,"nCaseid":289,"nMasterid":59}','r1');fetch all in "r1";
 
*/
	select "cFoldertype" into cFoldertype from "SectionMaster" where "nSectionid" = nSectionid;
	
open ref for 

-- select * from "IssueCategory"
-- select * from "FMIssue"

select ic."nICid",ic."nICid" as "nMasterid",ic."nCaseid",ic."cCategory",jsonb_agg(distinct isu) as "issuelist"
from "IssueCategory" ic
join (
select im."nIid",im."cIName",im."cColor",im."nICid", '[]'::jsonb as "tablelist" --jsonb_agg(distinct bnd) as "tablelist"
from "RIssueMaster" im 
join "FMIssue" fi on fi."nIssueid" = im."nIid"
join "FactMaster" f on f."nFSid" = fi."nFSid"
join (
select 
	distinct f."nBundledetailid", f."nBundleid", f."cFilename" AS "cName", f."cTab", f."cExhibitno",
               f."cPage", f."cRefpage", f."cFilesize", f."cFiletype", f."dIntrestDt", f."cDesc" AS "cDescription" from "BundleDetail" f 
			   left join "BDAssignment" ba on ba."nBundledetailid" = f."nBundledetailid"
	where (CASE WHEN cFoldertype = 'CB' or cFoldertype = 'CO' THEN ba."nSectionid" ELSE f."nSectionid" END) = nSectionid	
	and case when nBundleid is  distinct from null then f."nBundleid" = nBundleid or ba."nBundleid" = nBundleid  else true end
) bnd on bnd."nBundledetailid" = f."nBundledetailid"
where f."nUserid" = nUserid
group by im."nIid",im."cIName",im."cColor",im."nICid"
) isu on isu."nICid" = ic."nICid"
 group by ic."nICid",ic."nCaseid",ic."cCategory"

;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
