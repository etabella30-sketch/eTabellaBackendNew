CREATE OR REPLACE FUNCTION public.et_upload_update_convertinfo(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; cFilename text; nSectionid uuid; nBundleid uuid;
nBundledetailid uuid; cFiletype text; isValidate boolean;
cPath text; cFilesize text; nPagerotation int; cPage text; isTranscript boolean; nUDid uuid; nUPid uuid;
bMetadata boolean; nBaseBDid uuid; cOldpath text;

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
bMetadata := case when coalesce((parameter ->>'bMetadata'),'true')::text = 'true' then true else false end;
nBaseBDid := NULLIF(parameter ->>'nBaseBDid','')::uuid;
/*

select * from et_upload_updatefileinfo ('{""nBundledetailid"":528554,""nMasterid"":1,""cFilename"":""test2.pdf"",""nSectionid"":1,""nBundleid"":0,""cFiletype"":""PDF"",""isValidate"":true,""cPath"":""demo3.pdf"",""cFilesize"":""200000"",""Pagerotation"":90,""cPage"":""1-50""}','refcursor'); FETCH All in ""refcursor"";

select * From ""BundleDetail"" order by 1 desc limit 10 
select * From ""BDAttributes"" order by 1 desc  limit 10 
select * From ""UploadMaster"" order by 1 desc limit 10 

alter table ""UploadMaster"" add column ""nTotal"" int

*/

raise notice 'nBundledetailid %',nBundledetailid;
 
if(nBundledetailid IS NOT NULL) then
	select "cPath" into cOldpath from  "BundleDetail" where "nBundledetailid" = nBundledetailid; 

	update "BundleDetail" set "cPath" = cPath,"cFilename"=cFilename ,"dUpdateDt" = now(),"nUpdateId" = nMasterid,"cPage" = cPage,"cRefpage" = null,"cFilesize" =(case when coalesce(cFilesize,'') !='' then cFilesize else "cFilesize" end),"cFiletype" =(case when coalesce(cFiletype,'') !='' then cFiletype else "cFiletype" end),"cStatus"=(case when isValidate = true then 'C' else 'V' end) where "nBundledetailid" = nBundledetailid;

	-- select * from ""PTaskDetail"" limit 5
	delete from "PTaskDetail" where "nID" = nBundledetailid;
	delete from "ConvertLog" where "nBundledetailid" = nBundledetailid;
	
	cOldpath := case when cOldpath != cPath then cOldpath else null end;
else
	
	if exists(select 1 from "BundleDetail" where "nSectionid" = nSectionid and "nBundleid" = nBundleid and "cStatus" = 'C' and upper("cFilename") = upper(cFilename) and "cFiletype" = cFiletype) then 

		
			select "nBundledetailid" into nBundledetailid from "BundleDetail" where "nSectionid" = nSectionid and "nBundleid" = nBundleid and "cStatus" = 'C' and upper("cFilename") = upper(cFilename) and "cFiletype" = cFiletype limit 1;
		
		select "cPath" into cOldpath from  "BundleDetail" where "nBundledetailid" = nBundledetailid; 
 
			update "BundleDetail" set "cPath" = cPath,"cFilename"=cFilename ,"dUpdateDt" = now(),"nUpdateId" = nMasterid,"cPage" = cPage,"cRefpage" = null,"cFilesize" =(case when coalesce(cFilesize,'') !='' then cFilesize else "cFilesize" end),"cFiletype" =(case when coalesce(cFiletype,'') !='' then cFiletype else "cFiletype" end),"cStatus"=(case when isValidate = true then 'C' else 'V' end) where "nBundledetailid" = nBundledetailid;
-- select * from "PTaskDetail"

	-- select * from ""PTaskDetail"" limit 5
	delete from "PTaskDetail" where "nID" = nBundledetailid;
	delete from "ConvertLog" where "nBundledetailid" = nBundledetailid;

		
		cOldpath := case when cOldpath != cPath then cOldpath else null end;
	else 

raise notice 'nBundledetailid 2 %',nBundledetailid;

	
			insert into "BundleDetail"("nBundleid","nSectionid","cFilename","cPath","dCreateDt","nCreateId","cStatus","cPage","cFilesize","cFiletype")
			values(nBundleid,nSectionid,cFilename,cPath,now(),nMasterid,case when isTranscript = true then 'T' else (case when isValidate = true then 'C' else 'V' end) end,cPage,coalesce(cFilesize,'0'),cFiletype) 
			RETURNING "nBundledetailid" into nBundledetailid;
		-- select * from ""BundleDetail"" limit 10
			
			
			if(bMetadata = true and nBaseBDid IS NOT NULL) then
				update "BundleDetail" bd set "cTab" = bds."cTab","cExhibitno"=bds."cExhibitno" ,"dIntrestDt"=bds."dIntrestDt" ,"cDesc"=bds."cDesc" 
				from (select * from "BundleDetail" b where b."nBundledetailid" = nBaseBDid) bds 
				where  bd."nBundledetailid" = nBundledetailid;	
			end if;

			insert into "BDAttributes" ("nBundledetailid")
			values(nBundledetailid);
	end if;
	if (nUPid IS NOT NULL) then 
	update "UploadMaster" set "nCompleted" = ("nCompleted" + 1)  where "nUPid" = nUPid;
	end if;

end if;

	-- select * From ""UploadDetail"" 

	open ref for select 1 as msg,nBundledetailid as "nBundledetailid",cOldpath "cOldpath",(case when isValidate = true then 'C' else 'I' end) as "cStatus";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
