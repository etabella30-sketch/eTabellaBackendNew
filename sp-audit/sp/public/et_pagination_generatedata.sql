CREATE OR REPLACE FUNCTION public.et_pagination_generatedata(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nCaseid uuid;nSectionid uuid;nBundledetailid uuid;
nBundleid uuid;jsonData jsonb;cRefpage text;jPagination jsonb;bPagedefault boolean;
bApplyall boolean;jIds jsonb;

bundlels jsonb;
nStartpage int; row_nm int;sPg int;
current_row_record record; prev_ref_value text;nPtaskid uuid;jUsers jsonb;
nLogid uuid;
msgvalue text;

-- select * from "BundleDetail" 
BEGIN
-- select * from et_pagination_getdata('{""nSectionid"":72,""nBundleid"":6112,""nBundledetailid"":44174,""cRefpage"":""1-62"",""jPagination"":{""bc"": ""#fff"",""fc"": ""#000"",""fs"": ""16"",""ft"": ""arial"",""isHide"": false,""position"": ""BR""},""bPagedefault"":false}','r');fetch all in ""r"";
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nSectionid := NULLIF(parameter->>'nSectionid','')::uuid;
nBundleid := parameter->>'nBundleid';
nBundledetailid := parameter->>'nBundledetailid';

cRefpage := parameter->>'cRefpage';
jPagination := parameter->>'jPagination';
bApplyall :=(case when coalesce((parameter->>'bApplyall')::text,'') = '' then 'false' else (parameter->>'bApplyall')::text end);
-- jPagination = '{""bc"":""#fff"",""cb"":""#ffffff00"",""fc"":""#000"",""fs"":""16"",""ft"":""arial"",""isHide"":""false"",""position"":""BR""}'::jsonb;
bPagedefault := (case when coalesce((parameter->>'bPagedefault')::text,'') = '' then 'false' else (parameter->>'bPagedefault')::text end);

if(coalesce(cRefpage,'') != '') then 
	nStartpage := (select COALESCE(SPLIT_PART(coalesce(cRefpage,'1-1'), '-', 1)::int, 0));
end if;
--  select * from public.et_pagination_generatedata ('{"nBundledetailid":null,"nBundleid":"a9a42aa5-c3b8-442f-b05a-f119c46ae6a3","nSectionid":"59445b8f-f372-49d1-a443-8c597e7bd62d","cRefpage":"20-20","jPagination":"{\"fs\":\"16\",\"ft\":\"arial\",\"fc\":\"#000\",\"bc\":\"#fff\",\"cb\":\"#ffffff00\",\"position\":\"BR\",\"isHide\":false}","bApplyall":true,"bPagedefault":false,"nMasterid":"ba561c55-81f5-4180-8934-2ce6dcaa096c"}','r1');fetch all in "r1";

select "nCaseid" into nCaseid from "SectionMaster" where "nSectionid" = nSectionid;

	drop table if exists temp_bundle;
	if(coalesce(nBundledetailid,'00000000-0000-0000-0000-000000000000'::uuid) !='00000000-0000-0000-0000-000000000000'::uuid) then 
		create temp table "temp_bundle" as
		select ROW_NUMBER() OVER(PARTITION BY b."nBundleid" order by  sorted_tab,sorted_name) rownm,b."nBundledetailid","cPage",'' "ref" ,0::int page_count
		from "BundleDetail" b where "cIsindex" != true --and "nBundleid" IS NOT NULL 
		and "cPage" is not null and  LOWER(RIGHT("cPath", 4)) = '.pdf' and coalesce(nBundleid,'00000000-0000-0000-0000-000000000000'::uuid) = coalesce(b."nBundleid",'00000000-0000-0000-0000-000000000000'::uuid) and "nSectionid" = nSectionid  and case when bApplyall = true then true else b."nBundledetailid" = nBundledetailid end  ;
			  
			   select rownm into row_nm from temp_bundle where "nBundledetailid" = nBundledetailid;
			   
			   
			    raise notice 'rownm % nStartpage %', row_nm,nStartpage;

				
			   
if(bPagedefault = false and nStartpage > 0) then	
	sPg := nStartpage-1;
	-- prev_ref_value := sPg || '-' || sPg;
	UPDATE temp_bundle SET page_count =  CASE  WHEN "cPage" IS NULL OR "cPage" = '' THEN 0 ELSE COALESCE(SPLIT_PART("cPage", '-', 2)::int, 0) END;
	
	WITH numbered AS (
		  SELECT *,
		    coalesce(SUM(page_count) OVER (ORDER BY rownm ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING),0) + nStartpage AS start_page,
		    SUM(page_count) OVER (ORDER BY rownm) + nStartpage - 1 AS end_page
		  FROM temp_bundle
		  WHERE rownm >= row_nm
		)
		UPDATE temp_bundle t
		SET ref = (start_page || '-' || end_page)::text
		FROM numbered n
		WHERE t.rownm = n.rownm;

	/*

	
	FOR current_row_record IN SELECT rownm row,"nBundledetailid" id,"cPage" FROM temp_bundle where rownm >= row_nm ORDER BY row	--limit 3
		 LOOP
	  IF current_row_record."cPage" = '' THEN
	    CONTINUE;
	   end if;
	   
			    raise notice 'current_row_record page %', current_row_record."cPage";
            -- Calculate the new ref value based on the specified logic
			
            UPDATE temp_bundle
            SET ref = (
                SELECT
                    (COALESCE(SPLIT_PART(coalesce(prev_ref_value,'1-1'), '-', 2)::int, 0) + 1) || '-' || 
                    (COALESCE(SPLIT_PART(coalesce(prev_ref_value,'1-1'), '-', 2)::int, 0) + COALESCE(SPLIT_PART(coalesce(current_row_record."cPage",'1-1'), '-', 2)::int, 0))
            )::text
            WHERE rownm = current_row_record.row; 
     --   END IF;

        -- Update prev_ref_value for the next iteration
		
        	prev_ref_value := coalesce((select t.ref from temp_bundle t WHERE rownm = current_row_record.row limit 1),prev_ref_value);
    END LOOP;

	*/
end if;

select jsonb_agg(t) into bundlels from (
	select "nBundledetailid" "nID",case when bPagedefault =true  then (case when nStartpage > 0 then "cPage" else null end) when nStartpage > 0 then t.ref  else null end "cRefpage","cPage",jPagination "jPagination" FROM temp_bundle t where rownm >= row_nm
) t;
			raise notice 'bundlels length %', jsonb_array_length(bundlels);
else 
	
	WITH bundle_data AS (
	    SELECT  -- file."nSerial" AS row_num, 
		bd."nBundledetailid", bd."cPage", bundle."nParentBundleid",bd."cTab"
	    FROM (WITH RECURSIVE bdl_tree AS (
        -- Select the base case (the root folder or initial folder)
        SELECT bm."nBundleid",  bm."nParentBundleid"
        FROM "BundleMaster" bm
        WHERE bm."nBundleid" = nBundleid
        UNION ALL
        -- Recursive selection for child folders
        SELECT c."nBundleid", c."nParentBundleid"
        FROM "BundleMaster" c
        JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"
    ) select * from bdl_tree) bundle
	    JOIN "BundleDetail" bd ON bd."nBundleid" = bundle."nBundleid" 
	    WHERE "cIsindex" != true  AND "cPage" IS NOT NULL AND UPPER("cFiletype") = 'PDF' and
		case when coalesce(true,false) = true then true else bundle."nBundleid" =nBundleid end
	),order_serial as (
select row_number() over(PARTITION BY "nParentBundleid"  order by split_hierarchical_sort_multi("cTab", ARRAY['.', '-'])) as row_num,* from bundle_data

	),
	calculated_refs AS (
	    SELECT  "nBundledetailid" "nID", 
	        CASE  WHEN "cPage" = '' THEN NULL
			  ELSE case when bPagedefault =true  then (case when nStartpage > 0 then "cPage" else null end) when nStartpage > 0 then
	          (
	                nStartpage + SUM(CASE WHEN "cPage" != '' THEN COALESCE(SPLIT_PART("cPage", '-', 2)::INTEGER, 1) ELSE 0 END) 
	                OVER (PARTITION BY "nParentBundleid" ORDER BY row_num ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) - 
	                CASE WHEN "cPage" != '' THEN COALESCE(SPLIT_PART("cPage", '-', 2)::INTEGER, 1) ELSE 0 END					
	            )::TEXT || '-' || 
	            ((nStartpage-1) + SUM(CASE WHEN "cPage" != '' THEN COALESCE(SPLIT_PART("cPage", '-', 2)::INTEGER, 1) ELSE 0 END) 
	            OVER (PARTITION BY "nParentBundleid" ORDER BY row_num ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW))::TEXT
			 else null end
	        END AS "cRefpage","cPage",jPagination "jPagination"
	    FROM order_serial
	)
	SELECT jsonb_agg(t) into bundlels FROM calculated_refs t;
	
			raise notice 'bundlels length 2 %', jsonb_array_length(bundlels);

end if;

   update "BDAttributes" bd set "cIsPaginate" = true  from jsonb_populate_recordset(null::record,bundlels::jsonb) as t ("nID" uuid,"cRefpage" text,"jPagination" jsonb)  where bd."nBundledetailid" = t."nID";

select jsonb_agg(distinct t),jsonb_agg(distinct t."nID") into jsonData,jIds from (
	select bd."nBundledetailid" "nID",bd."cTab","cPath",t."cRefpage",t."jPagination" from "BundleDetail"bd,jsonb_populate_recordset(null::record,bundlels::jsonb) as t ("nID" uuid,"cRefpage" text,"jPagination" jsonb) 
	where bd."nBundledetailid" = t."nID" and coalesce(bd."cTab",'') !='' --and t."cRefpage" != bd."cRefpage"  --and coalesce("cRefpage",'') !=''
) t;

			    raise notice 'jsonData length % data %', jsonb_array_length(jsonData),jsonData;
 -- select t."nID",t."cTab",t."cPath",t."cRefpage",t."jPagination",pd."cTab" "cPTab",SUBSTRING(pd."cRefpage" FROM 1 FOR POSITION('-' IN pd."cRefpage") - 1) "nPStart",ba."cFVer" from
select jsonb_agg(t) into jsonData from (
select t."nID",t."cTab",t."cPath",t."cRefpage",t."jPagination",'' "cPTab",0 "nPStart",ba."cFVer" from 
		jsonb_populate_recordset(null::record,jsonData) as t ("nID" uuid, "cTab" text, "cPath" varchar(500), "cRefpage" varchar(20), "jPagination" jsonb) 
		join "BDAttributes" ba on ba."nBundledetailid" =t."nID"
		left join  RankedPTaskDetail pd on pd."nID" = t."nID"
		where coalesce(t."nID",'00000000-0000-0000-0000-000000000000'::uuid) !='00000000-0000-0000-0000-000000000000'::uuid and coalesce(t."cTab",'') != '' and coalesce(t."cRefpage",'') !=''
) t;

			    raise notice 'jsonData 2 length %', jsonb_array_length(jsonData);
-- truncate table "Paginationtask" restart identity
-- select * from "Paginationtask"	
-- alter table  "Paginationtask"	add column "jIds" jsonb

-- select jsonb_agg("nID") from jsonb_populate_recordset(null::record,jsonData)
if(jsonb_array_length(jsonData) > 0 and exists (select 1 from "Paginationtask" where "jsonData" = jPagination and "cStatus" = 'P' and "nCaseid" = nCaseid and "jIds" = jIds)) then 
	jsonData := '[]'::jsonb;
	if(msgvalue = '') then
		msgvalue := 'Pagination already in queue';
	end if;
elsif(jsonb_array_length(jsonData) > 0) then 
	if(msgvalue = '') then
		msgvalue := 'No file found for paginate';
	end if;
end if;

		if(jsonb_array_length (jsonData)> 0) then
			insert into "Paginationtask" ("nUserid","nCaseid","nNooffile","nNoofcomp","nStartBDid","cStatus","dCreateDt","jIds","jsonData")
			values(nMasterid,nCaseid,jsonb_array_length(jsonData),0,((jsonData::jsonb->0)->> 'nID')::uuid,'P',now(),jIds,jPagination)
			RETURNING "nPtaskid" INTO nPtaskid;

			insert into "PTaskDetail" ("nPtaskid","nID","cTab","cRefpage")
			select nPtaskid,"nID","cTab","cRefpage" from jsonb_populate_recordset(null::record,jsonData) as (
			"nID" uuid,"cTab" text, "cRefpage" varchar(20)) where "nID" IS NOT NULL;
			
				-- select * from "TeamRelation"
					select jsonb_agg(distinct us."nUserid") into jUsers 
					from "UserSetting" us
					left join "UserMaster" um on us."nUserid" = um."nUserid" 
					left join "TeamRelation" tr on us."nUserid" = tr."nUserid" 
					where um."isAdmin" = true or
					 (tr."nCaseid" = nCaseid and tr."nRoleid" = (select "nRoleid" from "RoleMaster" where "nSrno" = 1 limit 1));
			-- select * from "UserLog"
					 insert into "UserLog"("nLCatid","nUserid","jOther")
					 values(25,nMasterid,parameter)
					   RETURNING "nLogid" INTO nLogid;
			
					 -- select * from "RoleMaster"
			-- drop table if exists temp_bundle;			
			open ref for
			select nStartpage,jUsers "jUsers",1 as msg,jsonData "jsonData",true "isPagination",nPtaskid "nPtaskid",nCaseid "nCaseid",nLogid "nLogid"
			;
		else 
		-- drop table if exists temp_bundle;			
		open ref for
		select -1 as msg,coalesce(msgvalue,'File not found for paginate (Check Tab reference or other things)') value
		;
			
		end if;
	

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
