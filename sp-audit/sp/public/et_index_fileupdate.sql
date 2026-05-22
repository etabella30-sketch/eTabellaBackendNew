CREATE OR REPLACE FUNCTION public.et_index_fileupdate(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nCaseid uuid;nSectionid uuid;cPath text;nPage int;
nBundledetailid uuid;cFilename text;

-- select * from et_index_fileupdate ('{"cPath":"doc/case22/index_92_1718008312271.pdf","nCaseid":22,"nSectionid":92,"nPage":973,"cFilename":"Master Bundle 2"}','r1');fetch all in "r1";

BEGIN
-- select * from et_update_index ('{"cPath":"doc/case279/index_829_1716873637834.pdf","nCaseid":279,"nSectionid":829,"nPage":215}','r1');fetch all in "r1";
cFilename:= parameter ->>'cFilename';
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid:= NULLIF(parameter->>'nSectionid','')::uuid;
cPath:= parameter->>'cPath';
nPage:= parameter->>'nPage';
nMasterid:= NULLIF(parameter->>'nMasterid','')::uuid;

	if exists (select * from "BundleDetail" where "cIsindex" = true and  "nSectionid" = nSectionid) then
		select "nBundledetailid" into nBundledetailid from "BundleDetail" where "cIsindex" = true and "nSectionid" = nSectionid limit 1;
		
		update "BundleDetail" set "cFilename" = cFilename || '.pdf',"cPath"= cPath,"cPage"=('1-'||nPage::text),"cRefpage"=('1-'||nPage::text),"dUpdateDt"=now(),"nUpdateId"=nMasterid where "nBundledetailid" = nBundledetailid;
				
		
	else
	-- select * from "BundleDetail"
	-- select * from "BDAttributes" limit 1
		insert into "BundleDetail"("nBundleid","nSectionid","cFilename","cPath","cPage","dCreateDt","nCreateId","cStatus","cIsindex","cFiletype")
		values (null,nSectionid,cFilename || '.pdf',cPath,('1-'||nPage::text),now(),nMasterid,'C',true,'PDF')
		RETURNING "nBundledetailid" INTO nBundledetailid;
		
		insert into "BDAttributes"("nBundledetailid")
		values(nBundledetailid);
	end if;
	
open ref for select 1 msg,nBundledetailid "nBundledetailid",cFilename || '.pdf' "cName";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
