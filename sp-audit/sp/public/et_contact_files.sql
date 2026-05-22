CREATE OR REPLACE FUNCTION public.et_contact_files(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nSectionid uuid;nUserid uuid;nContactid uuid; cSearch text;
isSearchcont boolean default false; nCaseid uuid;
BEGIN
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nContactid := NULLIF(parameter ->>'nContactid','')::uuid;
cSearch := COALESCE(TRIM(parameter ->> 'cSearch'), '');
nCaseid := (parameter ->>'nCaseid')::uuid;

/*
 select * from "BundleDetail"
 select * from "ContactMaster" 
 select * From "ContactRole"
*/
-- select * from "ContactMaster"

	
if(cSearch !='') then
        SELECT TRUE
        INTO isSearchCont
        FROM "ContactMaster" c
        LEFT JOIN "ContactCompany" cc ON cc."nCompanyid" = c."nCompanyid"
        WHERE c."nCaseid" = nCaseid
          AND c."nUserid" = nUserid
          AND (
              (c."cFname" || ' ' || c."cLname") ILIKE '%' || cSearch || '%' OR
              c."cEmail" ILIKE '%' || cSearch || '%' OR
              cc."cCompany" ILIKE '%' || cSearch || '%'
          )
        LIMIT 1;
end if;

  OPEN ref FOR
    WITH cr AS (
		
		select distinct
			f."nBundledetailid", f."nBundleid", f."cFilename" AS "cName", f."cTab", f."cExhibitno",
			f."cPage", f."cRefpage", f."cFilesize", f."cFiletype", f."dIntrestDt", f."cDesc" AS "cDescription",
			bm."cBundletag", f."cAuthor"
			from "BundleDetail" f 
			join "BDContacts" bc on f."nBundledetailid" = bc."nBundledetailid" 
			LEFT JOIN "BundleMaster" bm ON f."nBundleid" = bm."nBundleid"
			where bc."nUserid" = nUserid 
			and bc."nContactid" = nContactid
			 AND (nSectionid IS NULL OR f."nSectionid" = nSectionid)
			 AND (
	            cSearch = '' OR isSearchcont = TRUE OR
	            f."cFilename" ILIKE '%' || cSearch || '%'
	          )
		),
		 fct AS (
	        SELECT f."nFSid", f."nBundledetailid"
	        FROM "FactMaster" f
	        JOIN "FMIssue" i ON i."nFSid" = f."nFSid"
	        JOIN cr ON cr."nBundledetailid" = f."nBundledetailid"
	        WHERE f."nUserid" = nUserid
	    ),
	    doc AS (
	        SELECT d."nBundledetailid"
	        FROM "DocMaster" d
	        JOIN cr ON cr."nBundledetailid" = d."nBundledetailid"
	        WHERE d."nUserid" = nUserid
	    ),
	    web AS (
	        SELECT w."nBundledetailid"
	        FROM "WebMaster" w
	        JOIN cr ON cr."nBundledetailid" = w."nBundledetailid"
	        WHERE w."nUserid" = nUserid
	    ),
	    flink AS (
	        SELECT fl."nBundledetailid"
	        FROM file_links fl
	        JOIN cr ON cr."nBundledetailid" = fl."nBundledetailid"
	        WHERE fl."nUserid" = nUserid
	    )
	    SELECT DISTINCT
	        cr.*,
	        CASE WHEN fct."nBundledetailid" IS NOT NULL THEN TRUE ELSE FALSE END AS fact,
	        CASE WHEN doc."nBundledetailid" IS NOT NULL THEN TRUE ELSE FALSE END AS doc,
	        CASE WHEN web."nBundledetailid" IS NOT NULL THEN TRUE ELSE FALSE END AS web,
	        CASE WHEN flink."nBundledetailid" IS NOT NULL THEN TRUE ELSE FALSE END AS flink
	    FROM cr
	    LEFT JOIN fct ON fct."nBundledetailid" = cr."nBundledetailid"
	    LEFT JOIN doc ON doc."nBundledetailid" = cr."nBundledetailid"
	    LEFT JOIN web ON web."nBundledetailid" = cr."nBundledetailid"
	    LEFT JOIN flink ON flink."nBundledetailid" = cr."nBundledetailid";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
