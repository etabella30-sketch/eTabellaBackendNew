CREATE OR REPLACE FUNCTION download.et_insert_download_process_new(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nCaseid uuid;nSectionid uuid;
jFolder jsonb;jFiles jsonb;
nDPid uuid;isExistingJob boolean default false;

 batch_ids    uuid[];

BEGIN

/*

 select * from download.et_insert_download_process ('{"nCaseid":1131,"nSectionid":9350,"nMasterid":377}','r1');fetch all in "r1";

select * From download."ProcessMaster"
select * From download."Options"
select * From download."Users"

*/
 
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;

jFolder := coalesce((parameter ->>'jFolders')::jsonb,'[]'::jsonb);
jFiles := coalesce((parameter ->>'jFiles')::jsonb,'[]'::jsonb);

	WITH RECURSIVE bdl_tree AS (
      SELECT bm."nBundleid", bm."cBundlename", bm."nParentBundleid"
      FROM "BundleMaster" bm
      JOIN "SectionMaster" sm
        ON sm."nSectionid" = bm."nSectionid"
      LEFT JOIN "BMPermission" bp
        ON bp."nBundleid" = bm."nBundleid"
       AND bp."nUserid" = nMasterid
      WHERE   coalesce(bp."nBMPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid --  bp."nBMPid" is null
        AND sm."nCaseid" = nCaseid
        AND bm."nSectionid" = nSectionid
        AND (
          -- when client asked “all” (no folders/files) we start at root
          (jsonb_array_length(jFolder) = 0 AND jsonb_array_length(jFiles) = 0
            AND bm."nParentBundleid" IS NULL)
          -- otherwise only the explicit folder list
          OR (jFolder IS NOT NULL and jsonb_array_length(jFolder) > 0
            AND jFolder @> to_jsonb(bm."nBundleid"))
        )
      UNION ALL
        SELECT c."nBundleid", c."cBundlename", c."nParentBundleid"
        FROM "BundleMaster" c
        JOIN bdl_tree p
          ON c."nParentBundleid" = p."nBundleid"
        LEFT JOIN "BMPermission" bp
          ON bp."nBundleid" = c."nBundleid"
         AND bp."nUserid" = nMasterid
        WHERE  coalesce(bp."nBMPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid --  bp."nBMPid" is null
  ),
  final_data AS (
    SELECT bd."nBundledetailid"
    FROM "BundleDetail" bd
    JOIN bdl_tree t
      ON t."nBundleid" = bd."nBundleid"
    LEFT JOIN "BDPermission" bp
      ON bp."nBundledetailid" = bd."nBundledetailid"
     AND bp."nUserid" = nMasterid
    WHERE  coalesce(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid -- bp."nBDPid" is null

    UNION

    -- files directly in the section (no bundle)
    SELECT bd."nBundledetailid"
    FROM "BundleDetail" bd
    LEFT JOIN "BDPermission" bp
      ON bp."nBundledetailid" = bd."nBundledetailid"
     AND bp."nUserid" = nMasterid
    WHERE   coalesce(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid -- bp."nBDPid" is null
      AND bd."nSectionid" = nSectionid
	  and   CASE WHEN jsonb_array_length(jFolder) = 0 and jsonb_array_length(jFiles) = 0 THEN
	  coalesce(bd."nBundleid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid
		when jsonb_array_length(jFiles) > 0 then jFiles @> to_jsonb(bd."nBundledetailid") and not exists (select * from "bdl_tree" bt where bt."nBundleid" = bd."nBundleid")	ELSE false end
  )
  SELECT
    array_agg("nBundledetailid" ORDER BY "nBundledetailid")
  INTO batch_ids
  FROM final_data;

 --  batch_ids :=  ('{"b1dcf8a8-d743-41db-b5bb-81a300d97368","81ee9130-d815-487c-b6c0-74bfc01bda6d","79524b8e-6c33-4bef-9409-ce5b197975b0","3b8b87cb-52eb-4c6f-8aff-2ba5dc4cb66e","3df92a57-b8c2-46d1-84d6-84ad56d578ed","d4f1bd41-f4d0-48ec-8682-b7e16c273650","2271a5e5-1367-490c-9937-569118e7745a","e94aa11f-25aa-4b35-907a-c117dbee2720","4878c83b-a111-4567-885e-3599d6d5f128","24804219-e7d4-4419-a77d-f0debf0d758d","a9b1b222-9692-4a52-affe-cb3f7636c3a7","b7338ec8-9a7b-4d3f-91de-6fbcbaeb594c","560f4149-3e4d-499e-85bd-d8db2b4d4c6b","132e9376-f78b-4a42-8670-74b777a62e74","727ddabe-bbf1-4a0d-b7d8-8d55ec799310","1a8d89d1-41ec-4acf-a73e-d20a230163db","7b3f3f80-97cc-4156-bf55-85d4886bb617","6cafc51d-c1bc-47f7-8baa-659a55f00808","da0fcf95-20e6-49a1-8ce2-5c9b971bf131","3e549723-b875-4b7e-9c79-86a8a5bcd32b","1c0ac984-2baa-45d5-9b55-ce20fd246e6b","93b3e3b4-5cb5-419f-b2ca-e014850c62fd","588e5bbd-01db-419c-9694-64fbd4af9d9a","02b896b7-48d7-4ebc-86df-f74036198dd0","1caa9429-e305-4b43-ac38-ba53138441fe","64e16d28-ecab-489f-ac48-23763e717e37","ec3b5ea2-5f7d-4b93-915d-0f5eb6d5fe12","1e84ec6a-dbc6-46af-8c6d-0276dbb82884","06a7bda4-5ebb-4475-8f33-62d2de8f1f3c","81407c13-e757-4154-86b2-afc997f0a000"}'::uuid[]);
raise notice 'nCaseid %',nCaseid;

raise notice 'batch_ids %',array_length(batch_ids,1);

	SELECT pb."nDPid" INTO   nDPid
	  FROM   download."ProcessBatchs" pb
	  JOIN   download."ProcessMaster" pm ON  pb."nDPid" = pm."nDPid"
	 WHERE   pm."cStatus"    NOT IN ('E','F') AND 
	 pm."nCaseid"    =  nCaseid AND pm."nSectionid" =  nSectionid
	GROUP  BY pb."nDPid" HAVING 
		   -- 1) same number of distinct bids
		   COUNT(DISTINCT pb."nBundledetailid") = cardinality(batch_ids)
	   AND -- 2) every bid is one of the expected ones
		   bool_and(pb."nBundledetailid" = ANY(batch_ids))
	LIMIT  1;
 
	 IF FOUND THEN
	    isExistingJob := true;
	 ELSE 

			insert into download."ProcessMaster"("nCaseid","nSectionid","nCreateId","jFiles","jFolders")
			values (nCaseid,nSectionid,nMasterid,jFiles,jFolder)
			returning "nDPid" into nDPid;
			
			insert into download."ProcessStatusLogs"("nDPid","cStatus","dLogDt")
			values(nDPid,'Q',now());
	
	end if;			
	-- raise notice 'false';

	if(isExistingJob and (select "nCreateId" from download."ProcessMaster" where "nDPid"= nDPid) = nMasterid) then 
		
		open ref for select -1 as msg,case when "cStatus" = 'C' then 'Already Downloaded.' else 'Download Already Inprocess' end as value,nDPid as "nDPid",isExistingJob as "isExistingJob" from download."ProcessMaster" where "nDPid"= nDPid;
		
	else 

		insert into download."Users"("nDPid","nUserid","dCreateDt")
			values (nDPid,nMasterid,now());

		open ref for select 1 as msg,'Download Process Started' as value,nDPid as "nDPid",isExistingJob as "isExistingJob";
		
	end if;

 

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
