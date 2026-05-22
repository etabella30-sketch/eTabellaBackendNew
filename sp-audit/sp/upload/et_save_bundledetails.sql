CREATE OR REPLACE FUNCTION upload.et_save_bundledetails(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nCaseid uuid;nSectionid uuid;jFiles jsonb;
cTabid text;nUPid uuid;cAType text;
nBundleid uuid;--cConvert text;
isOcr boolean;

nUploadTCatid int default 7;
nElasticTCatid int default 6;
nOcrTCatid int default 4;
nConvertTCatid int default 5;

nTid uuid;nETid uuid;nCTid uuid;nOTid uuid;

BEGIN
nUPid := NULLIF(parameter ->>'nUPid','')::uuid;
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;
jFiles := parameter ->>'jFiles';

cTabid := parameter ->>'cTabid';
cAType := parameter ->>'cAType';

--cConvert := parameter ->>'cConvert';
isOcr := parameter ->>'bIsOcr';

/*

SELECT * FROM upload.et_save_bundledetails (
  '{
	""cAType"":""D"",
	""cTabid"":""TAB1"",
    ""nCaseid"": 1129,
    ""nSectionid"": 9124,
    ""jFiles"": [
      {""id"":1,""nBundleid"":9798,""name"":""File 1"",""type"":""PDF"",""size"":""564564"",""cPath"":""doc/case1/test.pdf"",""nBundledetailid"":""185022""},
      {""id"":2,""nBundleid"":9798,""name"":""File 2"",""type"":""PDF"",""size"":""564564"",""cPath"":""doc/case1/test.pdf""},
      {""id"":3,""nBundleid"":9801,""name"":""File 3"",""type"":""PDF"",""size"":""564564"",""cPath"":""doc/case1/test.pdf""},
      {""id"":4,""nBundleid"":9801,""name"":""File 4"",""type"":""PDF"",""size"":""564564"",""cPath"":""doc/case1/test.pdf""},
      {""id"":5,""nBundleid"":9799,""name"":""File 5"",""type"":""PDF"",""size"":""564564"",""cPath"":""doc/case1/test.pdf""},
      {""id"":6,""nBundleid"":9799,""name"":""File 6"",""type"":""PDF"",""size"":""564564"",""cPath"":""doc/case1/test.pdf""}
    ],
    ""nMasterid"": 2
  }',
  'r1'
);
FETCH ALL IN ""r1"";

-- ,""type"" text,""size"" text,""nBundledetailid"" int,""cPath"" text

select * from task.""TaskCategory""

delete from ""BundleMaster"" where ""nSectionid"" = 9124 and ""nBundleid"" not in (9744)

select * from upload.""UploadMaster""

select * from ""BundleMaster"" where ""nSectionid"" = 9124 and ""nBundleid"" not in (9744)

select * from ""BundleDetail""  where ""nSectionid"" = 9124 order by 1 limit 10

select * from upload.""UploadMaster""

nETid int;nCTid int;nOTid int;

alter table upload.""UploadMaster"" add column ""nOTid"" int;

select * from task.""TaskMaster""

select * from task.""TaskMaster"" where ""nTCatid"" = 7
select * from task.""TaskDetail"" where ""nTid"" = 870

select * from task.""TaskRemarkDetail"" where ""nTDid"" between 24802 and 24807

select * from upload.""BundleDetyail""

select * from upload.""UploadDetail""

delete from ""BundleDetail""  where ""nSectionid"" = 9124 and ""nBundledetailid"" not in (185022,185071);
truncate table upload.""UploadMaster"" restart identity;
truncate table upload.""UploadDetail"" restart identity;
delete from task.""TaskMaster"" where ""nTCatid"" = 7

select ""nLinkId"" from task.""TaskMaster""
select * from upload.et_save_bundledetails ('{""nCaseid"":1122,""cTabid"":""0241ad60-a2d5-4bd3-a4e4-a590724f9263"",""nSectionid"":9088,""bIsOcr"":""true"",""cAType"":""D"",""jFiles"":""[{\""id\"":2,\""nBundleid\"":9837,\""name\"":\""2021_04_30_-_Construction_Weekly_Report_21.docx\"",\""type\"":\""DOCX\"",\""size\"":3467158,\""nBundledetailid\"":null,\""cConvert\"":null,\""cPath\"":\""doc/case1122/dc_hnscbnbh7h6.docx\""},{\""id\"":3,\""nBundleid\"":9837,\""name\"":\""NF23_06_reply_on_clarification_for_tender_document_of_marine_work_06.pdf\"",\""type\"":\""PDF\"",\""size\"":55520,\""nBundledetailid\"":null,\""cConvert\"":null,\""cPath\"":\""doc/case1122/dc_6l5xjfkkb4.pdf\""},{\""id\"":4,\""nBundleid\"":9837,\""name\"":\""NF244_L4-Schedule_-_22_08_2020_-_Excel_file_.pdf\"",\""type\"":\""PDF\"",\""size\"":25626,\""nBundledetailid\"":null,\""cConvert\"":null,\""cPath\"":\""doc/case1122/dc_lys92ore0i.pdf\""},{\""id\"":5,\""nBundleid\"":9837,\""name\"":\""NF245_L4-Schedule_-_29_08_2020_-_Excel___Primavera_file.pdf\"",\""type\"":\""PDF\"",\""size\"":28499,\""nBundledetailid\"":null,\""cConvert\"":null,\""cPath\"":\""doc/case1122/dc_lsy1t67hjqi.pdf\""},{\""id\"":6,\""nBundleid\"":9837,\""name\"":\""NF246_L4_Schedule_Upadtion.pdf\"",\""type\"":\""PDF\"",\""size\"":25867,\""nBundledetailid\"":null,\""cConvert\"":null,\""cPath\"":\""doc/case1122/dc_e4dbdjoj9ns.pdf\""},{\""id\"":7,\""nBundleid\"":9837,\""name\"":\""NF247_L4-Schedule_Updation_as_on_08_08_2020.pdf\"",\""type\"":\""PDF\"",\""size\"":26048,\""nBundledetailid\"":null,\""cConvert\"":null,\""cPath\"":\""doc/case1122/dc_wpw86j6738.pdf\""}]}','r1');fetch all in ""r1"";

*/

	drop table if exists temp_files;
	create temp table temp_files as 
	select *,'00000000-0000-0000-0000-000000000000'::uuid as "nUDid" From jsonb_to_recordset(jFiles) as ("id" int,"nBundleid" uuid,"name" text,"type" text,"size" text,"nBundledetailid" uuid,"cPath" text,"cConvert" text,"identifier" text);

	nUPid = COALESCE(nUPid, '00000000-0000-0000-0000-000000000000'::uuid);

	if(nUPid = '00000000-0000-0000-0000-000000000000'::uuid)then

		insert into task."TaskMaster" ("nTCatid" ,"nUserid","nCaseid")
		values(nUploadTCatid,nMasterid,nCaseid)
		RETURNING "nTid" INTO nTid;

		if exists(select * from temp_files where "type" = 'PDF')then 
			
			insert into task."TaskMaster" ("nTCatid" ,"nUserid","nCaseid","nLinkId")
			values(nElasticTCatid,nMasterid,nCaseid,nTid)
			RETURNING "nTid" INTO nETid;

		end if;

		--if(coalesce(cConvert,'')!='')then
		if exists(select * from temp_files where "cConvert" in ('C','NC') )then 

			insert into task."TaskMaster" ("nTCatid" ,"nUserid","nCaseid","nLinkId")
			values(nConvertTCatid,nMasterid,nCaseid,nTid)
			RETURNING "nTid" INTO nCTid;

		end if;
		

		if(isOcr=true)then

			insert into task."TaskMaster" ("nTCatid" ,"nUserid","nCaseid","nLinkId")
			values(nOcrTCatid,nMasterid,nCaseid,nTid)
			RETURNING "nTid" INTO nOTid;

		end if;
		

		insert into upload."UploadMaster"("nUserid","cTabid","nCaseid","nSectionid","nBundleid","nTid","nETid","nCTid","nOTid")
		values(nMasterid,cTabid,nCaseid,nSectionid,nBundleid,nTid,nETid,nCTid,nOTid)
		RETURNING "nUPid" INTO nUPid;

	else
		
		select "nTid","nETid","nCTid","nOTid" into nTid,nETid,nCTid,nOTid
		from upload."UploadMaster" where "nUPid" = nUPid;
		
	end if;

	if(cAType='R')then
		
		update "BundleDetail" b set "cPage" = null,"cFilesize" = t."size","cFiletype" = t."type" 
		from temp_files t where t."nBundledetailid" = b."nBundledetailid";

	elsif (cAType = 'D') then

	    -- Update names to append incremental "copy (n)" suffix
	    UPDATE temp_files t SET "name" = new_name
	    FROM ( SELECT id,name, CASE WHEN EXISTS (
	                    SELECT 1 FROM "BundleDetail" b
	                    WHERE b."cFilename" = t.name
	                      AND b."nSectionid" = nSectionid
	                ) THEN CONCAT( t.name, ' copy (',   ( SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(b."cFilename", '^.* copy \((\d+)\)$', '\1') AS INT)), 0) + 1
	                        FROM "BundleDetail" b
	                        WHERE b."cFilename" ~ (t.name || ' copy \(\d+\)')
	                          AND b."nSectionid" = nSectionid ), ')' )
	                ELSE t.name END AS new_name
	        FROM temp_files t ) sub WHERE t.id = sub.id;

	end if;

