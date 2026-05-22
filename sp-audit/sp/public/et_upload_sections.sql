CREATE OR REPLACE FUNCTION public.et_upload_sections(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nCaseid uuid;isAdmin boolean default false;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
/*
 select * from et_upload_sections('{"nMasterid":367,"nCaseid":1079}','r1','r2');FETCH All in "r2"; 
 -- select * From "SectionMaster" order by 1 desc
 */

	select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nMasterid;
	if(isAdmin = false and (select count("nTRid") from "TeamRelation" where "nCaseid" = nCaseid and "nUserid" = nMasterid and "nRoleid" = '8632ee5c-e854-411c-b83d-c21656ad39ac'::uuid) > 0) then 
		isAdmin	:= true;
	end if;
	
OPEN ref1 FOR 
select "nSectionid","cFolder" ,"cFoldertype"
from "SectionMaster" where "nCaseid" = nCaseid and "nUserid" IS NULL
and "cFoldertype" != 'TS' and isAdmin = true -- and ("nUserid" = nMasterid or coalesce("nUserid",0) =0) order by "nSectionid"; 
;

RETURN NEXT ref1;

OPEN ref2 FOR 

select coalesce(s."nSectionid",'00000000-0000-0000-0000-000000000000'::uuid) "nSectionid",case when s."nSectionid" IS NOT NULL then s."cFolder" else "cCodename" end "cFolder","jOther"->>'cFlag' "cFoldertype","jOther"->>'cMsg' "cMsg"
,case when s."cFoldertype" = 'TS' and sd."nUserid" = nMasterid then true when s."nUserid" = nMasterid then true else false end "isActive"
from "Codemaster" c
left join "SectionMaster" s on s."cFoldertype" = ("jOther"->>'cFlag')::text and "nCaseid" = nCaseid and case when s."cFoldertype" = 'TS' then true else s."nUserid" = nMasterid end
left join "SectionDetail" sd on sd."nSectionid" = s."nSectionid" and sd."nUserid" = nMasterid
where "nCategoryid" = 13 and ("jOther"->>'cFlag') not in ('MB','ALL') 
and s."cFoldertype" != 'CB' and case when isAdmin = false then s."cFoldertype" not in ('TS','M') else true end 
order by "nCodeid"; --"cCodename" like '%Tra%'

RETURN NEXT ref2;
    
    
	
	
	
	 
END;
$function$
