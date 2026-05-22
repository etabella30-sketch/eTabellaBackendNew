CREATE OR REPLACE FUNCTION public.migrations_insertbundle(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
                    
declare nCaseid text; nBundleid uuid; nPrentbundleid uuid; nOldcaseid uuid default null; nExistsid uuid; x record; counter int default 0; rec RECORD;
cur_folders REFCURSOR; nParentexists uuid;  -- Cursor to iterate over temp_folders
                    
BEGIN
                    
nCaseid := parameter ->>'nCaseid';
/*                    
select * From migrations_insertbundle('{}','r');fetch all in "r"        

select * from temp_folders                    
               
select count(*) from "BundleMaster"  where "nTempbundleid" is not null
7500

truncate table "BundleMaster" restart identity;

select count(*) from "BundleMaster"
*/                 
                    
drop table if exists temp_folders;
create temp table temp_folders as                     
  WITH tbl AS (
        SELECT "nBundleid", "nFolderid", "nCaseid", "cBundlename", COALESCE("nParentBundleid", 0) AS "nParentBundleid", "nUserid", "cBundletag","dCreateDt"
        FROM dblink('host=localhost dbname=etabella.com2 user=postgres password=postgres',
            'SELECT "nBundleid","nFolderid","nCaseid","cBundlename", COALESCE("nParentBundleid", 0) AS "nParentBundleid", "nUserid", "cBundletag","dCreateDt"
             FROM "BundleMaster" WHERE "dDelDt" IS NULL   '  )
        AS com_cases("nBundleid" int, "nFolderid" int, "nCaseid" int, "cBundlename" text, "nParentBundleid" int, "nUserid" int, "cBundletag" text,"dCreateDt" timestamp)
    )  SELECT c."nCaseid", t."nBundleid" as id,null::uuid as "nBundleid",null::uuid as "nParentBundleid", t."nParentBundleid" as parentid,  t."cBundlename" as name, coalesce(u."nUserid",null) as "nUserid", 
      s."nSectionid",t."cBundletag",t."dCreateDt" ,false as "isAffected"
        FROM "tbl" t
        JOIN "CaseMaster" c ON c."nOCaseid" = t."nCaseid"
        JOIN "SectionMaster" s ON s."nOSectionid" = t."nFolderid"
        left JOIN "UserMaster" u ON u."nOUserid" = t."nUserid"
        ORDER BY c."nCaseid",s."nSectionid",t."nBundleid" DESC;



					
  FOR rec IN select * from temp_folders order by "nCaseid","id" --,"dCreateDt" desc,"id"
  LOOP 


  select * into x from "temp_folders" t where t.id = rec.id;
  counter = counter + 1;
  RAISE NOTICE 'Processing: counter=%,name=%', counter,x."name";

  RAISE NOTICE 'Processing: id=%,nParentBundleid=%', x.id,x."nParentBundleid";
  nExistsid := null;
  if(nOldcaseid!=x."nCaseid")then
  nBundleid = null;
  nOldcaseid = x."nCaseid";
  end if;
  nBundleid := COALESCE(
             x."nBundleid",
             CASE WHEN x."nParentBundleid" IS NULL THEN
               null
             ELSE
               x."nParentBundleid"
             END,
             null
          );

                   /* 	nParentexists := coalesce(nBundleid,0);

                  		nExistsid := (select "nBundleid" from "BundleMaster" where ("nSectionid" = x."nSectionid" 
                  			and  coalesce("nParentBundleid",0) = coalesce(nBundleid,0) and trim(upper("cBundlename")) = trim(upper(x.name))) ); -- or ((coalesce("nTempbundleid",0))>0 and "nTempbundleid" = x."id" )
                    */

  select "nBundleid","nParentBundleid" into nExistsid,nParentexists 
    from "BundleMaster" where ("nSectionid" = x."nSectionid" 
    and CASE WHEN nBundleid IS NULL THEN "nParentBundleid" IS NULL ELSE "nParentBundleid" = nBundleid END 
    and trim(upper("cBundlename")) = trim(upper(x.name))) or ((coalesce("nTempbundleid",0))>0 and "nTempbundleid" = x."id" ) limit 1;

  if nExistsid IS NULL then
  -- select * from "BundleMaster"
  insert into "BundleMaster"("cBundlename","nParentBundleid","nSectionid","cBundletag","nTempbundleid","nTempparentbundleid","nCreateId","dCreateDt")
  values(x.name,nBundleid,x."nSectionid",x."cBundletag",x.id,x.parentid,coalesce(x."nUserid",'00000000-0000-0000-0000-000000000000'::uuid),x."dCreateDt")
  RETURNING "nBundleid" INTO nExistsid;
  update temp_folders set "isAffected" = true where "id" = x.id;
  else
    
    update "BundleMaster" set "nTempbundleid" = x."id","nTempparentbundleid" = x."parentid" where "nBundleid" = nExistsid;
    
    update temp_folders set "nBundleid" = nExistsid,"nParentBundleid" = nParentexists where id = x."id";

    

  end if;
  update temp_folders set "nBundleid" = nExistsid where "id" = x.id;
  update temp_folders set "nParentBundleid" = nExistsid where "parentid" = x.id;

  RAISE NOTICE 'Processing: id=%,nParentBundleid=%,existid=%', x.id,(select "nParentBundleid" from "temp_folders" where "parentid" = x.id limit 1),nExistsid;

  END LOOP;
                    
  -- Open the cursor for selecting records from temp_folders table


  open ref for 
   with tbl as (
   update "BundleMaster" b set "nParentBundleid" = CASE WHEN t."nParentBundleid" IS NULL THEN b."nParentBundleid" ELSE t."nParentBundleid" END 
   from temp_folders t 
   where coalesce(b."nTempbundleid",0)>0 and t."id" = b."nTempbundleid" 
   and b."nBundleid" in (select s."nBundleid" from "temp_folders" s where t."isAffected" = true )  --and t."isAffected" = true;
   
    returning b."nBundleid"
      ) select * from "tbl";
  --select 1 as msg;
                    
RETURN ref;                                                       -- Return the cursor to the caller
    END;
                  
$function$
