CREATE OR REPLACE FUNCTION public.et_bundlebuilder(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nCaseid uuid;nSectionid uuid;
nBundleid uuid;cBundlename text;cPermission text;nParentBundleid uuid;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;
nParentBundleid := NULLIF(parameter ->>'nParentBundleid','')::uuid;
cBundlename := parameter ->>'cBundlename';
cPermission := parameter ->>'permission';

-- select * from et_bundlebuilder ('{"nBundleid":"1342379-uuid-format","nSectionid":"92-uuid-format","cBundlename":"LOC D s","nParentBundleid":"00000000-0000-0000-0000-000000000000","nCaseid":"22-uuid-format","permission":"E","nMasterid":"2-uuid-format"}','r1');fetch all in "r1";

-- select * From "BundleMaster" order by 1 desc limit 10
-- select * From "BMPermission" where "nBundleid" = 1342379
if(cPermission = 'N')then
    
    if not exists(select * From "BundleMaster" where "nSectionid" = nSectionid and upper(trim("cBundlename")) = upper(trim(cBundlename)) and CASE WHEN nParentBundleid IS NOT NULL THEN "nParentBundleid" = nParentBundleid ELSE "nParentBundleid" IS NULL END)then
        
        insert into "BundleMaster" ("nSectionid","cBundlename","nParentBundleid","dCreateDt","nCreateId")
        values(nSectionid,cBundlename,nParentBundleid,now(),nMasterid)
        RETURNING "nBundleid" INTO nBundleid;
                
        update "CaseMaster" set "dUpdateDt" = now() where "nCaseid" = nCaseid;
        open ref for 
            
            select 1 as msg,'Created' as value,nBundleid as "nBundleid";
    else
        open ref for 
            select -1 as msg,'Bundle already exists' as value;
    end if;
    
end if;

if(cPermission = 'E')then
    if not exists(select * From "BundleMaster" where "nSectionid" = nSectionid and upper(trim("cBundlename")) = upper(trim(cBundlename)) and CASE WHEN nParentBundleid IS NOT NULL THEN "nParentBundleid" = nParentBundleid ELSE "nParentBundleid" IS NULL END and "nBundleid" != nBundleid)then
        
        update "BundleMaster" set "cBundlename" = cBundlename,"dUpdateDt" = now(),"nUpdateId" = nMasterid where "nBundleid" = nBundleid;
        
        
        open ref for 
            select 1 as msg,'Updated' as value;
    
    else
        open ref for 
            select -1 as msg,'Bundle already exists' as value;
    end if;

end if;
 
 
 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
