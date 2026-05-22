CREATE OR REPLACE FUNCTION realtime.et_factsheet_links(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nFSid UUID;nMasterid uuid;
BEGIN

nFSid := (parameter ->>'nFSid')::UUID;
nMasterid := (parameter->>'nMasterid')::uuid;

/*
 select * from realtime.et_factsheet_links ('{"nFSid":"f5812de0-bd2d-481d-b014-8dabfd9ce799"}','r1');fetch all in "r1";

 select * From "ContactMaster" order by "dCreateDt" desc

select * from "FMLinks" order by "dCreateDt" desc
 	select * from bundlesource
 select * From "FMContact" where "nFSid" = '4033d5b3-4e2f-4502-9ee4-4a6582f12c2a'
*/
    OPEN ref1 FOR
	select f."jLinktype",f."jHighlights",f."jOTexts",f."nBundledetailid",f."nFSid",f."nFMLid",
	d."cFilename",d."cTab",d."cExhibitno",d."cBundletag"
	from "FMLinks" f
	join bundlesource d on d."nBundledetailid" = f."nBundledetailid"
	where f."nFSid" = nFSid ;

	
    RETURN NEXT ref1;
    
    
END;
$function$
