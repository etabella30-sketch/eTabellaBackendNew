CREATE OR REPLACE FUNCTION public.et_share_sectionbundle_new(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;
    nSectionid uuid;
    bIsannotation BOOLEAN;
    jUsers JSONB;
    nBundleid uuid;
    nBundledetailid uuid;jBundleids uuid[];
	chielderanIds uuid[];
	parentIds uuid[];
	username text;
	bIsalert boolean;
	jShareids jsonb;
	jBundles uuid[];
	jBDids uuid[];
BEGIN
    -- Parse input JSON once
    nMasterid := NULLIF(parameter ->> 'nMasterid','')::uuid;
    nSectionid := NULLIF(parameter ->> 'nSectionid','')::uuid;
    bIsannotation := COALESCE((parameter ->> 'bIsannotation')::BOOLEAN, FALSE);
	bIsalert := COALESCE((parameter ->> 'bIsalert')::BOOLEAN, FALSE);
    jUsers := COALESCE((parameter ->> 'jUsers')::JSONB, '[]'::JSONB);
    nBundleid := NULLIF(parameter ->> 'nBundleid','')::uuid;
    nBundledetailid := NULLIF(parameter ->> 'nBundledetailid','')::uuid;
	jShareids := COALESCE((parameter ->> 'jShareids')::jsonb, '[]'::jsonb);

	
	
-- select * from et_share_sectionbundle ('{""nSectionid"":9039,""nBundleid"":9355,""nBundledetailid"":0,""jUsers"":""[272]"",""bIsannotation"":true,""nMasterid"":367}','r1');fetch all in ""r1"";
	if(jShareids is not null and jsonb_array_length(jShareids) >0) then
			jBundles := array(select (t->0)::uuid from jsonb_array_elements(jShareids::jsonb) t);
			jBDids := array(select (t->1)::uuid from jsonb_array_elements(jShareids::jsonb) t);
	end if;
	
		parentIds := (array(WITH RECURSIVE bdl_tree AS (
        -- Select the base case (the root folder or initial folder)
	        SELECT bm."nParentBundleid" "nBundleid"
	        FROM "BundleMaster" bm
	        WHERE case when nBundleid IS NOT NULL or array_length(jBundles,1) > 0 then bm."nBundleid" = nBundleid or bm."nBundleid" = any(jBundles) else "nBundleid" = '00000000-0000-0000-0000-000000000000'::uuid end  and "nSectionid" = nSectionid
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
     COALESCE("nParentBundleid", '00000000-0000-0000-0000-000000000000'::uuid) NOT IN (SELECT UNNEST(parentIds))
			else false end  and "nSectionid" = nSectionid
			
			));

		
		chielderanIds := (array(WITH RECURSIVE bdl_tree AS (
        -- Select the base case (the root folder or initial folder)
	        SELECT bm."nBundleid"
	        FROM "BundleMaster" bm
	        WHERE case when nBundleid IS NOT NULL or array_length(jBundles,1) > 0 then bm."nParentBundleid" = nBundleid or bm."nParentBundleid" = any(jBundles) else "nParentBundleid" IS NOT NULL end  and "nSectionid" = nSectionid
	        UNION ALL
	        -- Recursive selection for child folders
	        SELECT c."nBundleid"
	        FROM "BundleMaster" c
	        JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid")
			select "nBundleid" from bdl_tree)
		);

	
    -- Update BDShare table
	delete from  "BDShare" where "nSectionid" = nSectionid and (COALESCE("nBundleid",'00000000-0000-0000-0000-000000000000'::uuid) = ANY(jBundleids)) and COALESCE("nBundledetailid",'00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(nBundledetailid,'00000000-0000-0000-0000-000000000000'::uuid);

	delete from "BDShare" where "nSectionid" = nSectionid and case when nBundledetailid IS NULL then (COALESCE("nBundleid",'00000000-0000-0000-0000-000000000000'::uuid) = ANY(chielderanIds)) or "nBundleid" = nBundleid else false end 
	and jUsers @> to_jsonb("nUserid");
	
	delete from "BDShare" where "nSectionid" = nSectionid and (case when nBundledetailid IS NULL then "nBundleid" = nBundleid else false end or case when nBundleid IS NULL then true else false end);

	

	insert into "BDShare" ("nSectionid","nBundleid","nBundledetailid","nUserid","nMasterid","bIsannotation")
    SELECT distinct 
        "nSectionid", 
        case when nBundledetailid IS NOT NULL then nBundleid else COALESCE(bid,'00000000-0000-0000-0000-000000000000'::uuid) end, 
        nBundledetailid, 
        nUserid::uuid AS "nUserid", 
        nMasterid, 
        bIsannotation
    FROM jsonb_array_elements_text(jUsers) AS nUserid
	join "SectionMaster" sm on sm."nUserid" = nUserid::uuid and "cFoldertype" = 'CB'
	left join unnest(jBundleids) AS bid on true
   where NOT EXISTS (
		SELECT 1
		FROM "BDShare" b		
		WHERE b."nUserid" = nUserid::uuid AND b."nSectionid" = nSectionid
		  AND (nBundleid IS NULL OR b."nBundleid" = nBundleid OR COALESCE("nBundleid",'00000000-0000-0000-0000-000000000000'::uuid) = bid or COALESCE("nBundleid",'00000000-0000-0000-0000-000000000000'::uuid) NOT IN (SELECT UNNEST(parentIds))) 
		  AND (nBundledetailid IS NULL OR b."nBundledetailid" = nBundledetailid)
	) and  jsonb_array_length(jShareids) = 0 ;

	if(jShareids is not null and jsonb_array_length(jShareids) >0) then
	
			insert into "BDShare" ("nSectionid","nBundleid","nBundledetailid","nUserid","nMasterid","bIsannotation")
			select distinct "nSectionid",(bundle->0)::uuid,(bundle->1)::uuid, nUserid::uuid AS "nUserid", nMasterid, bIsannotation		
	    FROM jsonb_array_elements(jShareids::jsonb) bundle,jsonb_array_elements_text(jUsers) AS nUserid
		join "SectionMaster" sm on sm."nUserid" = nUserid::uuid and "cFoldertype" = 'CB'
		left join unnest(jBundleids) AS bid on true
		where  NOT EXISTS (
			SELECT 1
			FROM "BDShare" b		
			WHERE b."nUserid" = nUserid::uuid AND b."nSectionid" = nSectionid
			  AND (b."nBundleid" = (bundle->0)::uuid OR COALESCE("nBundleid",'00000000-0000-0000-0000-000000000000'::uuid) = bid or COALESCE("nBundleid",'00000000-0000-0000-0000-000000000000'::uuid) NOT IN (SELECT UNNEST(parentIds))) 
			  AND (b."nBundledetailid" = (bundle->1)::uuid)
		) 
			;
	end if;
	

-- select * from et_share_sectionbundle ('{""nSectionid"":9088,""nBundleid"":0,""nBundledetailid"":0,""jUsers"":""[29]"",""bIsannotation"":true,""bIsalert"":true,""nMasterid"":367}','r1');fetch all in ""r1"";

	select "cFname" || ' ' || coalesce("cLname",'') into username from "UserMaster" where "nUserid" = nMasterid;
	IF(bIsalert and exists (select 1 from "UserMaster" where jUsers @> to_jsonb("nUserid") AND nullif("cToken",'') is not null)) THEN 
		OPEN ref1 FOR 
		select distinct 1 msg,'Shared successfully' value,bIsalert "bIsalert",u."nUserid",c."nCaseid",'Shared ' || "cFolder" as "cTitle",u."cToken",
			username || ' Shared ' || (case when nBundledetailid IS NULL and nBundleid IS NULL then "cFolder" when nBundledetailid IS NULL then bm."cBundlename" else "cFilename" end) || ' With you | Case no. ' || c."cCaseno" as "cMsg"
			from "SectionMaster" sh	
			join "CaseMaster" c on c."nCaseid" = sh."nCaseid"
			join "UserMaster" u on jUsers @> to_jsonb(u."nUserid") AND nullif(u."cToken",'') is not null 
			left join "BundleMaster" bm on bm."nSectionid" = sh."nSectionid" and bm."nBundleid" = nBundleid
			left join "BundleDetail" bd on bd."nSectionid" = sh."nSectionid" and "nBundledetailid" = nBundledetailid
			where sh."nSectionid" = nSectionid;

	ELSE 

   	 OPEN ref1 FOR select 1 msg,'Shared successfully' value,bIsalert "bIsalert"; 
	END IF;

    RETURN NEXT ref1;
END;
$function$