--- select * From "BundleDetail"
--- select * From task."TaskMaster"
--- select * From task."TaskDetail"
-- select * From upload."UploadDetail"
-- alter table upload."UploadDetail" add column "id" int
-- alter table upload."UploadDetail" add column "cConvert" character varying(2)

	drop table if exists temp_bundles;
	create temp table temp_bundles as
		with insrtdata as (
			insert into "BundleDetail" ("nBundleid","nSectionid","cFilename","cPath","cStatus","cFilesize","cFiletype","nOBundledetailid")
			select t."nBundleid",nSectionid,t."name",t."cPath",'P',t."size",t."type",t."id" from temp_files t
			where  case when cAType = 'R' then t."nBundledetailid" IS NULL else true end -- and t."type" != 'ZIP'
			returning "nBundledetailid","nOBundledetailid"
		)select * from insrtdata;
		
		insert into "BDAttributes"("nBundledetailid")
		select t."nBundledetailid" from temp_bundles t;

	with updtl as ( 
		insert into upload."UploadDetail"("nUPid","cName","cFiletype","cSize","cStatus","nBundledetailid","cConvert","identifier","id")
		select nUPid,t."name",t."type",t."size",'P', tbl."nBundledetailid",t."cConvert",t."identifier",t."id"
		from temp_files t
		join temp_bundles tbl on tbl."nOBundledetailid" = t."id"
		where  case when cAType = 'R' then t."nBundledetailid" IS NULL else true end
		returning "nUDid","id"
	)  update temp_files f set "nUDid" = t."nUDid" from updtl t where t."id" = f."id";

		update temp_files f set "nBundledetailid" = t."nBundledetailid" 
		from temp_bundles t where t."nOBundledetailid" = f."id" and f."nBundledetailid" IS NULL;

		with tbl as (		
			select * from temp_bundles
		),tskdtl as (
			insert into task."TaskDetail" ("nTid","nBDid")
			select nTid,t."nBundledetailid" from tbl t
			returning "nTDid"
		)   insert into task."TaskRemarkDetail" ("nTDid","nRid")
			select t."nTDid",r."nRid" from tskdtl t,task."TaskRemarks"  r 
			where r."nTCatid" = nUploadTCatid and r."nSerial" = 1;

