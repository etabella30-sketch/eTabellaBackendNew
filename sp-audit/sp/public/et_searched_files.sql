CREATE OR REPLACE FUNCTION public.et_searched_files(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
-- select * from ""BundleDetail"" 
declare nUserid uuid;nCaseid uuid;nSectionid uuid;
nBundleid uuid;jFiles uuid[];jFolders uuid[];

BEGIN
nCaseid:= NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid:= NULLIF(parameter ->>'nSectionid','')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;
jFolders := parameter ->>'jFolders';
jFiles := parameter ->>'jFiles';
nUserid:= NULLIF(parameter ->>'nMasterid','')::uuid;
	-- select * from et_searched_files ('{""nCaseid"":22,""nSectionid"":92,""jFolders"":""{}"",""jFiles"":""{}"",""nMasterid"":59}','r1');fetch all in ""r1"";

	if(nBundleid IS NOT NULL) then
	open ref for
		select "nBundleid",t."nParentBundleid",'00000000-0000-0000-0000-000000000000'::uuid "nBundledetailid","cName","cTab","cExhibitno" from (WITH RECURSIVE bdl_tree AS (
            SELECT bm."nBundleid", bm."cBundlename"::text AS "cName", bm."nParentBundleid",
                bm."cBundlename"::text AS sub_info, bm."nSectionid", bm."cBundletag" "cTab",bm.sorted_bundletag sorted_tab,bm.sorted_name
            FROM "BundleMaster" bm
			join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
			left join "BMPermission" bp on bm."nBundleid" = bp."nBundleid" and bp."nUserid" = nUserid
            WHERE bp."nBMPid" is null and  bm."nBundleid" = nBundleid	 AND sm."nCaseid" = nCaseid AND bm."nSectionid" = nSectionid
            UNION ALL
            SELECT c."nBundleid", c."cBundlename", c."nParentBundleid",
                p.sub_info || ' / ' || c."cBundlename"::text "cName", c."nSectionid", c."cBundletag" "cTab"
				,c.sorted_bundletag,c.sorted_name
            FROM "BundleMaster" c
            JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"
			left join "BMPermission" bp on c."nBundleid" = bp."nBundleid" and bp."nUserid" = nUserid
			WHERE bp."nBMPid" is null 
        )  SELECT t."nBundleid",t."nParentBundleid",'00000000-0000-0000-0000-000000000000'::uuid "nBundledetailid","cName","cTab",sorted_tab,sorted_name,'' "cExhibitno" from bdl_tree t
		union all
			SELECT bd."nBundleid",'00000000-0000-0000-0000-000000000000'::uuid "nParentBundleid",bd."nBundledetailid",bd."cFilename" AS "cName",bd."cTab",bd.sorted_tab,bm.sorted_name,"cExhibitno"
               FROM "BundleDetail" bd 
			   	left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
               WHERE  bp."nBDPid" is null and bd."nBundleid" and bd."cStatus" = 'C'
			 and t."nBundleid" = nBundleid
		   ) t order by sorted_tab,sorted_name;

			   
		else 
		open ref for
			select "nBundleid",t."nParentBundleid",'00000000-0000-0000-0000-000000000000'::uuid "nBundledetailid","cName","cTab","cExhibitno" from (
			with bdl_tree as (
	            SELECT bm."nBundleid", bm."cBundlename"::text AS "cName", bm."nParentBundleid",
	                bm."cBundlename"::text AS sub_info, bm."nSectionid", bm."cBundletag" "cTab",bm.sorted_bundletag sorted_tab,bm.sorted_name
	            FROM "BundleMaster" bm
				join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
				left join "BMPermission" bp on bm."nBundleid" = bp."nBundleid" and bp."nUserid" = nUserid
	            WHERE bp."nBMPid" is null and bm."nBundleid" = ANY(jFolders::uuid[])
			) select t."nBundleid",t."nParentBundleid",'00000000-0000-0000-0000-000000000000'::uuid "nBundledetailid","cName","cTab",sorted_tab,sorted_name,'' "cExhibitno" from bdl_tree t where t."nParentBundleid" not in (select "nBundleid" from bdl_tree)

			union all 
				SELECT "nBundleid",'00000000-0000-0000-0000-000000000000'::uuid "nParentBundleid",bd."nBundledetailid",bd."cFilename" AS "cName",bd."cTab",sorted_tab,sorted_name,"cExhibitno"
               FROM "BundleDetail" bd 
			   	left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
               WHERE  bp."nBDPid" is null and  bd."nSectionid" = nSectionid AND  bd."nBundledetailid" = ANY(jFiles::uuid[])
			   ) t order by sorted_tab,sorted_name;

	end if;
		
   return ref ;-- Return the cursor to the caller
    END;
$function$
