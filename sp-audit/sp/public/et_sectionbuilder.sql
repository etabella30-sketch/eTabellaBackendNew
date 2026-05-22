CREATE OR REPLACE FUNCTION public.et_sectionbuilder(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nCaseid uuid;nSectionid uuid;cFolder text;nUserid uuid;cFoldertype text;cPermission text;
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
cFolder := parameter ->>'cFolder';
cPermission := parameter ->>'permission';
cFoldertype := parameter ->>'cFoldertype';
/*
select * From "SectionMaster" order by 1 desc
*/
 
 if(cPermission='N')then
    if not exists(select* from "SectionMaster" where "nCaseid" = nCaseid and trim(upper("cFolder")) = trim(upper(cFolder)) )then 
    
        insert into "SectionMaster"("cFolder","cFoldertype","cIcon","nUserid","nCaseid","dCreateDt")
        values(cFolder,cFoldertype,'mst.svg',null::uuid,nCaseid,now())
        RETURNING "nSectionid" INTO nSectionid;
        
        open ref for select 1 as msg,'created' value,nSectionid;
    else
        open ref for select -1 as msg,'Section already exists' as value;
    end if;
 end if;
 
 
 if(cPermission='E')then
    if not exists(select* from "SectionMaster" where "nCaseid" = nCaseid and trim(upper("cFolder")) = trim(upper(cFolder)) and "nSectionid"!=nSectionid )then 
        update "SectionMaster" set "cFolder" = cFolder where "nSectionid" = nSectionid; 
        open ref for select 1 as msg,'updated' as value,nSectionid;
    else
        open ref for select -1 as msg,'Section already exists' as value;
    end if;
 end if;
 
  
 if(cPermission='D')then
    if not exists(select * from "SectionMaster" where "nSectionid" = nSectionid and "cFoldertype" = 'MB')then
    
            delete from "SectionMaster" where "nSectionid" = nSectionid;
            
            open ref for select 1 as msg,'Deleted' as value;
    
    else
            open ref for select -1 as msg,'Section can not be delete' as value;
    end if;
    
 end if;
 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