-- select * from task."TaskRemarks"

		update task."TaskMaster" m set "nTotal" = t."nTotal"
		from (select t."nTid",count(t."nTDid") as "nTotal" from task."TaskDetail" t where  t."nTid" = nTid group by t."nTid" ) t
		 where t."nTid" = m."nTid";

		if(nETid IS NOT NULL)then
			with tbl as (		
				select t.* from temp_bundles t
				join "temp_files" f on f."id" = t."nOBundledetailid"
				where f."type" = 'PDF'
			),tskdtl as (
				insert into task."TaskDetail" ("nTid","nBDid")
				select nETid,t."nBundledetailid" from tbl t
				returning "nTDid"
			)   insert into task."TaskRemarkDetail" ("nTDid","nRid")
				select t."nTDid",r."nRid" from tskdtl t,task."TaskRemarks"  r 
				where r."nTCatid" = nElasticTCatid and r."nSerial" = 1;

			update task."TaskMaster" t
				set "nTotal" = (select count("nUDid") from upload."UploadDetail" where "nUPid" = nUPid and "cFiletype" = 'PDF')
			  	where t."nTid" = nETid;

		end if;
	

		if(nCTid IS NOT NULL)then
			with tbl as (		
				select t.* from temp_bundles t
				join "temp_files" f on f."id" = t."nOBundledetailid"
				where f."cConvert" in ('C','NC')
			),tskdtl as (
				insert into task."TaskDetail" ("nTid","nBDid")
				select nCTid,t."nBundledetailid" from tbl t
				returning "nTDid"
			)   insert into task."TaskRemarkDetail" ("nTDid","nRid")
				select t."nTDid",r."nRid" from tskdtl t,task."TaskRemarks"  r 
				where r."nTCatid" = nConvertTCatid and r."nSerial" = 1;

			update task."TaskMaster" t
				set "nTotal" = (select count("nUDid") from upload."UploadDetail" where "nUPid" = nUPid and "cConvert" in ('C','NC'))
			  	where t."nTid" = nCTid;

		end if;
	

		if(nOTid IS NOT NULL)then
			with tbl as (		
				select t.* from temp_bundles t
				join "temp_files" f on f."id" = t."nOBundledetailid"
				where f."type" = 'PDF'
			),tskdtl as (
				insert into task."TaskDetail" ("nTid","nBDid")
				select nOTid,t."nBundledetailid" from tbl t
				returning "nTDid"
			)   insert into task."TaskRemarkDetail" ("nTDid","nRid")
				select t."nTDid",r."nRid" from tskdtl t,task."TaskRemarks"  r 
				where r."nTCatid" = nOcrTCatid and r."nSerial" = 1;

			update task."TaskMaster" t
				set "nTotal" = (select count("nUDid") from upload."UploadDetail" where "nUPid" = nUPid and "cFiletype" = 'PDF')
			  	where t."nTid" = nOTid;

		end if;

		open ref for
			select nUPid as "nUPid","nUDid",nTid as "nTid",nETid "nETid",nCTid "nCTid",nOTid "nOTid" ,"id","nBundledetailid","name" 
			from "temp_files";
	

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
