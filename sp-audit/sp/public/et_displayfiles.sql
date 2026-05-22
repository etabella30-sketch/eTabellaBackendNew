CREATE OR REPLACE FUNCTION public.et_displayfiles(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nContactid uuid;nUserid uuid;nSectionid uuid;
nIssueid uuid;nTagid uuid; cFoldertype text;

jFilter JSONB := COALESCE((parameter ->> 'jFilter')::jsonb, '[]'::jsonb);
cSearch text;ts_query TSQUERY;
searchName text;contentType text;
jFTypes       JSONB := '[]'::jsonb;
jIssues       JSONB;
jImpact       JSONB;
jRelevance    JSONB;
jMarkup       JSONB;
start_dt date;end_dt date;
nBundleid uuid;
BEGIN
nContactid := NULLIF(parameter->>'nContactid','')::uuid;
nIssueid := NULLIF(parameter->>'nIssueid','')::uuid;
nTagid := NULLIF(parameter->>'nTagid','')::uuid;
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nSectionid:= NULLIF(parameter ->>'nSectionid','')::uuid;

cSearch  := (jFilter ->> 'cSearch');
searchName  := (jFilter ->> 'cMatchCase');
contentType := (jFilter ->> 'contentType');
nBundleid := (jFilter ->> 'nBundleid');

 IF COALESCE(searchName, '') != '' AND COALESCE(cSearch, '') != '' THEN
        jFTypes    := COALESCE((jFilter ->> 'jFTypes')::jsonb, '[]'::jsonb);
        jIssues    := COALESCE((jFilter ->> 'jIssues')::jsonb, '[]'::jsonb);
        jImpact    := COALESCE((jFilter ->> 'jImpact')::jsonb, '[]'::jsonb);
        jRelevance := COALESCE((jFilter ->> 'jRelevance')::jsonb, '[]'::jsonb);
        jMarkup    := COALESCE((jFilter ->> 'jMarkup')::jsonb, '[]'::jsonb);
end if;

	 select "cFoldertype" into cFoldertype from "SectionMaster" where "nSectionid" = nSectionid;

-- select * from public.et_displayfiles ('{""nSectionid"":8844,""nContactid"":0,""nIssueid"":0,""nTagid"":18,""nMasterid"":367}','r1');fetch all in ""r1"";
if(nContactid IS NOT NULL) then
   OPEN ref FOR 
   
	    SELECT distinct f."nBundledetailid", f."nBundleid",f."cFilename" AS "cName",f."cTab",f."cExhibitno",f."cPage",f."cRefpage",f."cFilesize",f."cFiletype", f."dIntrestDt", f."cDesc" ,b."cBundletag"    
	    FROM "ContactMaster" c
	    JOIN "BundleDetail" f ON TRUE
		left join "BDAssignment" ba on ba."nBundledetailid" = f."nBundledetailid"
		left join "BundleMaster" b on b."nBundleid" = f."nBundleid"
	    LEFT JOIN "BDContacts" bc ON f."nBundledetailid" = bc."nBundledetailid" 
	        AND bc."nUserid" = nUserid 
	        AND bc."nContactid" = c."nContactid"
	    LEFT JOIN "FactMaster" fm ON fm."nBundledetailid" = f."nBundledetailid" 
	        AND fm."nUserid" = nUserid
	    LEFT JOIN "FMContact" fc ON fc."nFSid" = fm."nFSid" 
	        AND fc."nContactid" = c."nContactid"
	    WHERE c."nContactid" = nContactid  and case when nBundleid is  distinct from null then f."nBundleid" = nBundleid or ba."nBundleid" = nBundleid  else true end
        AND (
      CASE 
          WHEN cFoldertype = 'CB' or cFoldertype = 'CO' THEN ba."nSectionid"
          ELSE f."nSectionid"
      END
  ) = nSectionid
  and (bc."nBDCtid" IS NOT NULL OR fc."nFMCid" IS NOT NULL)
 
		AND (
              COALESCE(searchName, '') = '' OR COALESCE(cSearch, '') = '' OR
              (
                CASE
                    WHEN contentType = 'All' THEN
                        CASE searchName
                            WHEN 'S' THEN
                                LOWER(f."cFilename") LIKE LOWER(cSearch) || '%' OR
                                LOWER(f."cTab") LIKE LOWER(cSearch) || '%' OR
                                LOWER(f."cExhibitno") LIKE LOWER(cSearch) || '%' OR
                                LOWER(f."cDesc") LIKE LOWER(cSearch) || '%' OR
			 					 LOWER(f."cAuthor")  LIKE LOWER(cSearch) || '%' OR
                                LOWER(f."dIntrestDt") LIKE LOWER(cSearch) || '%'
                            WHEN 'E' THEN
                                TRIM(LOWER(f."cFilename")) = TRIM(LOWER(cSearch)) OR
                                LOWER(f."cTab") = TRIM(LOWER(cSearch)) OR
                                LOWER(f."cExhibitno") = TRIM(LOWER(cSearch)) OR
                                LOWER(f."cDesc") = TRIM(LOWER(cSearch)) OR
                                LOWER(f."cAuthor") = TRIM(LOWER(cSearch)) OR
                                LOWER(f."dIntrestDt") = TRIM(LOWER(cSearch))
                            ELSE
                                (to_tsvector(LOWER(COALESCE(f."cTab", '') || ' ' || f."cFilename" || ' ' || COALESCE(f."cExhibitno", '') || ' ' || COALESCE(f."cDesc", '')  || ' ' || COALESCE(f."cAuthor", ''))) @@ ts_query
								or
                LOWER(COALESCE(f."cTab", '')) || ' ' || LOWER(f."cFilename") || ' ' || LOWER(COALESCE(f."cExhibitno", '')) || ' ' || LOWER(COALESCE(f."cDesc", '')) || ' ' ||  LOWER(COALESCE(f."cAuthor", ''))  ILIKE ('%' ||  TRIM(LOWER(cSearch)) || '%')
								
									or  (case when start_dt::text !='' and COALESCE(f."start_date"::text, '') != '' then 
 coalesce(f."start_date",'1001-01-02')::date >= coalesce(start_dt::text,'1001-01-01')::date and f."end_date"::date <=coalesce(end_dt,'1001-01-02')::date else false end )
 )
                        END
                    ELSE
                        (
CASE contentType
    WHEN 'cTab' THEN
        CASE searchName
            WHEN 'S' THEN LOWER(f."cTab") LIKE LOWER(cSearch) || '%'
            WHEN 'E' THEN LOWER(f."cTab") = TRIM(LOWER(cSearch))
            ELSE
                to_tsvector(LOWER(f."cTab")) @@ to_tsquery(REPLACE(cSearch, ' ', ':* & ') || ':*')
        END
    WHEN 'cFilename' THEN
        CASE searchName
            WHEN 'S' THEN LOWER(f."cFilename") LIKE LOWER(cSearch) || '%'
            WHEN 'E' THEN LOWER(f."cFilename") = TRIM(LOWER(cSearch))
            ELSE
                to_tsvector(LOWER(f."cFilename")) @@ to_tsquery(REPLACE(cSearch, ' ', ':* & ') || ':*')
        END
    WHEN 'cExhibitno' THEN
        CASE searchName
            WHEN 'S' THEN LOWER(f."cExhibitno") LIKE LOWER(cSearch) || '%'
            WHEN 'E' THEN LOWER(f."cExhibitno") = TRIM(LOWER(cSearch))
            ELSE
                to_tsvector(LOWER(f."cExhibitno")) @@ to_tsquery(REPLACE(cSearch, ' ', ':* & ') || ':*')
        END
    WHEN 'cDesc' THEN
        CASE searchName
            WHEN 'S' THEN LOWER(f."cDesc") LIKE LOWER(cSearch) || '%'
            WHEN 'E' THEN LOWER(f."cDesc") = TRIM(LOWER(cSearch))
            ELSE
                to_tsvector(LOWER(f."cDesc")) @@ to_tsquery(REPLACE(cSearch, ' ', ':* & ') || ':*')
        END
    WHEN 'cAuthor' THEN
        CASE searchName
            WHEN 'S' THEN LOWER(f."cAuthor") LIKE LOWER(cSearch) || '%'
            WHEN 'E' THEN LOWER(f."cAuthor") = TRIM(LOWER(cSearch))
            ELSE
                to_tsvector(LOWER(f."cAuthor")) @@ to_tsquery(REPLACE(cSearch, ' ', ':* & ') || ':*')
        END
    ELSE TRUE -- fallback
END
						)
                END
              )
          );    

end if;
if(nIssueid IS NOT NULL) then 
-- select * from "FMIssue" where "nIssueid" = 241
 OPEN ref FOR 
	SELECT DISTINCT f."nBundledetailid", f."nBundleid",f."cFilename" AS "cName",f."cTab",f."cExhibitno",f."cPage",f."cRefpage",f."cFilesize",f."cFiletype", f."dIntrestDt", f."cDesc" ,b."cBundletag"

    FROM "FMIssue" fi
    JOIN "FactMaster" fm ON fm."nFSid" = fi."nFSid"
    JOIN "BundleDetail" f ON f."nBundledetailid" = fm."nBundledetailid"
	left join "BDAssignment" ba on ba."nBundledetailid" = f."nBundledetailid"
	left join "BundleMaster" b on b."nBundleid" = f."nBundleid"
	where fi."nIssueid" = nIssueid and fm."nUserid" = nUserid 
	AND (
      CASE 
          WHEN cFoldertype = 'CB' or cFoldertype = 'CO' THEN ba."nSectionid"
          ELSE f."nSectionid"
      END
  ) = nSectionid and case when nBundleid is  distinct from null then f."nBundleid" = nBundleid or ba."nBundleid" = nBundleid  else true end
		AND (
              COALESCE(searchName, '') = '' OR COALESCE(cSearch, '') = '' OR
              (
                CASE
                    WHEN contentType = 'All' THEN
                        CASE searchName
                            WHEN 'S' THEN
                                LOWER(f."cFilename") LIKE LOWER(cSearch) || '%' OR
                                LOWER(f."cTab") LIKE LOWER(cSearch) || '%' OR
                                LOWER(f."cExhibitno") LIKE LOWER(cSearch) || '%' OR
                                LOWER(f."cDesc") LIKE LOWER(cSearch) || '%' OR
			 					 LOWER(f."cAuthor")  LIKE LOWER(cSearch) || '%' OR
                                LOWER(f."dIntrestDt") LIKE LOWER(cSearch) || '%'
                            WHEN 'E' THEN
                                TRIM(LOWER(f."cFilename")) = TRIM(LOWER(cSearch)) OR
                                LOWER(f."cTab") = TRIM(LOWER(cSearch)) OR
                                LOWER(f."cExhibitno") = TRIM(LOWER(cSearch)) OR
                                LOWER(f."cDesc") = TRIM(LOWER(cSearch)) OR
                                LOWER(f."cAuthor") = TRIM(LOWER(cSearch)) OR
                                LOWER(f."dIntrestDt") = TRIM(LOWER(cSearch))
                            ELSE
                                (to_tsvector(LOWER(COALESCE(f."cTab", '') || ' ' || f."cFilename" || ' ' || COALESCE(f."cExhibitno", '') || ' ' || COALESCE(f."cDesc", '')  || ' ' || COALESCE(f."cAuthor", ''))) @@ ts_query
								or
                LOWER(COALESCE(f."cTab", '')) || ' ' || LOWER(f."cFilename") || ' ' || LOWER(COALESCE(f."cExhibitno", '')) || ' ' || LOWER(COALESCE(f."cDesc", '')) || ' ' ||  LOWER(COALESCE(f."cAuthor", ''))  ILIKE ('%' ||  TRIM(LOWER(cSearch)) || '%')
								
									or  (case when start_dt::text !='' and COALESCE(f."start_date"::text, '') != '' then 
 coalesce(f."start_date",'1001-01-02')::date >= coalesce(start_dt::text,'1001-01-01')::date and f."end_date"::date <=coalesce(end_dt,'1001-01-02')::date else false end )
 )
                        END
                    ELSE
                        (
CASE contentType
    WHEN 'cTab' THEN
        CASE searchName
            WHEN 'S' THEN LOWER(f."cTab") LIKE LOWER(cSearch) || '%'
            WHEN 'E' THEN LOWER(f."cTab") = TRIM(LOWER(cSearch))
            ELSE
                to_tsvector(LOWER(f."cTab")) @@ to_tsquery(REPLACE(cSearch, ' ', ':* & ') || ':*')
        END
    WHEN 'cFilename' THEN
        CASE searchName
            WHEN 'S' THEN LOWER(f."cFilename") LIKE LOWER(cSearch) || '%'
            WHEN 'E' THEN LOWER(f."cFilename") = TRIM(LOWER(cSearch))
            ELSE
                to_tsvector(LOWER(f."cFilename")) @@ to_tsquery(REPLACE(cSearch, ' ', ':* & ') || ':*')
        END
    WHEN 'cExhibitno' THEN
        CASE searchName
            WHEN 'S' THEN LOWER(f."cExhibitno") LIKE LOWER(cSearch) || '%'
            WHEN 'E' THEN LOWER(f."cExhibitno") = TRIM(LOWER(cSearch))
            ELSE
                to_tsvector(LOWER(f."cExhibitno")) @@ to_tsquery(REPLACE(cSearch, ' ', ':* & ') || ':*')
        END
    WHEN 'cDesc' THEN
        CASE searchName
            WHEN 'S' THEN LOWER(f."cDesc") LIKE LOWER(cSearch) || '%'
            WHEN 'E' THEN LOWER(f."cDesc") = TRIM(LOWER(cSearch))
            ELSE
                to_tsvector(LOWER(f."cDesc")) @@ to_tsquery(REPLACE(cSearch, ' ', ':* & ') || ':*')
        END
    WHEN 'cAuthor' THEN
        CASE searchName
            WHEN 'S' THEN LOWER(f."cAuthor") LIKE LOWER(cSearch) || '%'
            WHEN 'E' THEN LOWER(f."cAuthor") = TRIM(LOWER(cSearch))
            ELSE
                to_tsvector(LOWER(f."cAuthor")) @@ to_tsquery(REPLACE(cSearch, ' ', ':* & ') || ':*')
        END
    ELSE TRUE -- fallback
END
						)
                END
              )
          );  

end if;

if(nTagid IS NOT NULL) then 
-- select * from "FMIssue" where "nIssueid" = 241
 OPEN ref FOR 
	 SELECT DISTINCT f."nBundledetailid", f."nBundleid", f."cFilename" AS "cName", f."cTab", f."cExhibitno",
        f."cPage", f."cRefpage", f."cFilesize", f."cFiletype", f."dIntrestDt", f."cDesc" AS "cDescription",b."cBundletag"
    FROM "BundleDetail" f
    JOIN "BDTags" bt ON f."nBundledetailid" = bt."nBundledetailid" 
	left join "BDAssignment" ba on ba."nBundledetailid" = f."nBundledetailid"
	left join "BundleMaster" b on b."nBundleid" = f."nBundleid"
    WHERE bt."nUserid" = nUserid and bt."nTagid" = nTagid
	and case when nBundleid is  distinct from null then f."nBundleid" = nBundleid or ba."nBundleid" = nBundleid  else true end
	and (
      CASE 
          WHEN cFoldertype = 'CB' or cFoldertype = 'CO' THEN ba."nSectionid"
          ELSE f."nSectionid"
      END ) = nSectionid
	  
		AND (
              COALESCE(searchName, '') = '' OR COALESCE(cSearch, '') = '' OR
              (
                CASE
                    WHEN contentType = 'All' THEN
                        CASE searchName
                            WHEN 'S' THEN
                                LOWER(f."cFilename") LIKE LOWER(cSearch) || '%' OR
                                LOWER(f."cTab") LIKE LOWER(cSearch) || '%' OR
                                LOWER(f."cExhibitno") LIKE LOWER(cSearch) || '%' OR
                                LOWER(f."cDesc") LIKE LOWER(cSearch) || '%' OR
			 					 LOWER(f."cAuthor")  LIKE LOWER(cSearch) || '%' OR
                                LOWER(f."dIntrestDt") LIKE LOWER(cSearch) || '%'
                            WHEN 'E' THEN
                                TRIM(LOWER(f."cFilename")) = TRIM(LOWER(cSearch)) OR
                                LOWER(f."cTab") = TRIM(LOWER(cSearch)) OR
                                LOWER(f."cExhibitno") = TRIM(LOWER(cSearch)) OR
                                LOWER(f."cDesc") = TRIM(LOWER(cSearch)) OR
                                LOWER(f."cAuthor") = TRIM(LOWER(cSearch)) OR
                                LOWER(f."dIntrestDt") = TRIM(LOWER(cSearch))
                            ELSE
                                (to_tsvector(LOWER(COALESCE(f."cTab", '') || ' ' || f."cFilename" || ' ' || COALESCE(f."cExhibitno", '') || ' ' || COALESCE(f."cDesc", '')  || ' ' || COALESCE(f."cAuthor", ''))) @@ ts_query
								or
                LOWER(COALESCE(f."cTab", '')) || ' ' || LOWER(f."cFilename") || ' ' || LOWER(COALESCE(f."cExhibitno", '')) || ' ' || LOWER(COALESCE(f."cDesc", '')) || ' ' ||  LOWER(COALESCE(f."cAuthor", ''))  ILIKE ('%' ||  TRIM(LOWER(cSearch)) || '%')
								
									or  (case when start_dt::text !='' and COALESCE(f."start_date"::text, '') != '' then 
 coalesce(f."start_date",'1001-01-02')::date >= coalesce(start_dt::text,'1001-01-01')::date and f."end_date"::date <=coalesce(end_dt,'1001-01-02')::date else false end )
 )
                        END
                    ELSE
                        (
CASE contentType
    WHEN 'cTab' THEN
        CASE searchName
            WHEN 'S' THEN LOWER(f."cTab") LIKE LOWER(cSearch) || '%'
            WHEN 'E' THEN LOWER(f."cTab") = TRIM(LOWER(cSearch))
            ELSE
                to_tsvector(LOWER(f."cTab")) @@ to_tsquery(REPLACE(cSearch, ' ', ':* & ') || ':*')
        END
    WHEN 'cFilename' THEN
        CASE searchName
            WHEN 'S' THEN LOWER(f."cFilename") LIKE LOWER(cSearch) || '%'
            WHEN 'E' THEN LOWER(f."cFilename") = TRIM(LOWER(cSearch))
            ELSE
                to_tsvector(LOWER(f."cFilename")) @@ to_tsquery(REPLACE(cSearch, ' ', ':* & ') || ':*')
        END
    WHEN 'cExhibitno' THEN
        CASE searchName
            WHEN 'S' THEN LOWER(f."cExhibitno") LIKE LOWER(cSearch) || '%'
            WHEN 'E' THEN LOWER(f."cExhibitno") = TRIM(LOWER(cSearch))
            ELSE
                to_tsvector(LOWER(f."cExhibitno")) @@ to_tsquery(REPLACE(cSearch, ' ', ':* & ') || ':*')
        END
    WHEN 'cDesc' THEN
        CASE searchName
            WHEN 'S' THEN LOWER(f."cDesc") LIKE LOWER(cSearch) || '%'
            WHEN 'E' THEN LOWER(f."cDesc") = TRIM(LOWER(cSearch))
            ELSE
                to_tsvector(LOWER(f."cDesc")) @@ to_tsquery(REPLACE(cSearch, ' ', ':* & ') || ':*')
        END
    WHEN 'cAuthor' THEN
        CASE searchName
            WHEN 'S' THEN LOWER(f."cAuthor") LIKE LOWER(cSearch) || '%'
            WHEN 'E' THEN LOWER(f."cAuthor") = TRIM(LOWER(cSearch))
            ELSE
                to_tsvector(LOWER(f."cAuthor")) @@ to_tsquery(REPLACE(cSearch, ' ', ':* & ') || ':*')
        END
    ELSE TRUE -- fallback
END
						)
                END
              )
          );

end if;
	
	    RETURN ref;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
