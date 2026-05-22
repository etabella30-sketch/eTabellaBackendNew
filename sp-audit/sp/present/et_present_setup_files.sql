CREATE OR REPLACE FUNCTION present.et_present_setup_files(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE 
	nMasterid uuid;
	nPresentid uuid;
	cSortby text;
	cSorttype text;
	query text;
BEGIN
	nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
	nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;
	cSortby := (parameter ->>'cSortby');
	cSorttype := coalesce((parameter ->>'cSorttype'),'ASC');
-- select * from "BundleDetail" limit 1
	-- Build dynamic query with flexible sorting
	query := 'SELECT p."nPDid", p."nBundledetailid", p."cType", p."nSerial",
		b."nSectionid", b."cTab", b."cExhibitno", b."cFilename" AS "cName", 
		b."cFiletype", b."cPath", b."cPage", b."cRefpage", b."dIntrestDt",b."cAuthor"
		FROM present."PMDocuments" p 
		JOIN "BundleDetail" b ON b."nBundledetailid" = p."nBundledetailid"
		WHERE p."nPresentid" = ''' || nPresentid || '''::uuid';
	
	-- Add the ORDER BY clause based on parameter
	IF cSortby = 'cTab' THEN
		query := query || ' ORDER BY sorted_tab ' || cSorttype;
	ELSIF cSortby = 'cExhibitno' THEN
		query := query || ' ORDER BY sorted_exhibitno ' || cSorttype;		
	ELSIF cSortby = 'cDescription' THEN
		query := query || ' ORDER BY sorted_description ' || cSorttype;
	ELSIF cSortby = 'cName' THEN
		query := query || ' ORDER BY sorted_name ' || cSorttype;
	ELSIF cSortby = 'cFiletype' THEN
		query := query || ' ORDER BY  b."cFiletype" ' || cSorttype;
	ELSIF cSortby = 'cPage' THEN
		query := query || ' ORDER BY coalesce(b."cRefpage",b."cPage") ' || cSorttype;
	ELSIF cSortby = 'dIntrestDt' THEN
		query := query || ' ORDER BY  b.start_date::date ' || cSorttype;
	ELSE
		-- Default sorting if an invalid column is specified
		query := query || ' ORDER BY p."nSerial",sorted_tab,sorted_name ASC';
	END IF;
	raise notice 'Query %',query;
	-- Execute the dynamic query
	-- EXECUTE 'OPEN ' || quote_ident(ref::text) || ' FOR ' || query USING nPresentid;
	open ref for EXECUTE query;
	
	RETURN ref; -- Return the cursor to the caller
END;
$function$
