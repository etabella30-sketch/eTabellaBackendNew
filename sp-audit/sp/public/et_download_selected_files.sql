CREATE OR REPLACE FUNCTION public.et_download_selected_files(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
-- select * from "BundleDetail" 
declare nUserid uuid;nCaseid uuid;nSectionid uuid;
nBundleid uuid;jFiles uuid[];jFolders uuid[];nDTaskid uuid;

count1 int;

BEGIN
nCaseid:= NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid:= NULLIF(parameter ->>'nSectionid','')::uuid;
nBundleid := parameter ->>'nBundleid';
jFolders := parameter ->>'jFolders';
jFiles := parameter ->>'jFiles';
nUserid:= NULLIF(parameter ->>'nMasterid','')::uuid;
nDTaskid:= parameter ->>'nDTaskid';
	-- select * from et_download_selected_files ('{""nCaseid"":22,""nSectionid"":92,""jFolders"":""{}"",""jFiles"":""{}"",""nMasterid"":59}','r1');fetch all in ""r1"";
drop table if exists temp_bundles;
create temp table temp_bundles(serial int,"nBundleid" uuid,"nParentBundleid" uuid,"nBundledetailid" uuid,"cName" text,"cTab" text,"cExhibitno" text,"cFiletype" text,sorted_tab text[],sorted_name text[]);

	if(coalesce(nBundleid,'00000000-0000-0000-0000-000000000000') != '00000000-0000-0000-0000-000000000000') then
		insert into temp_bundles("nBundleid","nParentBundleid","nBundledetailid","cName","cTab","cExhibitno","cFiletype",sorted_tab,sorted_name)
		select "nBundleid",t."nParentBundleid","nBundledetailid","cName","cTab","cExhibitno","cFiletype",sorted_tab,sorted_name from (
		WITH RECURSIVE bdl_tree AS (
            SELECT bm."nBundleid", bm."cBundlename"::text AS "cName", bm."nParentBundleid",
                bm."cBundlename"::text AS sub_info, bm."nSectionid", bm."cBundletag" "cTab",bm.sorted_bundletag sorted_tab,bm.sorted_name
            FROM "BundleMaster" bm
			join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
			left join "BMPermission" bp on bm."nBundleid" = bp."nBundleid" and bp."nUserid" = nUserid
            WHERE coalesce(bp."nBMPid",'00000000-0000-0000-0000-000000000000') ='00000000-0000-0000-0000-000000000000' and  coalesce(bm."nParentBundleid",'00000000-0000-0000-0000-000000000000') = coalesce(nBundleid,'00000000-0000-0000-0000-000000000000')	 AND sm."nCaseid" = nCaseid AND bm."nSectionid" = nSectionid
            UNION ALL
            SELECT c."nBundleid", c."cBundlename", c."nParentBundleid",
                p.sub_info || ' / ' || c."cBundlename"::text "cName", c."nSectionid", c."cBundletag" "cTab"
				,c.sorted_bundletag,c.sorted_name
            FROM "BundleMaster" c
            JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"
			left join "BMPermission" bp on c."nBundleid" = bp."nBundleid" and bp."nUserid" = nUserid
			WHERE coalesce(bp."nBMPid",null) is not  distinct from null
        )  SELECT t."nBundleid",t."nParentBundleid",null "nBundledetailid","cName","cTab",sorted_tab,sorted_name,'' "cExhibitno",'' "cFiletype" from bdl_tree t
		union all
			SELECT bd."nBundleid","nBundleid" "nParentBundleid",bd."nBundledetailid",bd."cFilename" AS "cName",bd."cTab",bd.sorted_tab,bd.sorted_name,"cExhibitno","cFiletype"
               FROM "BundleDetail" bd 
			   	left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
               WHERE  coalesce(bp."nBDPid",null) is not  distinct from null 
			   and bd."nBundleid" = nBundleid  and bd."cStatus" = 'C'			 
		   ) t order by sorted_tab,sorted_name;

			   
		else 
		insert into temp_bundles("nBundleid","nParentBundleid","nBundledetailid","cName","cTab","cExhibitno","cFiletype",sorted_tab,sorted_name)
			select distinct "nBundleid",t."nParentBundleid","nBundledetailid","cName","cTab","cExhibitno","cFiletype",sorted_tab,sorted_name from (
			with bdl_tree as (
	            SELECT bm."nBundleid", bm."cBundlename"::text AS "cName", bm."nParentBundleid",
	                bm."cBundlename"::text AS sub_info, bm."nSectionid", bm."cBundletag" "cTab",bm.sorted_bundletag sorted_tab,bm.sorted_name
	            FROM "BundleMaster" bm
				join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
				left join "BMPermission" bp on bm."nBundleid" = bp."nBundleid" and bp."nUserid" = nUserid
	            WHERE coalesce(bp."nBMPid",'00000000-0000-0000-0000-000000000000') ='00000000-0000-0000-0000-000000000000' and bm."nBundleid" = ANY(jFolders::uuid[])
			) select t."nBundleid",t."nParentBundleid",null "nBundledetailid","cName","cTab",sorted_tab,sorted_name,'' "cExhibitno",'' "cFiletype" from bdl_tree t where coalesce(t."nParentBundleid",'00000000-0000-0000-0000-000000000000') not in (select "nBundleid" from bdl_tree)

			union all 
				SELECT "nBundleid",null "nParentBundleid",bd."nBundledetailid",bd."cFilename" AS "cName",bd."cTab",sorted_tab,sorted_name,"cExhibitno","cFiletype"
               FROM "BundleDetail" bd 
			   	left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
               WHERE   coalesce(bp."nBDPid",'00000000-0000-0000-0000-000000000000') ='00000000-0000-0000-0000-000000000000'  and   bd."nSectionid" = nSectionid AND  bd."nBundledetailid" = ANY(jFiles::uuid[])
			   ) t order by sorted_tab,sorted_name;

	end if;

	if(coalesce(nDTaskid,null) is not  distinct from null) then
		insert into "DownloadTask" ("nUserid","nCaseid","nSectionid")
		values(nUserid,nCaseid,nSectionid) returning "nDTaskid" into nDTaskid;		
	end if;
	select count(*) into count1 from temp_bundles; 
	raise notice 'count1 %',count1;

	   
			insert into "DownloadTDetail"("nDTaskid","nBid","nPBid","nBDid","nSerial")
		with sorted as(
			select t."nBundleid",t."nParentBundleid",t."nBundledetailid",row_number() over(PARTITION BY coalesce(t."nParentBundleid",'00000000-0000-0000-0000-000000000000') order by 	d."nSerial" NULLS LAST,sorted_tab,sorted_name) "nSerial" from temp_bundles t
			left join "DownloadTDetail" d on d."nDTaskid" = nDTaskid and d."nBid" = t."nBundleid" and d."nBDid" = t."nBundledetailid"
		),data as(
			select "nBundleid","nBundledetailid",d."nSerial"
			 from temp_bundles t join "DownloadTDetail" d on d."nDTaskid" = nDTaskid and d."nBid" = t."nBundleid" and d."nBDid" = t."nBundledetailid"
		) select nDTaskid,s."nBundleid",s."nParentBundleid",s."nBundledetailid",s."nSerial"::int from sorted s 
			left join data d on s."nBundleid" = d."nBundleid" and s."nBundledetailid" = d."nBundledetailid" 
			where d."nBundledetailid" is not  distinct from null;
	
			UPDATE temp_bundles t SET serial = d."nSerial" FROM "DownloadTDetail" d WHERE t."nBundleid" = d."nBid"  AND t."nBundledetailid" = d."nBDid" and d."nDTaskid" = nDTaskid;
	
		open ref for select nDTaskid "nDTaskid",serial,"nBundleid","nParentBundleid","nBundledetailid","cName","cTab","cExhibitno","cFiletype" from temp_bundles order by serial,sorted_tab,sorted_name;

		
   return ref ;-- Return the cursor to the caller
    END;
$function$
