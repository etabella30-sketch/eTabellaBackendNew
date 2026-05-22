CREATE OR REPLACE FUNCTION public.et_sections(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nCaseid uuid;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
/*
 select * from et_sections('{""nMasterid"":10,""nCaseid"":22}','r1');FETCH All in ""r1""; 
 -- select * From ""SectionMaster""
 */
	
OPEN ref1 FOR 
select "nSectionid","cFolder" ,"cFoldertype"
from "SectionMaster" where "nCaseid" = nCaseid and (CASE WHEN nMasterid IS NOT NULL THEN "nUserid" = nMasterid ELSE TRUE END) order by "nSectionid"; 

RETURN NEXT ref1;
    
	
	
	
	 
END;
$function$
