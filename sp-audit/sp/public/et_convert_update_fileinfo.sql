CREATE OR REPLACE FUNCTION public.et_convert_update_fileinfo(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;cFilename text;nSectionid uuid;nBundleid uuid;
nBundledetailid uuid;cFiletype text;isValidate boolean;
cPath text;cFilesize text;cPage text;nUPid uuid;
bMetadata boolean;nBaseBDid uuid;cOldpath text;
cConvertType text; bIsFailed boolean;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
cFilename := parameter ->>'cFilename';
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
cFiletype := parameter ->>'cFiletype';
isValidate := coalesce((parameter ->> 'isValidate')::boolean, false);
cPath := parameter ->>'cPath';
cFilesize := parameter ->>'cFilesize';
cPage := parameter ->>'cPage';
bMetadata := coalesce((parameter ->> 'bMetadata')::boolean, false);
cConvertType := parameter ->>'cConvertType';
bIsFailed := coalesce((parameter ->> 'bIsFailed')::boolean, false);

nBaseBDid:= nBundledetailid;
/*

select * from et_upload_updatefileinfo ('{"nBundledetailid":"528554","nMasterid":"1","cFilename":"test2.pdf","nSectionid":"1","nBundleid":"0","cFiletype":"PDF","isValidate":true,"cPath":"demo3.pdf","cFilesize":"200000","Pagerotation":90,"cPage":"1-50"}','refcursor'); FETCH All in "refcursor";

select * From "BundleDetail" order by 1 desc limit 10 
select * From "BDAttributes" order by 1 desc  limit 10 
select * From "UploadMaster" order by 1 desc limit 10 

alter table "UploadMaster" add column "nTotal" int

*/

if bIsFailed and nBundledetailid IS NOT NULL then 

	DELETE FROM "BundleDetail" WHERE "nBundledetailid" = nBundledetailid;
	DELETE FROM "BDAttributes" WHERE "nBundledetailid" = nBundledetailid;

 

elsif(cConvertType = 'C') then

		update "BundleDetail" set "cPath" = cPath,"cFilename"=cFilename ,"dUpdateDt" = now(),"nUpdateId" = nMasterid,"cPage" = cPage,"cRefpage" = null,
		"cFilesize" =(case when coalesce(cFilesize,'') !='' then cFilesize else "cFilesize" end),
		"cFiletype" =(case when coalesce(cFiletype,'') !='' then cFiletype else "cFiletype" end),
		"cStatus"=(case when isValidate then 'C' else 'V' end)
		where "nBundledetailid" = nBundledetailid;

		update "BDAttributes" set "nEStatus" = null where "nBundledetailid" = nBundledetailid;

elsif(cConvertType = 'B') then

	select "nBundleid" into nBundleid from "BundleDetail" where "nBundledetailid" = nBundledetailid;

	if exists(select 1 from "BDAttributes" where "nConvertid" = nBundledetailid) then 

		select "nBundledetailid" into nBundledetailid from "BDAttributes" where "nConvertid" = nBundledetailid;
		
		update "BundleDetail" set "dUpdateDt" = now(),"nUpdateId" = nMasterid,"cPage" = cPage,"cRefpage" = null,"cFilesize" =(case when coalesce(cFilesize,'') !='' then cFilesize else "cFilesize" end),
		"cFiletype" =(case when coalesce(cFiletype,'') !='' then cFiletype else "cFiletype" end),"cStatus"=(case when isValidate then 'C' else 'V' end) where "nBundledetailid" = nBundledetailid;

		update "BDAttributes" set "nEStatus" = null where "nBundledetailid" = nBundledetailid;
	else 

		insert into "BundleDetail"("nBundleid","nSectionid","cFilename","cPath","dCreateDt","nCreateId","cStatus","cPage","cFilesize","cFiletype")
		values(nBundleid,nSectionid,cFilename,cPath,now(),nMasterid,case when isValidate then 'C' else 'V' end,cPage,coalesce(cFilesize,'0'),cFiletype) 
		RETURNING "nBundledetailid" into nBundledetailid;

		if(bMetadata and nBaseBDid IS NOT NULL) then

				UPDATE "BundleDetail" bd
				SET "cTab" = bds."cTab",
				"cExhibitno" = bds."cExhibitno",
				"dIntrestDt" = bds."dIntrestDt",
				"cDesc" = bds."cDesc"
				FROM "BundleDetail" bds
				WHERE bd."nBundledetailid" = nBundledetailid
				AND bds."nBundledetailid" = nBaseBDid;

		end if;

		insert into "BDAttributes" ("nBundledetailid", "nConvertid")
		values(nBundledetailid,nBaseBDid);
	end if;
			
end if;

	open ref for select 1 as msg,nBundledetailid as "nBundledetailid", 'success' as value;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
