CREATE OR REPLACE FUNCTION public.et_upload_updatefileinfo(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare 
nMasterid uuid;
cFilename text;
nSectionid uuid;
nBundleid uuid;
nBundledetailid uuid;
cFiletype text;
isValidate boolean;
cPath text;
cFilesize text;
nPagerotation int;
cPage text;
isTranscript boolean;
nUDid uuid;
nUPid uuid;
cOldpath text;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
cFilename := parameter ->>'cFilename';
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
cFiletype := parameter ->>'cFiletype';
isValidate := nullif((parameter ->>'isValidate'),'');
cPath := parameter ->>'cPath';
cFilesize := parameter ->>'cFilesize';
nPagerotation := parameter ->>'nPagerotation';
cPage := parameter ->>'cPage';
isTranscript := parameter ->>'bisTranscript';
nUDid := NULLIF(parameter ->>'nUDid','')::uuid;
/*

select * from et_upload_updatefileinfo ('{"nBundledetailid":"6d8b43bf-f1d3-4ff5-a97d-27d6f5c1541e","nMasterid":"8a8b7c9e-2f9a-4f5d-b6a7-c8d9e0f1b2a3","cFilename":"test2.pdf","nSectionid":"4c5d6e7f-8a9b-0c1d-2e3f-456789abcdef","nBundleid":"00000000-0000-0000-0000-000000000000","cFiletype":"PDF","isValidate":true,"cPath":"demo3.pdf","cFilesize":"200000","Pagerotation":90,"cPage":"1-50"}','refcursor'); FETCH All in "refcursor";

select * From "BundleDetail" order by 1 desc limit 10 
select * From "BDAttributes" order by 1 desc  limit 10 
select * From "UploadMaster" order by 1 desc limit 10 

alter table "UploadMaster" add column "nTotal" int

*/
if(nUDid IS NOT NULL) then
nUPid := (select "nUPid" from "UploadDetail" where "nUDid" = nUDid);

if(nBundledetailid IS NOT NULL) then

	select "cPath" into cOldpath from  "BundleDetail" where "nBundledetailid" = nBundledetailid; 

	update "BundleDetail" set "cPath" = cPath,"cFilename"=cFilename ,"dUpdateDt" = now(),"nUpdateId" = nMasterid,"cPage" = cPage,"cRefpage" = null,"cFilesize" =(case when coalesce(cFilesize,'') !='' then cFilesize else "cFilesize" end),"cFiletype" =(case when coalesce(cFiletype,'') !='' then cFiletype else "cFiletype" end) where "nBundledetailid" = nBundledetailid;

	update "BDAttributes" set "nEStatus" = null where "nBundledetailid" = nBundledetailid;
	-- select * from "PTaskDetail" limit 5
	delete from "PTaskDetail" where "nID" = nBundledetailid;
	delete from "ConvertLog" where "nBundledetailid" = nBundledetailid;
	
	cOldpath := case when cOldpath != cPath then cOldpath else null end;
	

else
	
	insert into "BundleDetail"("nBundleid","nSectionid","cFilename","cPath","dCreateDt","nCreateId","cStatus","cPage","cFilesize","cFiletype")
	values(nBundleid,nSectionid,cFilename,cPath,now(),nMasterid,case when isTranscript = true then 'T' else (case when isValidate = true then 'C' else 'V' end) end,cPage,coalesce(cFilesize,'0'),cFiletype) 
	returning "nBundledetailid" into nBundledetailid;

	
	insert into "BDAttributes" ("nBundledetailid")
	values(nBundledetailid);

	if (nUPid IS NOT NULL) then 
	update "UploadMaster" set "nCompleted" = ("nCompleted" + 1)  where "nUPid" = nUPid;
	end if;

end if;

update "UploadDetail" set "isUploaded" = true,"cStatus" = (case when isValidate = true then 'C' else 'V' end) ,"nBundledetailid" = nBundledetailid where "nUDid" = nUDid;

if(nBundledetailid IS NOT NULL) then

	if (nUPid IS NOT NULL) then 
		
		update "UploadMaster" m set "nCompleted" =d."totalComplete" from (
			select "nUPid",count(distinct d."nUDid") as "totalComplete"
			from "UploadDetail" d
			where d."nUPid" = nUPid
			group by  "nUPid"
		)d  where m."nUPid" = nUPid and m."nUPid" = d."nUPid";
	
	end if;
	
end if;

	-- select * From "UploadDetail" 

	open ref for select 1 as msg,nBundledetailid as "nBundledetailid",(case when isValidate = true then 'C' else 'I' end) as "cStatus",cOldpath "cOldpath";

else
	open ref for select 1  as msg,'00000000-0000-0000-0000-000000000000'::uuid as "nBundledetailid", 'C' as "cStatus",true "isBatch",cOldpath "cOldpath";
end if;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
