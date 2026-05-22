CREATE OR REPLACE FUNCTION transcript.et_transcript_insert_file(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare	cTransid uuid; nCaseid uuid;
	cPath text; cName text; nSectionid uuid;
	nBundledetailid uuid; nUserid uuid; cPage text;
	cFilesize text;
	
BEGIN
	nCaseid = parameter ->>'nCaseid';
	cPath = parameter ->>'cPath';
	cName = parameter ->>'cName';
	nUserid= parameter ->>'nUserid';
	cPage= parameter ->>'cPage';
	cFilesize= parameter ->>'cFilesize';

	select "nSectionid" into nSectionid from "SectionMaster" where "nCaseid" = nCaseid and "cFoldertype" = 'TS' order by "dCreateDt" limit 1;
		if exists(select * from "BundleDetail" where upper(trim("cFilename")) = upper(trim(cName)) and "nSectionid" = nSectionid and "nBundleid" is null and "cFiletype" = 'PDF' and "nCreateId" = nUserid) then 
			select "nBundledetailid" into nBundledetailid from "BundleDetail" where upper(trim("cFilename")) = upper(trim(cName)) and "nSectionid" = nSectionid and "nBundleid" is null and "cFiletype" = 'PDF' and "nCreateId" = nUserid;

		update "BundleDetail"  set "cPath" = cPath,"cPage" = cPage,"cFilesize"='PDF' where "nBundledetailid" = nBundledetailid ;
	

	else 
			insert into "BundleDetail" ("nSectionid","cFilename","cPath","dCreateDt","nCreateId","cPage","cFilesize","cFiletype","cStatus")
			values (nSectionid,cName,cPath,now(),nUserid,cPage,cFilesize,'PDF','C')
			returning "nBundledetailid" into nBundledetailid;
		
			insert into "BDAttributes" ("nBundledetailid")
			values (nBundledetailid);
		
			insert into "BDPermission" ("nBundledetailid","nTRid","nUserid")
			select nBundledetailid,"nTRid","nUserid"  from "TeamRelation" where "nCaseid" = nCaseid and "nUserid" != nUserid;
	end if;
	open ref for Select 1 msg, nBundledetailid "nBundledetailid";

    RETURN ref;
END;
$function$
