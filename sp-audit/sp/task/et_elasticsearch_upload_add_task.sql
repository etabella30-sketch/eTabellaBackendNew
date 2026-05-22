CREATE OR REPLACE FUNCTION task.et_elasticsearch_upload_add_task(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE 
	nUPid uuid;nBundledetailid uuid;nTid uuid;nRid int default 8;nTDid uuid;nCaseid uuid;
BEGIN

nUPid := NULLIF(parameter ->>'nUPid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;

select "nTid","nCaseid" into nTid,nCaseid
	From "UploadMaster" where "nUPid" = nUPid and "nTid" is not null;

if(nTid IS NOT NULL)then

    INSERT INTO task."TaskDetail"("nTid","nBDid")
		values(nTid,nBundledetailid) returning "nTDid" into nTDid;

 	INSERT INTO task."TaskRemarkDetail"("nTDid","nRid")
		select "nTDid",nRid 
		from task."TaskDetail" where "nTDid" = nTDid;

	OPEN ref FOR 
		select 1 as msg,nTDid as "nTDid",nTid as "nTid",nCaseid as "nCaseid",
		 "nSectionid","nBundleid","nBundledetailid" from "BundleDetail" where "nBundledetailid" = nBundledetailid;

		
	--	select 1 as msg, ;

	--nCaseid, nSectionid, nBundleid, nBundledetailid

else
	
    OPEN ref FOR 
		select -1 as msg;

end if;

    RETURN ref;
END;
$function$
