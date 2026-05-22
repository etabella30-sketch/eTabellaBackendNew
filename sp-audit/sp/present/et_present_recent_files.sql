CREATE OR REPLACE FUNCTION present.et_present_recent_files(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;
nCaseid uuid;
nTypeid int;
nOffset int;
pageNumber int;
nLimit int;
nSubtypeid INTEGER;
dStartDt DATE;
dEndDt DATE;
cSearch text;
searchName text;
cPname text;

BEGIN
-- select * from present.et_present_recent_files('{""nCaseid"":1079, ""nMasterid"": 29}','r');fetch all in ""r""
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nTypeid := parameter ->>'nTypeid';
pageNumber := coalesce( (parameter ->>'pageNumber')::int ,1);
nLimit := parameter ->>'nLimit';
nOffset := (pageNumber - 1) * nLimit;
nSubtypeid := (parameter ->> 'nSubtypeid');
dStartDt := NULLIF(parameter ->> 'dStartDt', '')::DATE;
dEndDt := NULLIF(parameter ->> 'dEndDt', '')::DATE;
cSearch := trim(parameter ->>'cSearch');
searchName:= parameter ->>'searchName';
cPname:= parameter ->>'cPname';
open ref for

		SELECT DISTINCT ON (bd."nBundledetailid")
		pmd."nPDid", bd."nBundledetailid" ,bd."nSectionid", bd."cTab", bd."cExhibitno", bd."cFilename" "cName", bd."cFiletype", bd."cPath", bd."cPage", bd."cRefpage", bd."dIntrestDt",
		pmd."dCreateDt",bd."cAuthor"
		from present."PMDocuments" pmd 
		join present."PresentationMaster" pm on pm."nPresentid" = pmd."nPresentid"
		join "BundleDetail" bd on bd."nBundledetailid" = pmd."nBundledetailid" 
		where pm."nCreateid"  = nMasterid and pm."nTypeid" = nTypeid and pm."cStatus" = 'C' and pm."nCaseid" =  nCaseid
		AND (nSubtypeid IS NULL OR pm."nSubtypeid" = nSubtypeid)
		AND ((dStartDt IS NOT NULL AND dEndDt IS NOT NULL AND 
             pmd."dCreateDt"::DATE BETWEEN dStartDt AND dEndDt)
            OR
            (dStartDt IS NULL OR dEndDt IS NULL))
			
			AND 
			case when COALESCE(cSearch, '') != '' then 
			( case searchName::text when 'S' then
             LOWER(bd."cFilename") ILIKE  LOWER( cSearch::text ) || '%' 
			  OR LOWER(bd."cTab") ILIKE  LOWER( cSearch::text ) || '%' 
			  OR LOWER(bd."cExhibitno") ILIKE LOWER( cSearch::text ) || '%'
			  OR LOWER(bd."cDesc") ILIKE  LOWER( cSearch::text ) || '%'
			  OR LOWER(bd."dIntrestDt") ILIKE  LOWER( cSearch::text ) || '%'		      
		   when 'E' then 
		     trim(LOWER(bd."cFilename")) = trim(LOWER( cSearch::text )) 
			  OR LOWER(bd."cTab") = trim(LOWER( cSearch::text ))
			  OR LOWER(bd."cExhibitno") = trim(LOWER( cSearch::text ))
			  OR LOWER(bd."cDesc") = trim(LOWER( cSearch::text ))
			  OR LOWER(bd."dIntrestDt") = trim(LOWER( cSearch::text ))
			   else 
				(

				to_tsvector(LOWER(COALESCE(bd."cTab", '' )) || ' '  || LOWER(bd."cFilename") || ' '  || LOWER(COALESCE(bd."cExhibitno", '' )) || ' '  || LOWER(COALESCE(bd."cDesc", '')) || ' '  || LOWER(COALESCE(bd."dIntrestDt", '')) )  @@ to_tsquery(replace(( cSearch::text ), '' ,':* & ')|| ':*') OR
				(coalesce(similarity(bd."cFilename",  cSearch::text ),0) + coalesce(similarity(bd."cTab",  cSearch::text ),0)
				+ coalesce(similarity(bd."cExhibitno",  cSearch::text ),0)  + coalesce(similarity(bd."cDesc",  cSearch::text ),0)) > 0.6
)
		   end
 )

 else true end
 
 and case when  coalesce(cPname,'A') !='A' and cPname !='' then pm."cName" = cPname else true end
		-- order by pm."dCreateDt" desc
		 ORDER BY  bd."nBundledetailid", pm."dCreateDt"  DESC
		offset nOffset
		limit nLimit;

 -- Return the cursor to the caller
 RETURN ref;    
END;

$function$
