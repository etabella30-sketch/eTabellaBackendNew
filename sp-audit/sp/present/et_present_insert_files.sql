CREATE OR REPLACE FUNCTION present.et_present_insert_files(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare 
	nMasterid uuid;jFiles jsonb;nPresentid uuid;nPCid uuid;nBundledetailid uuid;
	nCaseid uuid;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jFiles := parameter ->>'jFiles';
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;
/*
select * From present."PresentationMaster"  where "nPresentid" = '69557737-5c15-483c-9962-fa669a17dd8c';

select * From "PMContact"
select * From "PMUser"
select * From "Codemaster"
select * From "PMDocuments"
select * From "PMSetupDetail"

ALTER TABLE "PMUser"
ADD CONSTRAINT unique_npresentid_nuserid UNIQUE ("nPresentid", "nUserid");

 select * from present.et_present_insert_files ('{"jFiles":"[{\"nBundledetailid\":\"a6fb9b76-a97d-420b-936d-f303fd60fe48\",\"type\":\"F\"}]","nPresentid":"69557737-5c15-483c-9962-fa669a17dd8c","nMasterid":"3a168b69-1bb8-4c7e-881f-dff78a854f80"}','r1');fetch all in "r1";
 
*/

	delete from present."PMSetupDetail" where "nPresentid" = nPresentid;

	insert into present."PMSetupDetail"("nPresentid","nBundledetailid","nBundleid","cType")
	select nPresentid,t."nBundledetailid",t."nBundleid",t."type"
	from  jsonb_to_recordset(jFiles) as t("nBundledetailid" uuid,"nBundleid" uuid,"type" text);

	select "nPCid","nCaseid" into nPCid,nCaseid from present."PresentationMaster" where "nPresentid" = nPresentid;

	drop table if exists temp_bundles;
	create temp table temp_bundles as 
	WITH RECURSIVE ChildHierarchy AS (
	    SELECT b1."nBundleid", b1."nParentBundleid"
	    FROM "BundleMaster" b1
	    WHERE jFiles @> ('[{"nBundleid":"'|| b1."nBundleid" ||'"}]')::jsonb
	    UNION ALL
	    SELECT bm."nBundleid",bm."nParentBundleid"
	    FROM "BundleMaster" bm
	    INNER JOIN ChildHierarchy ch ON bm."nParentBundleid" = ch."nBundleid"
	) select "nBundleid" from ChildHierarchy;

	with tbl as (
		select t."nBundledetailid",t."type"
		from  jsonb_to_recordset(jFiles) as t("nBundledetailid" uuid,"type" text)
		where t."nBundledetailid" IS NOT NULL
		union all
		select b."nBundledetailid",'F' 
		from "BundleDetail" b
		join temp_bundles t on t."nBundleid" = b."nBundleid"
	),del as (
		delete from present."PMDocuments" p where p."nPresentid" = nPresentid and not exists(select 1 from tbl t where t."nBundledetailid" = p."nBundledetailid" and t."type" = p."cType") 
		returning "nPDid"
	)
		insert into present."PMDocuments"("nPCid","nPresentid","nBundledetailid","cType"
		)
		select nPCid,nPresentid, t."nBundledetailid",t."type" 
		from tbl t
		left join present."PMDocuments" p on p."nPresentid" = nPresentid and p."nBundledetailid" = t."nBundledetailid" and t."type" = p."cType"
		where p."nPDid" is null group by  t."nBundledetailid",t."type"
	;
	
--  update present."PMDocuments" p set "nSerial" = row_no from (select  "nPDid",row_number() over(Partition by "cType" order by 1) row_no,"nPCid" from present."PMDocuments" where "nPCid" = nPCid ) d  where d."nPCid" = p."nPCid"
 
	select b."nBundledetailid" into nBundledetailid from "BundleDetail" b
	join "SectionMaster" s on s."nSectionid" = b."nSectionid" and "cFoldertype" = 'MB'
	left join "BDPermission" bp on bp."nBundledetailid" = b."nBundledetailid" and bp."nUserid" = nMasterid
	where s."nCaseid" = nCaseid and "nBDPid" is null and b."cIsindex" = true and 
	 jFiles @> ('[{"nBundledetailid":"'|| b."nBundledetailid" ||'"}]')::jsonb limit 1;

-- select * from "BDPermission"
open ref for
	select 1 as msg,nBundledetailid "nBundledetailid";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
