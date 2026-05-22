CREATE OR REPLACE FUNCTION public.et_get_filedata(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nBundledetailid uuid;cTab text;nCaseid uuid; cType text;
BEGIN
-- select * from et_get_filedata('{"nBundledetailid":"528961-uuid-format","cTab":"A1","nCaseid":"289-uuid-format","nMasterid":"59-uuid-format"}','r');fetch all in "r"
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
cTab := parameter ->>'cTab';
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
cType := coalesce(parameter ->>'cType', 'M');
-- select * From "BundleDetail" b where "nSectionid" is null
	if(coalesce(cTab,'')!='')then
	nBundledetailid = (select "nBundledetailid" From "BundleDetail" b 
		join "SectionMaster" s on s."nSectionid" = b."nSectionid" 
		where s."nCaseid" = nCaseid and trim(upper(b."cTab")) =  trim(upper(cTab)) limit 1);
	end if;
	if exists(select * from "RecentFiles" where "nBDid" = nBundledetailid and "nUserid" = nMasterid) then
		update "RecentFiles" set "dCreateDt" = now(), "cType" = cType where "nBDid" = nBundledetailid and "nUserid" = nMasterid;
	else
		insert into "RecentFiles"("nBDid","nUserid","dCreateDt", "cType")
		values (nBundledetailid,nMasterid,now(), cType);
	end if;
	
	-- select * from "BDAttributes"
OPEN ref1 FOR 
select "cPath" as "cPath","cPage","cRefpage","cFiletype","cFilename" ,b."nBundledetailid","nSectionid","bIsconvert"
	from "BundleDetail" b
	JOIN "BDAttributes"  ba on ba."nBundledetailid" =b."nBundledetailid"
	where b."nBundledetailid" = nBundledetailid;
RETURN NEXT ref1;
	 
END;
$function$
