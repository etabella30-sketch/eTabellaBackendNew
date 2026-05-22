CREATE OR REPLACE FUNCTION public.et_share_users_by_bid(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid UUID;
    nSectionid UUID; jUserids uuid[];
	cFtype text;jSectionids uuid[];
	nCaseid uuid;nBundleid uuid;nBundledetailid uuid;
	parentIds uuid[];
	BEGIN
    -- Parse input JSON once
    nMasterid := NULLIF(parameter ->> 'nMasterid','')::UUID;
    nSectionid := NULLIF(parameter ->> 'nSectionid','')::UUID;
	nBundleid := NULLIF(parameter ->> 'nBundleid','')::UUID;
	nBundledetailid := NULLIF(parameter ->> 'nBundledetailid','')::UUID;
-- select * from et_share_users_by_bid('{"nMasterid":367,"nSectionid":8982,"nBundleid":0}','r1');fetch all in "r1"
	select "cFoldertype","nCaseid" into cFtype,nCaseid from "SectionMaster" where "nSectionid" = nSectionid;
	-- select * from "BDShare" -- truncate table "BDShare" restart identity

	
		parentIds := (array(WITH RECURSIVE bdl_tree AS (
        -- Select the base case (the root folder or initial folder)
	        SELECT bm."nParentBundleid" "nBundleid"
	        FROM "BundleMaster" bm
	        WHERE case when nBundleid IS NOT NULL then bm."nBundleid" = nBundleid else "nBundleid" IS NULL end and "nSectionid" = nSectionid
	        UNION ALL
	        -- Recursive selection for child folders
	        SELECT c."nParentBundleid" "nBundleid"
	        FROM "BundleMaster" c
	        JOIN bdl_tree p ON c."nBundleid" = p."nBundleid")
			select "nBundleid" from bdl_tree)
		);
	
	
    OPEN ref1 FOR 
		select distinct jsonb_agg(distinct "nUserid") "jUsers" from "BDShare" bs where "nSectionid" in (select "nSectionid" from "SectionMaster" where "nCaseid" = nCaseid and "cFoldertype" = cFtype 
		) and case when nBundleid IS NOT NULL then bs."nBundleid" = nBundleid or bs."nBundleid" = any(parentIds) else case when nBundledetailid IS NOT NULL then bs."nBundledetailid" = nBundledetailid or bs."nBundleid" = any(parentIds) or (bs."nBundleid" IS NULL and bs."nBundledetailid" IS NULL) else 
		/* not exists (
				select 1 from "BundleMaster" b
		left join "BDShare" bsh on b."nSectionid" = bs."nSectionid" and b."nBundleid" = bsh."nBundleid" and bsh."nUserid" = bs."nUserid" and bsh."nMasterid" = nMasterid
		where bsh."nBundleid" is null and b."nSectionid" = bs."nSectionid" and "nParentBundleid" = 0
		) or  
		*/
		(bs."nBundleid" IS NULL and bs."nBundledetailid" IS NULL)
		
		end end and "nMasterid" = nMasterid;

END;
$function$
