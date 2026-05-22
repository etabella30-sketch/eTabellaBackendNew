CREATE OR REPLACE FUNCTION elastic.et_sub_bundles(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE 
	nBundleid uuid;nMasterid uuid;

BEGIN
	nBundleid := parameter ->>'nBundleid';
	nMasterid := parameter ->>'nMasterid';

/*
select * from "BundleDetail" b where b."dIntrestDt" is not null

 select * from elastic.et_sub_bundles ('{"nBundleid":"16982","nMasterid":377}','r1');fetch all in "r1";

	
select *	from "BundleDetail" b
 */

open ref for
		WITH RECURSIVE bdl_tree AS (
            SELECT bm."nBundleid", bm."nParentBundleid",bm."cBundlename"
            FROM "BundleMaster" bm
			join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
			left join "BMPermission" bp on bm."nBundleid" = bp."nBundleid" and bp."nUserid" = nMasterid
            WHERE bp."nBMPid" is null and   (bm."nParentBundleid" = nBundleid  ) --AND sm."nCaseid" = nCaseid AND bm."nSectionid" = nSectionid
            UNION ALL
            SELECT c."nBundleid", c."nParentBundleid",c."cBundlename"
            FROM "BundleMaster" c
            JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"
			left join "BMPermission" bp on c."nBundleid" = bp."nBundleid" and bp."nUserid" = nMasterid
			WHERE bp."nBMPid" is null 
        ) select * from bdl_tree;
		

    RETURN ref; 
END;
$function$
