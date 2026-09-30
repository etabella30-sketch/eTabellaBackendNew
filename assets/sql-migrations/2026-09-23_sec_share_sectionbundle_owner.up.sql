-- 2026-09-23_sec_share_sectionbundle_owner (apply)
--
-- Security remediation phase 4: public.et_share_sectionbundle (coreapi POST bundles-creations/sharesectionbundle).
--   * Single-document branch (nBundledetailid set, bIsannotation) copied EVERY user's facts (FMShared) and
--     doclinks (DMShared) on that document to the recipients - the folder branch and the delete step filter
--     on f/d."nUserid" = nMasterid, this branch did not. Now it does (same as coreapi's direct-file path).
--   * New guard: the caller must be a member of the section's case (or a global admin); otherwise one
--     row msg = -1 (coreapi's isShareSectionBundleSuccess treats it as a failure and returns it).
--     A single-document share must name a document of the section's case (BundleDetail -> SectionMaster
--     ."nCaseid"); dev 2026-09-23: all 44 existing document shares pass that check.
--
-- NOT changed (follow-up): the member rule still lets any case member share another member's private
-- ('CB', SectionMaster."nUserid" set) section - e.g. with themselves. Every dev share row today comes from
-- the section owner (CB) or is on an owner-less section (MB), so "owner, or member when the section has no
-- owner, or global admin" would not refuse any existing flow.
-- Also NOT changed: the BDShare deletes / "already shared" checks stay unscoped (one row per recipient, and
-- an empty jUsers clears the section / bundle / document for everyone), as on dev today. Scoping them to
-- the caller (per-sharer rows) was tried and dropped in review: a second sharer then adds a second row and
-- the recipient's et_bundledetail list shows the document twice, and a private-section owner could no
-- longer clear shares another member made of it. Per-sharer rows need et_bundledetail (and the other
-- BDShare readers) to de-duplicate first.
--
-- No service change required; coreapi already routes single-file annotation shares to its own owner-
-- filtered SQL (executeDirectFileShare), so this closes the SP for older builds / other callers.
-- That coreapi path has NO membership / same-case check of its own (it never reaches this SP) - follow-up.
-- Body identical on dev and in the 2026-09-22 prod backup.
--
-- OPERATOR: run against the intended database only. Check first:
--     SELECT current_database();   -- dev = etabella_tech_uuid, prod = etabella.com.uuid
-- No hard current_database() guard on purpose: this file is meant to be applied to dev first and to
-- prod later by the operator. Before applying anywhere, re-dump each function (pg_get_functiondef)
-- and diff it against the .down.sql file; if it differs, rebuild both files from that dump.
--
-- Drafted 2026-09-23 from the live dev bodies (etabella_tech_uuid). NOT applied anywhere.

BEGIN;

-- ============ public.et_share_sectionbundle ============
CREATE OR REPLACE FUNCTION public.et_share_sectionbundle(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid UUID;
    nSectionid UUID;
    bIsannotation BOOLEAN;
    jUsers JSONB;
    nBundleid UUID;
    nBundledetailid UUID; jBundleids UUID[];
    chielderanIds UUID[];
    parentIds UUID[];
    username text;
    bIsalert boolean;
    jShareids jsonb;
    jBundles UUID[];
    jBDids UUID[];
    jNotifyusers UUID[];
BEGIN
    -- Parse input JSON once
    nMasterid := (parameter ->> 'nMasterid')::UUID;
    nSectionid := (parameter ->> 'nSectionid')::UUID;
    bIsannotation := COALESCE((parameter ->> 'bIsannotation')::BOOLEAN, FALSE);
    bIsalert := COALESCE((parameter ->> 'bIsalert')::BOOLEAN, FALSE);
    jUsers := COALESCE((parameter ->> 'jUsers')::JSONB, '[]'::JSONB);
    nBundleid := (parameter ->> 'nBundleid')::UUID;
    nBundledetailid := (parameter ->> 'nBundledetailid')::UUID;
    jShareids := COALESCE((parameter ->> 'jShareids')::jsonb, '[]'::jsonb);

    -- 2026-09-23 sec: nMasterid is the acting user (coreapi JwtMiddleware sets it from the token). Only a
    -- member of the section's case (TeamRelation) or a global admin may change that section's shares.
    -- A single-document share must also name a document of that same case: the document id is written
    -- into BDShare as sent (the folder queries below are already bound to nSectionid), so without this a
    -- member of one case could list another case's document under his own section (et_bundledetail).
    IF nMasterid IS NULL OR NOT (
        EXISTS (SELECT 1 FROM "UserMaster" su WHERE su."nUserid" = nMasterid AND su."isAdmin" = true)
        OR EXISTS (SELECT 1 FROM "SectionMaster" ssm JOIN "TeamRelation" tr ON tr."nCaseid" = ssm."nCaseid"
                   WHERE ssm."nSectionid" = nSectionid AND tr."nUserid" = nMasterid))
       OR (nBundledetailid IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM "BundleDetail" sbd
            JOIN "SectionMaster" sds ON sds."nSectionid" = sbd."nSectionid"
            JOIN "SectionMaster" ssm ON ssm."nSectionid" = nSectionid
            WHERE sbd."nBundledetailid" = nBundledetailid AND sds."nCaseid" = ssm."nCaseid")) THEN
        OPEN ref1 FOR select -1 msg,'You are not authorized to share from this section' value,bIsalert "bIsalert";
        RETURN NEXT ref1;
        RETURN;
    END IF;

    
    
-- select * from et_share_sectionbundle ('{"nSectionid":9039,"nBundleid":9355,"nBundledetailid":0,"jUsers":"[272]","bIsannotation":true,"nMasterid":367}','r1');fetch all in "r1";
    if(jShareids is not null and jsonb_array_length(jShareids) > 0) then
            jBundles := array(select (t->0)::UUID from jsonb_array_elements(jShareids::jsonb) t);
            jBDids := array(select (t->1)::UUID from jsonb_array_elements(jShareids::jsonb) t);
    end if;
    
        parentIds := (array(WITH RECURSIVE bdl_tree AS (
        -- Select the base case (the root folder or initial folder)
            SELECT bm."nParentBundleid" "nBundleid"
            FROM "BundleMaster" bm
            WHERE case when nBundleid IS NOT NULL or array_length(jBundles,1) > 0 then bm."nBundleid" = nBundleid or bm."nBundleid" = any(jBundles) else "nBundleid" IS NULL end and "nSectionid" = nSectionid
            UNION ALL
            -- Recursive selection for child folders
            SELECT c."nParentBundleid" "nBundleid"
            FROM "BundleMaster" c
            JOIN bdl_tree p ON c."nBundleid" = p."nBundleid")
            select "nBundleid" from bdl_tree)
        );

        jBundleids := (array(
            SELECT bm."nBundleid"
            FROM "BundleMaster" bm
            WHERE case when nBundleid IS NOT NULL or array_length(jBundles,1) > 0 then bm."nBundleid" = nBundleid or bm."nBundleid" = any(jBundles) 
             and  
     "nParentBundleid" IS NULL OR "nParentBundleid" NOT IN (SELECT UNNEST(parentIds))
            else false end and "nSectionid" = nSectionid
            
            ));

        
        chielderanIds := (array(WITH RECURSIVE bdl_tree AS (
        -- Select the base case (the root folder or initial folder)
            SELECT bm."nBundleid"
            FROM "BundleMaster" bm
            WHERE case when nBundleid IS NOT NULL or array_length(jBundles,1) > 0 then bm."nParentBundleid" = nBundleid or bm."nParentBundleid" = any(jBundles) else "nParentBundleid" IS NOT NULL end and "nSectionid" = nSectionid
            UNION ALL
            -- Recursive selection for child folders
            SELECT c."nBundleid"
            FROM "BundleMaster" c
            JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid")
            select "nBundleid" from bdl_tree)
        );

    
    -- Update BDShare table
-- select * from "BDAssignment"

	 if(nBundledetailid is distinct from null) then
		delete from "FMShared" where "nFSid" in 
		(select "nFSid" from "FactMaster" f where "nBundledetailid" = nBundledetailid and f."nUserid" = nMasterid);
	
		delete from "DMShared" where "nDocid" in 
		(select "nDocid" from "DocMaster" d where "nBundledetailid" = nBundledetailid and d."nUserid" = nMasterid);
	else
		delete from "FMShared" where "nFSid" in 
		(select "nFSid" from "FactMaster" f 
		join "BundleDetail" b on b."nBundledetailid" = f."nBundledetailid"
		join "BDAssignment" ba on ba."nBundledetailid" = b."nBundledetailid"
		where case when nBundleid is not distinct from null then ba."nSectionid" = nSectionid else ba."nBundleid" = ANY(chielderanIds) end
		and f."nUserid" = nMasterid
		);

		delete from "DMShared" where "nDocid" in 
		(select "nDocid" from "DocMaster" d 
		join "BundleDetail" b on b."nBundledetailid" = d."nBundledetailid"
		join "BDAssignment" ba on ba."nBundledetailid" = b."nBundledetailid"
		where case when nBundleid is not distinct from null then ba."nSectionid" = nSectionid else ba."nBundleid" = ANY(chielderanIds) end
		and d."nUserid" = nMasterid);
		
	 end if;
	
    delete from "BDShare" where "nSectionid" = nSectionid and ("nBundleid" = ANY(jBundleids)) and "nBundledetailid" = nBundledetailid AND (
      jsonb_array_length(jUsers) > 0 
          AND jUsers @> to_jsonb("nUserid") 
      OR jsonb_array_length(jUsers) = 0
  );

    delete from "BDShare" where "nSectionid" = nSectionid and case when nBundledetailid IS NULL then ("nBundleid" = ANY(chielderanIds)) or "nBundleid" = nBundleid else false end 
    AND (
      jsonb_array_length(jUsers) > 0 
          AND jUsers @> to_jsonb("nUserid") 
      OR jsonb_array_length(jUsers) = 0
  );
    
    delete from "BDShare" where "nSectionid" = nSectionid and (case when nBundledetailid IS NULL then "nBundleid" = nBundleid else false end or case when nBundleid IS NULL then true else false end) AND (
      jsonb_array_length(jUsers) > 0 
          AND jUsers @> to_jsonb("nUserid") 
      OR jsonb_array_length(jUsers) = 0
  );

 ---  select * from "FMShared"


    
with users as (
    insert into "BDShare" ("nSectionid","nBundleid","nBundledetailid","nUserid","nMasterid","bIsannotation")
    SELECT distinct 
        nSectionid, 
        case when nBundledetailid IS NOT NULL then nBundleid else bid end, 
        nBundledetailid, 
        nUserid::UUID AS "nUserid", 
        nMasterid, 
        bIsannotation
    FROM jsonb_array_elements_text(jUsers) AS nUserid
    left join unnest(jBundleids) AS bid on true
   where NOT EXISTS (
        SELECT 1
        FROM "BDShare" b        
        WHERE b."nUserid" = nUserid::UUID AND b."nSectionid" = nSectionid
          AND (nBundleid IS NULL OR b."nBundleid" = nBundleid OR "nBundleid" = bid OR "nBundleid" IN (SELECT UNNEST(parentIds))) 
          AND (nBundledetailid IS NULL OR b."nBundledetailid" = nBundledetailid)
    ) and jsonb_array_length(jShareids) = 0 
    
    RETURNING "nUserid" as id ) select ARRAY_AGG(id) into jNotifyusers from users;

    if(jShareids is not null and jsonb_array_length(jShareids) > 0) then
    
with users as (
        insert into "BDShare" ("nSectionid","nBundleid","nBundledetailid","nUserid","nMasterid","bIsannotation")
        select distinct nSectionid,(bundle->0)::UUID,(bundle->1)::UUID, nUserid::UUID AS "nUserid", nMasterid, bIsannotation        
    FROM jsonb_array_elements_text(jUsers) AS nUserid,jsonb_array_elements(jShareids::jsonb) bundle    
    left join unnest(jBundleids) AS bid on true
    where NOT EXISTS (
        SELECT 1
        FROM "BDShare" b        
        WHERE b."nUserid" = nUserid::UUID AND b."nSectionid" = nSectionid
          AND (b."nBundleid" = (bundle->0)::UUID OR "nBundleid" = bid OR "nBundleid" NOT IN (SELECT UNNEST(parentIds))) 
          AND (b."nBundledetailid" = (bundle->1)::UUID)
    )
     RETURNING "nUserid" as id ) select ARRAY_AGG(id) into jNotifyusers from users;




	 
    end if;

	-- select * from "FMShared"
if(bIsannotation) then
	 if(nBundledetailid is  distinct from null) then
		insert into "FMShared" ("nFSid","nUserid")
		-- 2026-09-23 sec: only the sharer's own facts / doclinks (as the folder branch below and the delete above)
		select "nFSid",nUserid::uuid from "FactMaster" f,jsonb_array_elements_text(jUsers) AS nUserid where "nBundledetailid" = nBundledetailid and f."nUserid" = nMasterid;
		
		insert into "DMShared" ("nDocid","nUserid")
		(select "nDocid",nUserid::uuid from "DocMaster" d,jsonb_array_elements_text(jUsers) AS nUserid where "nBundledetailid" = nBundledetailid and d."nUserid" = nMasterid);
	else
		insert into "FMShared" ("nFSid","nUserid")
		(select distinct "nFSid",nUserid::uuid from "FactMaster" f 
		join "BundleDetail" b on b."nBundledetailid" = f."nBundledetailid"
		join "BDAssignment" ba on ba."nBundledetailid" = b."nBundledetailid",jsonb_array_elements_text(jUsers) AS nUserid
		where case when nBundleid is not distinct from null then ba."nSectionid" = nSectionid else ba."nBundleid" = ANY(chielderanIds) end
		and f."nUserid" = nMasterid);
	
		raise notice 'chielderanIds %',chielderanIds;
		
		insert into "DMShared" ("nDocid","nUserid")
		(select distinct "nDocid",nUserid::uuid from "DocMaster" d 
		join "BundleDetail" b on b."nBundledetailid" = d."nBundledetailid"
		join "BDAssignment" ba on ba."nBundledetailid" = b."nBundledetailid",jsonb_array_elements_text(jUsers) AS nUserid
		where case when nBundleid is not distinct from null then ba."nSectionid" = nSectionid else ba."nBundleid" = ANY(chielderanIds) end
		and d."nUserid" = nMasterid);
	
		
	 end if;
 end if;
    

-- select * from et_share_sectionbundle ('{"nSectionid":9088,"nBundleid":0,"nBundledetailid":0,"jUsers":"[29]","bIsannotation":true,"bIsalert":true,"nMasterid":367}','r1');fetch all in "r1";

    select "cFname" || ' ' || coalesce("cLname",'') into username from "UserMaster" where "nUserid" = nMasterid;
    -- IF(bIsalert and exists (select 1 from "UserMaster" where jUsers @> to_jsonb("nUserid") AND nullif("cToken",'') is not null)) THEN 
	 IF(bIsalert and exists (select 1 from "UserMaster" where jUsers @> to_jsonb("nUserid"))) THEN 
        OPEN ref1 FOR 
        select distinct 1 msg,'Shared successfully' value,bIsalert "bIsalert",u."nUserid",c."nCaseid",'Shared ' || "cFolder" as "cTitle",u."cToken",
            username || ' Shared ' || (case when nBundledetailid IS NULL and nBundleid IS NULL then "cFolder" when nBundledetailid IS NULL then bm."cBundlename" else "cFilename" end) || ' With you | Case no. ' || c."cCaseno" as "cMsg"
            from "SectionMaster" sh    
            join "CaseMaster" c on c."nCaseid" = sh."nCaseid"
            join "UserMaster" u on jUsers @> to_jsonb(u."nUserid") -- AND nullif(u."cToken",'') is not null 
            left join "BundleMaster" bm on bm."nSectionid" = sh."nSectionid" and bm."nBundleid" = nBundleid
            left join "BundleDetail" bd on bd."nSectionid" = sh."nSectionid" and "nBundledetailid" = nBundledetailid
            where sh."nSectionid" = nSectionid;

    ELSE 

        OPEN ref1 FOR select 1 msg,'Shared successfully' value,bIsalert "bIsalert"; 
    END IF;

    RETURN NEXT ref1;
END;
$function$;

COMMIT;
