CREATE OR REPLACE FUNCTION public.et_batchfile_getdata(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
-- select * from "BundleDetail" 
declare nUserid uuid;nCaseid uuid;nSectionid uuid;
cBundleids uuid[];cColumn text;cFilename text;
-- select * from et_batchfile_getdata('{"nCaseid":"uuid-value","nSectionid":"uuid-value"}','r');fetch all in "r"
BEGIN
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid:= NULLIF(parameter ->>'nSectionid','')::uuid;
cBundleids:= parameter ->>'cBundleids';
nUserid:= NULLIF(parameter ->>'nMasterid','')::uuid;
if nUserid is null then
	nUserid:= NULLIF(parameter ->>'master_id','')::uuid;
end if;
cColumn:= parameter ->>'column';
cFilename:= parameter ->>'cFilename';

	-- select * from "Batchlog" order by 1 desc
	-- truncate table "Batchlog" restart identity;
-- SELECT * FROM et_batchfile_getdata('{"master_id": "ba561c55-81f5-4180-8934-2ce6dcaa096c", "nCaseid": "007a3614-ac77-40e4-bad1-4962b6571c58", "nSectionid": "2304b5fc-85ee-4676-af1c-3239910432ad", "cBundleids": "{}"}', 'cursor_671f8447'); FETCH ALL IN "cursor_671f8447";

	insert into "Batchlog"("nCaseid","nSectionid","cFilename","cBundleids","cColumn","nCreateId","cStatus")
	values(nCaseid,nSectionid,cFilename,cBundleids,cColumn,nUserid,'P');

    OPEN ref FOR
		select * from (WITH RECURSIVE bdl_tree AS (
            SELECT bm."nBundleid", bm."cBundlename"::text AS "cBundlename", bm."nParentBundleid",
                ARRAY[bm."cBundlename"::text] AS sub_info, bm."nSectionid", bm."cBundletag"
            FROM "BundleMaster" bm
			join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
            WHERE  CASE 
        WHEN array_length(cBundleids, 1) IS NULL THEN  bm."nParentBundleid" is null
		ELSE bm."nBundleid" = ANY(cBundleids) 
    END
			
			AND sm."nCaseid" = nCaseid AND bm."nSectionid" = nSectionid
            UNION ALL
            SELECT c."nBundleid", c."cBundlename", c."nParentBundleid",
                p.sub_info || c."cBundlename"::text, c."nSectionid", c."cBundletag"
            FROM "BundleMaster" c
            JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"
        )
        
            SELECT '' AS "nBundledetailid", t."nBundleid", null AS "cFilename",
                t."cBundlename"::text AS "cTab", ''::text AS "cExhibitno", ''::text AS "cRefpage",
                ''::text AS "dIntrestDt", ''::text AS "cDesc", t.sub_info,''::text kind,t."cBundletag",''::text "cAuthor" 
            FROM bdl_tree t
            GROUP BY t."nBundleid", t."nParentBundleid", t."cBundlename", t.sub_info, t."cBundletag"
            UNION ALL
            SELECT bd."nBundledetailid"::text, bd."nBundleid" AS "nBundleid", REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '')::text AS "cFilename",
                coalesce(bd."cTab",'')::text, TRIM(REPLACE(REPLACE(COALESCE(bd."cExhibitno", ''), E'\n', ''), E'\r', ''))::text AS "cExhibitno",
                COALESCE(bd."cRefpage", '')::text, COALESCE(bd."dIntrestDt", '')::text AS "dIntrestDt",
                COALESCE(bd."cDesc", '')::text AS "cDesc", p.sub_info || coalesce(bd."cTab",'')::text || coalesce(bd."cFilename",'')::text,"cFiletype"::text kind,p."cBundletag",bd."cAuthor"
            FROM "BundleDetail" bd
            JOIN bdl_tree p ON bd."nBundleid" = p."nBundleid" where bd."cStatus" = 'C'
	--	select * from et_batchfile_getdata('{"nCaseid":"uuid-value","nSectionid":"uuid-value"}','r');fetch all in "r"
		union all 

			SELECT bd."nBundledetailid"::text,NULL "nBundleid", REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '')::text AS "cFilename",
			TRIM(COALESCE(bd."cTab", ''))::text AS "cTab", 
                                TRIM(REPLACE(REPLACE(COALESCE(bd."cExhibitno", ''), E'\n', ''), E'\r', ''))::text AS "cExhibitno",
                                 COALESCE(bd."cRefpage", '')::text AS "cRefpage", 
                                COALESCE(bd."dIntrestDt", '')::text AS "dIntrestDt", COALESCE(bd."cDesc", '')::text AS "cDesc",
								ARRAY[bd."cFilename"::text] as sub_info,"cFiletype"::text kind,'' "cBundletag",bd."cAuthor"
               FROM "BundleDetail" bd
               WHERE bd."nBundleid" IS NULL AND bd."nSectionid" = nSectionid AND bd."cStatus" = 'C'
					and   CASE WHEN array_length(cBundleids, 1) IS NULL THEN  true   
		ELSE false end
			) s    
			   
		 ORDER BY  (s."nBundleid" IS NULL),
		 alphanumeric_sort(array_to_string("sub_info",' / '));
   
   
   return ref ;-- Return the cursor to the caller
    END;
$function$
