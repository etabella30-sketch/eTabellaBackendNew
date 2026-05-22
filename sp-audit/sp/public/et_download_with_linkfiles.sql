CREATE OR REPLACE FUNCTION public.et_download_with_linkfiles(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
-- select * from "BundleDetail" 
declare nUserid uuid;nCaseid uuid;nSectionid uuid;
jFolders jsonb;jFiles jsonb;cFilename text;

BEGIN
nCaseid:= NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid:= NULLIF(parameter ->>'nSectionid','')::uuid;
jFolders := parameter ->>'jFolders';
jFiles := parameter ->>'jFiles';
nUserid:= NULLIF(parameter ->>'nMasterid','')::uuid;
	-- select * from et_download_getdata ('{""nCaseid"":22,""nSectionid"":92,""jFolders"":""{}"",""jFiles"":""{}"",""nMasterid"":59}','r1');fetch all in ""r1"";
	
	cFilename := (select REGEXP_REPLACE("cCasename", '[^a-zA-Z0-9 ]', '', 'g') from "CaseMaster" where "nCaseid" = nCaseid);

-- select * from et_download_getdata('{""nCaseid"":22,""nSectionid"":92,""jFiles"":""{555379}"",""jFolders"":""{1348075,1342387}"",""nMasterid"":59}','r');fetch all in ""r""

/*

select * from et_download_getdata ('{""nCaseid"":1091,""nSectionid"":8880,""jFiles"":""{}"",""jFolders"":""{}"",""nMasterid"":263}','r1');fetch all in ""r1"";
*/

	if(jsonb_array_length(jFolders) > 1) then 
		cFilename := (select REGEXP_REPLACE("cBundlename", '[^a-zA-Z0-9 ]', '', 'g') from "BundleMaster" where jFolders @> to_jsonb("nBundleid"));
	end if;

    OPEN ref FOR
		WITH RECURSIVE bdl_tree AS (
            SELECT bm."nBundleid", bm."cBundlename"::text AS "cBundlename", bm."nParentBundleid",
                bm."cBundlename"::text AS sub_info, bm."nSectionid", bm."cBundletag"
            FROM "BundleMaster" bm
			join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
			left join "BMPermission" bp on bm."nBundleid" = bp."nBundleid" and bp."nUserid" = nUserid
            WHERE coalesce(bp."nBMPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid and  CASE 
        WHEN jsonb_array_length(jFolders) = 0 and jsonb_array_length(jFiles) = 0 THEN  bm."nParentBundleid" IS NULL   
		ELSE jFolders @> to_jsonb(bm."nBundleid") -- bm."nBundleid" = ANY(jFolders::uuid[]) 
    END
			
			AND sm."nCaseid" = nCaseid AND bm."nSectionid" = nSectionid
            UNION ALL
            SELECT c."nBundleid", c."cBundlename", c."nParentBundleid",
                p.sub_info || ' / ' || c."cBundlename"::text, c."nSectionid", c."cBundletag"
            FROM "BundleMaster" c
            JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"
			left join "BMPermission" bp on c."nBundleid" = bp."nBundleid" and bp."nUserid" = nUserid
			WHERE coalesce(bp."nBMPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid
        )
        SELECT t.*
        FROM (
			select cFilename "filename","nBundledetailid", "cFilename","Foldername" Foldername,"cPath" from (
			with tm as (
	            SELECT bd."nBundledetailid",  (CASE  WHEN upper(bd."cFilename") LIKE ('%' || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$'))))  THEN regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') ELSE  regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$')))
							END) AS "cFilename", p.sub_info ||  '/' || (CASE  WHEN COALESCE(bd."cTab", '') != '' THEN COALESCE(bd."cTab", '')   ELSE left(regexp_replace(bd."cFilename", '\.[^.]*$', ''),100)  END) || '/'  "Foldername","cPath"
	            FROM "BundleDetail" bd
	            JOIN bdl_tree p ON bd."nBundleid" = p."nBundleid" 
				left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
				where  coalesce(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid)  = '00000000-0000-0000-0000-000000000000'::uuid and bd."cStatus" ='C'
			)
			select "nBundledetailid","cPath","cFilename","Foldername" from tm
			union all
		SELECT DISTINCT bd."nBundledetailid",bd."cPath", (CASE  WHEN upper(bd."cFilename") LIKE ('%' || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$'))))  THEN regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') ELSE  regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$')))
						END) AS "cFilename",COALESCE(tm."Foldername", '') || 'hyperlink doc/' as "Foldername" from "HyperLink" h
					join tm on tm."nBundledetailid" = h."nBundledetailid"
					join "Annotations" a on h."nHLid" = a."nHLid"
					join "BundleDetail" bd on bd."nBundledetailid" = NULLIF(rects[0]->>'bundledetailid','')::uuid
					where  bd."cStatus" ='C') t
        ) t 		
		union all 
			
			select cFilename "filename","nBundledetailid", "cFilename","Foldername" Foldername,"cPath" from (
			with tm as (SELECT bd."nBundledetailid", '/' ||  (CASE  WHEN COALESCE(bd."cTab", '') != '' THEN COALESCE(bd."cTab", '')   ELSE left(regexp_replace(bd."cFilename", '\.[^.]*$', ''),100)  END) || '/' as "Foldername",(CASE  WHEN upper(bd."cFilename") LIKE ('%' || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$'))))  THEN regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') ELSE  regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$')))
						END)  AS "cFilename","cPath"
               FROM "BundleDetail" bd
			   	left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
               WHERE coalesce(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid and bd."cStatus" ='C' and (case when nSectionid IS NOT NULL then bd."nSectionid" = nSectionid else jFiles @> to_jsonb(bd."nBundledetailid")  end) AND (case when jsonb_array_length(jFiles) = 0 THEN bd."cIsindex"  != true else  true end)
					and   CASE WHEN jsonb_array_length(jFolders) = 0  and jsonb_array_length(jFiles) = 0 THEN   bd."nBundleid" IS NULL   
	when jsonb_array_length(jFiles) > 0 then jFiles @>  to_jsonb(bd."nBundledetailid") and not exists (select * from "bdl_tree" bt where bt."nBundleid" = bd."nBundleid")	ELSE false end)
			select "nBundledetailid","cPath","cFilename","Foldername" from tm
	union all
		SELECT DISTINCT bd."nBundledetailid",bd."cPath", (CASE  WHEN upper(bd."cFilename") LIKE ('%' || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$'))))  THEN regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') ELSE  regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$')))
						END) AS "cFilename",COALESCE(tm."Foldername", '') || 'hyperlink doc/' as "Foldername" from "HyperLink" h
					join tm on tm."nBundledetailid" = h."nBundledetailid"
					join "Annotations" a on h."nHLid" = a."nHLid"
					join "BundleDetail" bd on bd."nBundledetailid" = NULLIF(rects[0]->>'bundledetailid','')::uuid
					where bd."cStatus" ='C') t
			
		-- select * from "Annotations" limit 0
		-- select * from "HyperLink" limit 0
		;
		
   return ref ;-- Return the cursor to the caller
    END;
$function$
