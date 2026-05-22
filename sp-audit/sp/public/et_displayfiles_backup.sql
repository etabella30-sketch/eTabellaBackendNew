CREATE OR REPLACE FUNCTION public.et_displayfiles_backup(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nContactid uuid;nUserid uuid;nSectionid uuid;
nIssueid uuid;nTagid uuid; cFoldertype text;
BEGIN
nContactid := NULLIF(parameter->>'nContactid','')::uuid;
nIssueid := NULLIF(parameter->>'nIssueid','')::uuid;
nTagid := NULLIF(parameter->>'nTagid','')::uuid;
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nSectionid:= NULLIF(parameter ->>'nSectionid','')::uuid;

	 select "cFoldertype" into cFoldertype from "SectionMaster" where "nSectionid" = nSectionid;

-- select * from public.et_displayfiles ('{""nSectionid"":8844,""nContactid"":0,""nIssueid"":0,""nTagid"":18,""nMasterid"":367}','r1');fetch all in ""r1"";
if(nContactid IS NOT NULL) then
   OPEN ref FOR 
   
	    SELECT distinct f."nBundledetailid", f."nBundleid",f."cFilename" AS "cName",f."cTab",f."cExhibitno",f."cPage",f."cRefpage",f."cFilesize",f."cFiletype", f."dIntrestDt", f."cDesc"     
	    FROM "ContactMaster" c
	    JOIN "BundleDetail" f ON TRUE
		left join "BDAssignment" ba on ba."nBundledetailid" = f."nBundledetailid"
	    LEFT JOIN "BDContacts" bc ON f."nBundledetailid" = bc."nBundledetailid" 
	        AND bc."nUserid" = nUserid 
	        AND bc."nContactid" = c."nContactid"
	    LEFT JOIN "FactMaster" fm ON fm."nBundledetailid" = f."nBundledetailid" 
	        AND fm."nUserid" = nUserid
	    LEFT JOIN "FMContact" fc ON fc."nFSid" = fm."nFSid" 
	        AND fc."nContactid" = c."nContactid"
	    WHERE c."nContactid" = nContactid 
        AND (
      CASE 
          WHEN cFoldertype = 'CB' THEN ba."nSectionid"
          ELSE f."nSectionid"
      END
  ) = nSectionid
  and (bc."nBDCtid" IS NOT NULL OR fc."nFMCid" IS NOT NULL)	;    

end if;
if(nIssueid IS NOT NULL) then 
-- select * from "FMIssue" where "nIssueid" = 241
 OPEN ref FOR 
	SELECT DISTINCT f."nBundledetailid", f."nBundleid",f."cFilename",f."cTab",f."cExhibitno",f."cPage",f."cRefpage",f."cFilesize",f."cFiletype", f."dIntrestDt", f."cDesc" 

    FROM "FMIssue" fi
    JOIN "FactMaster" fm ON fm."nFSid" = fi."nFSid"
    JOIN "BundleDetail" f ON f."nBundledetailid" = fm."nBundledetailid"
	left join "BDAssignment" ba on ba."nBundledetailid" = f."nBundledetailid"
	where fi."nIssueid" = nIssueid and fm."nUserid" = nUserid 
	AND (
      CASE 
          WHEN cFoldertype = 'CB' THEN ba."nSectionid"
          ELSE f."nSectionid"
      END
  ) = nSectionid;

end if;

if(nTagid IS NOT NULL) then 
-- select * from "FMIssue" where "nIssueid" = 241
 OPEN ref FOR 
	 SELECT DISTINCT f."nBundledetailid", f."nBundleid", f."cFilename" AS "cName", f."cTab", f."cExhibitno",
        f."cPage", f."cRefpage", f."cFilesize", f."cFiletype", f."dIntrestDt", f."cDesc" AS "cDescription"
    FROM "BundleDetail" f
    JOIN "BDTags" bt ON f."nBundledetailid" = bt."nBundledetailid" 
	left join "BDAssignment" ba on ba."nBundledetailid" = f."nBundledetailid"
    WHERE bt."nUserid" = nUserid and bt."nTagid" = nTagid
	and (
      CASE 
          WHEN cFoldertype = 'CB' THEN ba."nSectionid"
          ELSE f."nSectionid"
      END ) = nSectionid;

end if;
	
	    RETURN ref;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
