CREATE OR REPLACE FUNCTION public.et_upload_checkduplicacy_old(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid UUID;nCaseid UUID;nSectionid UUID;nBundleid UUID;d jsonb;rec RECORD;
    new_id UUID;nMainbundleid UUID;nExistsid UUID;parentid UUID;jRecord jsonb;nUPid UUID;

BEGIN
nMasterid := (parameter ->>'nMasterid')::UUID;
nCaseid := (parameter ->>'nCaseid')::UUID;
nSectionid := (parameter ->>'nSectionid')::UUID;
nBundleid := (parameter ->>'nBundleid')::UUID;
nMainbundleid := (parameter ->>'nBundleid')::UUID;
d := parameter ->>'d';

/*

select * from et_upload_checkduplicacy ('{}','refcursor'); FETCH All in "refcursor";

select * From "BundleDetail" where "nBundleid" = 1687555
select * From "BundleMaster" order by 1 desc limit 10 
select * From "BundleMaster" where "nBundleid" = 1687555

select * from et_upload_checkduplicacy ('{"nCaseid":264,"nSectionid":811,"nBundleid":1687555,"d":"[[1,0,\"F1 C-383.pdf\",false],[2,0,\"F2 C-044.pdf\",false],[3,0,\"F3 C-384.pdf\",false],[4,0,\"F4 C-385.pdf\",false],[5,0,\"F5 C-386.pdf\",false],[6,0,\"F6 C-042.pdf\",false],[7,0,\"F7 R-0062.pdf\",false],[8,0,\"F8 C-045.pdf\",false],[9,0,\"F9 C-387.pdf\",false],[10,0,\"F10 C-046.pdf\",false],[11,0,\"F11 C-240.pdf\",false]]","nMasterid":3}','r1');fetch all in "r1";
*/

/*
drop table if exists temp_table;
create temp table temp_table as 
select (ar->>0)::int "id",case when (ar->>1)::int  = 0 then nBundleid else (ar->>1)::int end  as "parentid",(ar->>2)::text "name",(ar->>3)::boolean "isFolder",0 "nBundleid",0 "nBundledetailid"
from jsonb_array_elements(d) as ar(elm);*/

drop table if exists temp_folders;
create temp table temp_folders as 
select (ar->>0)::int "id",case when (ar->>1)::int = 0 then nBundleid else (ar->>1)::UUID end as "parentid",(ar->>2)::text "name",(ar->>3)::boolean "isFolder",NULL::UUID "nBundleid",NULL::UUID "nBundledetailid"
from jsonb_array_elements(d) as ar(elm);

    FOR rec IN SELECT * FROM temp_folders where "isFolder" = true -- jsonb_array_elements(jFolders)
     LOOP
        nExistsid = NULL;
        parentid = COALESCE(nBundleid, NULL);
        
        if(rec.parentId IS NOT NULL)then
            if exists (select * from "BundleMaster" where "nSectionid" = nSectionid and "cTempid" = (rec.parentId)::text )then 
            nBundleid := (select "nBundleid" from "BundleMaster" where "nSectionid" = nSectionid and "cTempid" = (rec.parentId)::text limit 1);
            end if;
            
        else
            nBundleid := nMainbundleid;
        end if;
        
        nExistsid = (select "nBundleid" from "BundleMaster" where "nSectionid" = nSectionid and "nParentBundleid" IS NOT DISTINCT FROM COALESCE(nBundleid, NULL) and trim(upper("cBundlename")) = trim(upper(rec.name))); -- REMAIN CHECK

            if (nExistsid IS NULL)then
                --RAISE NOTICE 'exists' ;
                parentid := COALESCE((select "nBundleid" from "BundleMaster" where "cTempid" = (rec.parentId)::text and "nSectionid" = nSectionid order by "nBundleid" desc limit 1), COALESCE(nMainbundleid, NULL));
                    
                insert into "BundleMaster"("cBundlename","nParentBundleid","cTempid","nSectionid","nCreateId","dCreateDt")
                values(rec.name,parentid,rec.id,nSectionid,nMasterid,now());
                                
                nExistsid = (select max("nBundleid") from "BundleMaster");
                update temp_folders set "nBundleid" = nExistsid where "id" = rec.id;
                
            else
                --RAISE NOTICE 'not exists' ;
                update "BundleMaster" set "cTempid" = rec.id where "nBundleid" = nExistsid;
                update temp_folders set "nBundleid" = nExistsid where "id" = rec.id;
            
            end if;
        
    END LOOP;

update temp_folders t1 set "nBundleid" = t2."nBundleid" from temp_folders t2 where t1."parentid" = t2."id" and t1."nBundleid" IS NULL;

-- select * from "BundleDetail" limit 1
update "temp_folders" t1 set "nBundledetailid" = t."nBundledetailid" from "BundleDetail" t where t1."isFolder" = false and t."nBundleid" IS NOT DISTINCT FROM COALESCE(NULLIF(t1."nBundleid",NULL),nMainbundleid) and t."nSectionid" = nSectionid and t."cFilename" = t1.name;

/*
select * from "UploadMaster"
select * from "UploadDetail"

*/

insert into "UploadMaster" ("nCaseid","nBundleid","nSectionid","nUserid","dCreateDt")
values (nCaseid,nBundleid,nSectionid,nMasterid,now())
rETURNING "nUPid" into nUPid;

if(nUPid IS NOT NULL)then
    
    insert into "UploadDetail" ("nUPid","cUnicid","cName","cStatus","dCreateDt")
    select nUPid,id,name,'P',now() from temp_folders t;
    
end if;

open ref for
SELECT 1 as msg,nUPid,jsonb_agg(ARRAY[id, COALESCE(NULLIF("nBundleid",NULL),nMainbundleid)] || 
       CASE 
           WHEN "nBundledetailid" IS NOT NULL THEN ARRAY["nBundledetailid"] 
           ELSE ARRAY[]::UUID[]
       END )AS "jResult"
FROM temp_folders t;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
