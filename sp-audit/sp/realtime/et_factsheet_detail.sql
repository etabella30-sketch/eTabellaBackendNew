CREATE OR REPLACE FUNCTION realtime.et_factsheet_detail(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nFSid UUID;nMasterid uuid;

	isAdmin boolean default false;
	nRoleid uuid;nTeamid uuid;nCaseid uuid;
	bIsTranscipt boolean default false;
BEGIN

nFSid := (parameter ->>'nFSid')::UUID;
nMasterid := (parameter->>'nMasterid')::uuid;
bIsTranscipt := COALESCE(parameter ->> 'bIsTranscipt','false')::boolean;

isAdmin := case when exists (  select * from "UserMaster" where "nUserid" = nMasterid and "isAdmin" = true )  then true  else false  end;
 
	select "nCaseid" into nCaseid from "FactMaster" where  "nFSid" =  nFSid;
	select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nMasterid and "nCaseid" = nCaseid limit 1;
	if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then 
		isAdmin := true;
	end if;
/*
 select * from realtime.et_factsheet_detail ('{"nFSid":"d6b9a088-a181-49c0-a9be-783faa9c4d3a"}','r1');fetch all in "r1";

 select * From "FactDetail"
 
 select * From "FMShared"
 
*/
    OPEN ref1 FOR
	select f."dCreateDt",f."cFType",f."nFSid",f."nUserid", 
	d."jDate",d."nFiletype",d."nStatus",d."cType",d."jLinktype",d."jTexts",d."jOT",d."cIsNote",d."nColorid",
	-- CASE on bIsTranscipt so the published-view SP returns the transferred
	-- (page, line) written by run3.py during transferAnnotations. Mirrors the
	-- canonical pattern in et_marks.sql:57-58 for RHighlights.
	CASE WHEN COALESCE(bIsTranscipt,false) THEN d."nTPage" ELSE d."nPage" END AS "nPage",
	CASE WHEN COALESCE(bIsTranscipt,false) THEN d."nTLine" ELSE d."nLine" END AS "nLine",
	(u."cFname" || ' ' || coalesce(u."cLname", '')) AS "cCreatedBy",
	
	case when f."nUserid" = nMasterid or isAdmin then true else  fs."nFSid" is not null end as "bCanView",
	f."nUserid" = nMasterid or isAdmin as "bCanDelete",
	case when f."nUserid" = nMasterid or isAdmin then true else  fs."bCanComment" end as "bCanComment",
	case when f."nUserid" = nMasterid or isAdmin then true else  fs."bCanEdit" end as "bCanEdit",
	case when f."nUserid" = nMasterid or isAdmin then true else  fs."bCanReshare" end as "bCanReshare",
	rs."cName",
	b."cFilename",
	b."cTab",
	bm."cBundletag"
	From "FactMaster" f
	join "FactDetail" d on d."nFSid" = f."nFSid"
	join "UserMaster" u on u."nUserid" = f."nUserid"
	left join "RSessionMaster" rs on rs."nSesid" = f."nSesid"
	left join "BundleDetail" b on b."nBundledetailid" = f."nBundledetailid"
	left join "BundleMaster" bm on bm."nBundleid" = b."nBundleid"
	left join "FMShared" fs on fs."nFSid" = f."nFSid" and fs."nUserid" = nMasterid
	where f."nFSid" = nFSid
	  -- Orphan filter: on the published view, suppress facts whose annotation
	  -- could not be re-anchored (run3.py stamped 'O' and cleared jTCordinates).
	  AND (
	    COALESCE(bIsTranscipt, false) = false
	    OR (d."cTransferStatus" IS DISTINCT FROM 'O' AND d."jTCordinates" IS NOT NULL)
	  );
    RETURN NEXT ref1;
    
    
END;
$function$
