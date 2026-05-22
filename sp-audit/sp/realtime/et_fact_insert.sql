CREATE OR REPLACE FUNCTION realtime.et_fact_insert(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFsid uuid;
nBundledetailid uuid;cFType text;
nMasterid uuid;nColorid uuid;Color text;nQFSid uuid;nCaseid uuid;
cFFrom text;
nSesid uuid;
-- select * from "FactMaster"
-- select * from "RIssueMaster"
-- select * from et_insert_fact('{"nBundledetailid":123,"nMasterid":2}','r');fetch all in "r"
BEGIN
nBundledetailid := NULLIF(parameter->>'nBDid','')::uuid;
nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
nColorid := NULLIF(parameter->>'nColorid','')::uuid;
cFType := parameter->>'cFtype';
nQFSid := NULLIF(parameter->>'nQFSid','')::uuid;
nCaseid := NULLIF(parameter->>'nCaseid','')::uuid;
cFFrom := parameter->>'cFFrom';
nSesid := NULLIF(parameter->>'nSesid','')::uuid;

-- nCaseid = (select s."nCaseid" from "SectionMaster" s join "BundleDetail" d on d."nSectionid" = s."nSectionid" where d."nBundledetailid" = nBundledetailid limit 1);

if(nQFSid IS NOT NULL)then
	if exists(select * from "FactMaster" where "nUserid" = nMasterid and "nFSid" = nQFSid)then
		delete from "FactMaster"  where "nFSid" = nQFSid;
		delete from "FactDetail"  where "nFSid" = nQFSid;
		delete from "FMIssue"  where "nFSid" = nQFSid;
		delete from "FMShared"  where "nFSid" = nQFSid;
		delete from "Annotations" where "nFSid" = nQFSid;
	end if;
end if;

	insert into "FactMaster" ("nSesid","nUserid","cFType","dCreateDt","nCaseid", "cFFrom","nBundledetailid")
	values(nSesid,nMasterid,cFType,now(),nCaseid, cFFrom,nBundledetailid)
	RETURNING "nFSid" INTO nFSid;
	
	select "cColor" into Color from "RIssueMaster" where "nIid" = nColorid;

	open ref for select 1 msg,nFSid "nFSid",color;
    RETURN ref;
END;
$function$
