CREATE OR REPLACE FUNCTION public.et_user_sectionbuilder(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid; nCaseid uuid; nSectionid uuid; cFolder text; nUserid uuid; cFoldertype text; cPermission text;
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
cFolder := parameter ->>'cFolder';
cFoldertype := parameter ->>'cFoldertype';
/*
select * From "SectionMaster" order by 1 desc
*/
if(cFoldertype ='CB' or cFoldertype ='CF'  or cFoldertype = 'TF') then
 	if not exists(select * from "SectionMaster" where "cFoldertype" = cFoldertype and "nCaseid" = nCaseid and "nUserid" = nMasterid) then
		insert into "SectionMaster"("cFolder","cIcon","nUserid","nCaseid","dCreateDt","cFoldertype")
		values(cFolder,case cFoldertype when 'CB' then 'cst.svg' else 'fld.svg' end,nMasterid,nCaseid,now(),cFoldertype)
		RETURNING "nSectionid" INTO nSectionid;
		
		open ref for select 1 as msg,'created' value,nSectionid;		
	else 
	
		update "SectionMaster" set "cFolder" = cFolder where "nSectionid" = nSectionid;
	
		open ref for select 1 as msg,'Updated.' value;
	end if;
-- select * from et_user_sectionbuilder ('{"nCaseid":1079,"nSectionid":9066,"cFolder":"Transcript sdf","permission":"N","cFoldertype":"TS","nMasterid":367}','r1');fetch all in "r1";
elsif(cFoldertype = 'TS') then
if(nSectionid IS NULL) then 
	select "nSectionid" into nSectionid from "SectionMaster" where "cFoldertype" = cFoldertype and "nCaseid" = nCaseid order by 1 limit 1;
end if;
	if not exists(select * from "SectionDetail" where "nUserid" = nMasterid and "nSectionid" = nSectionid) then 
	insert into "SectionDetail"("nUserid","nSectionid")
	select nMasterid,nSectionid;
	
	open ref for select 1 as msg,'created' value,nSectionid;
	else 
	open ref for select -1 as msg,'Section already exists.' value;
	end if;
	
end if;
 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
