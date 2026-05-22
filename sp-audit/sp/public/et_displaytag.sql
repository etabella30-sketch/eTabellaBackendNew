CREATE OR REPLACE FUNCTION public.et_displaytag(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nCaseid uuid;nUserid uuid;nSectionid uuid; cFoldertype text;
nBundleid uuid;
BEGIN
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nSectionid:= NULLIF(parameter ->>'nSectionid','')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;

/*
 select * from et_displaytag ('{"nSectionid":92,"nCaseid":22,"nMasterid":59}','refcursor'); FETCH All in "refcursor";

select * from fun_bundledetail_new(4)
*/

  SELECT "cFoldertype" INTO cFoldertype FROM "SectionMaster" WHERE "nSectionid" = nSectionid;

open ref for 
-- select * from "TagMaster"
with tbl as (
select tm."nTagid",tm."cTag",tm."cClr" ,
case when count(sb."nTagid")>0 then jsonb_agg(distinct sb) else ('[]')::jsonb end as "sublist"
From "TagMaster" tm 
left join (
select tm."nTagid",tm."cTag",tm."cClr",tm."nParenttagid", '[]'::jsonb "tablelist" --jsonb_agg(distinct fl) as "tablelist"
From "TagMaster" tm 
	join "BDTags" bt on bt."nTagid"  = tm."nTagid" and bt."nUserid" = nUserid
join (
select 
	distinct f."nBundledetailid", f."nBundleid", f."cFilename" AS "cName", f."cTab", f."cExhibitno",
               f."cPage", f."cRefpage", f."cFilesize", f."cFiletype", f."dIntrestDt", f."cDesc" AS "cDescription" from "BundleDetail" f 
			   LEFT JOIN "BDAssignment" ba ON ba."nBundledetailid" = f."nBundledetailid"
	join "BDTags" bc on f."nBundledetailid" = bc."nBundledetailid" and bc."nUserid" = nUserid
	-- where f."nSectionid" = nSectionid	
	 WHERE 
          (
            CASE 
              WHEN cFoldertype = 'CB' or cFoldertype = 'CO' then ba."nSectionid" 
              ELSE f."nSectionid"
            END
          ) = nSectionid
		   and case when nBundleid is  distinct from null then f."nBundleid" = nBundleid or ba."nBundleid" = nBundleid  else true end
) fl on fl."nBundledetailid" = bt."nBundledetailid"
where tm."nParenttagid" IS NOT NULL
group by tm."nTagid",tm."cTag",tm."cClr",tm."nParenttagid"
) sb on sb."nParenttagid" = tm."nTagid"
where tm."nParenttagid" IS NULL and tm."nUserid" = nUserid
group by tm."nTagid",tm."cTag",tm."cClr"
)select t.*,
'[]'::jsonb "tablelist" -- case when count(fl."nBundledetailid")>0 then jsonb_agg(distinct fl) else ('[]')::jsonb end as "tablelist"
from tbl t
join "BDTags" bt on bt."nTagid"  = t."nTagid"
join (
select 
	distinct f."nBundledetailid", f."nBundleid", f."cFilename" AS "cName", f."cTab", f."cExhibitno",
               f."cPage", f."cRefpage", f."cFilesize", f."cFiletype", f."dIntrestDt", f."cDesc" AS "cDescription" from "BundleDetail" f 
			   LEFT JOIN "BDAssignment" ba ON ba."nBundledetailid" = f."nBundledetailid"
			   join "BDTags" bc on f."nBundledetailid" = bc."nBundledetailid" and bc."nUserid" = nUserid
	-- where f."nSectionid" = nSectionid	
	where 
		(
        CASE 
          WHEN cFoldertype = 'CB'  or cFoldertype = 'CO'THEN ba."nSectionid"
          ELSE f."nSectionid"
        END
      ) = nSectionid
	  and case when nBundleid is  distinct from null then f."nBundleid" = nBundleid or ba."nBundleid" = nBundleid  else true end
) fl on fl."nBundledetailid" = bt."nBundledetailid"
group by t."nTagid",t."cTag",t."cClr",t."sublist";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
