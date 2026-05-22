CREATE OR REPLACE FUNCTION public.et_workspace_organize(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nCaseid uuid;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

/*

select * From et_workspace_organize('{"nMasterid":2,"nCaseid":289}','r1');fetch all in "r1";

select * From "FactMaster" 
select * From "FactDetail" limit 0 
select * From "FMShared" 
select * From "FMLinks" 
select * From "FMContact" 
select * From "FMTasks" 
*/

open ref for
	select f."nFSid",f."nBundledetailid",f."cFType",f."dCreateDt",d."jLinktype",d."jTexts",
	count(l."nFMLid")>0 as "isFactlink",
	 (d."jDate"->'type') is not null as "isDate",
	 (d."jDate"->'date1') is not null as "isTime",
	case when d."nFiletype" > 0  then true else false end as "isFiletype",
	case when d."nStatus" > 0 then true else false end as "isStatus",
	case when d."nTZid" > 0 then true else false end as "isTimezone",
	true as "isIssue",
	count(fc."nFMCid")::integer as "isContact",
	count(ft."nFMTsid")::integer as "isTasks",
	count(s."nFMSdid")>0 as "isShared",
	bd."cFilename",bd."cTab",bd."cExhibitno",bd."cBundletag"
	from "FactMaster" f
	join "FactDetail" d on d."nFSid" = f."nFSid"
	join "bundlesource" bd on bd."nBundledetailid" = f."nBundledetailid"
	left join "FMShared" s on s."nFSid" = f."nFSid"
	left join "FMLinks" l on l."nFSid" = f."nFSid"
	left join "FMContact" fc on fc."nFSid" = f."nFSid"
	left join "FMTasks" ft on ft."nFSid" = f."nFSid"
	where (f."nUserid" = nMasterid or s."nUserid" = nMasterid ) and f."nCaseid" = nCaseid
	group by f."nFSid",f."nBundledetailid",f."cFType",f."dCreateDt",d."jLinktype",d."jTexts",d."jDate",d."nFiletype",d."nStatus",
	d."nTZid",bd."cFilename",bd."cTab",bd."cExhibitno",bd."cBundletag"
	order by f."dCreateDt" desc
	;

	
 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
