CREATE OR REPLACE FUNCTION public.et_bundle_is_issuetag(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nCaseid uuid;nMasterid uuid;nSectionid uuid;isIssue boolean default false;isContact boolean default false;isTag boolean default false; cFoldertype text;nBundleid uuid;
BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;

-- select * from et_bundle_is_issuetag ('{""nCaseid"":22,""nSectionid"":92,""nMasterid"":59}','refcursor'); FETCH All in ""refcursor""; 
-- select * from "SectionMaster" where "nCaseid" = 22

	select "cFoldertype" into cFoldertype from "SectionMaster" where "nSectionid" = nSectionid;

if exists(select bd."nBundledetailid" from "BundleDetail" bd 
		left join "BDAssignment" ba on ba."nBundledetailid" = bd."nBundledetailid"
		join "FactMaster" fm on fm."nBundledetailid" = (CASE WHEN cFoldertype = 'CB' or cFoldertype = 'CO' THEN ba."nBundledetailid" ELSE bd."nBundledetailid" END) 
		where fm."nUserid" = nMasterid and (CASE WHEN cFoldertype = 'CB' or cFoldertype = 'CO' THEN ba."nSectionid" ELSE bd."nSectionid" END) = nSectionid
		and case when nBundleid is  distinct from null then bd."nBundleid" = nBundleid or ba."nBundleid" = nBundleid  else true end) then	 
			isIssue := true; 
		end if;
	 
	 
	 if exists(select bd."nBundledetailid" from "BundleDetail" bd 
	 left join "BDAssignment" ba on ba."nBundledetailid" = bd."nBundledetailid"
	 join "BDContacts" bc on bc."nBundledetailid" = (CASE WHEN cFoldertype = 'CB' or cFoldertype = 'CO' THEN ba."nBundledetailid" ELSE bd."nBundledetailid" END) 
	 where bc."nUserid" = nMasterid and (CASE WHEN cFoldertype = 'CB' or cFoldertype = 'CO' THEN ba."nSectionid" ELSE bd."nSectionid" END) = nSectionid
	 and case when nBundleid is  distinct from null then bd."nBundleid" = nBundleid or ba."nBundleid" = nBundleid  else true end) then	 
	 	isContact := true; 

	end if;
-- select * from "FMContact"
	if exists(select bd."nBundledetailid" from "BundleDetail" bd 
		left join "BDAssignment" ba on ba."nBundledetailid" = bd."nBundledetailid"
		join "FactMaster" f on f."nBundledetailid" = (CASE WHEN cFoldertype = 'CB' or cFoldertype = 'CO' THEN ba."nBundledetailid" ELSE bd."nBundledetailid" END) 
		and f."nUserid" = nMasterid
		join "FMContact" fc on fc."nFSid" = f."nFSid"
		where (CASE WHEN cFoldertype = 'CB' or cFoldertype = 'CO' THEN ba."nSectionid" ELSE bd."nSectionid" END) = nSectionid
		and case when nBundleid is  distinct from null then bd."nBundleid" = nBundleid or ba."nBundleid" = nBundleid  else true end) then	 
			isContact := true; 
	end if;

		
	 if exists(select bd."nBundledetailid" from "BundleDetail" bd 
	 	left join "BDAssignment" ba on ba."nBundledetailid" = (CASE WHEN cFoldertype = 'CB' or cFoldertype = 'CO' THEN ba."nBundledetailid" ELSE bd."nBundledetailid" END)
		join "BDTags" bc on bc."nBundledetailid" = bd."nBundledetailid"
		where bc."nUserid" = nMasterid and (CASE WHEN cFoldertype = 'CB' or cFoldertype = 'CO' THEN ba."nSectionid" ELSE bd."nSectionid" END) = nSectionid
		and case when nBundleid is  distinct from null then bd."nBundleid" = nBundleid or ba."nBundleid" = nBundleid  else true end) then	 
		isTag := true; 
	
	end if;

open ref for 
select isIssue "isIssue",isContact "isContact",isTag "isTag";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
