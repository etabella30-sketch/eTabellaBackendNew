CREATE OR REPLACE FUNCTION public.et_individual_prenext_id(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nBundledetailid uuid;cFlag text;nSectionid uuid;nBundleid uuid;jAvoid jsonb;

/*select * from et_individual_prenext_id('{""nBundledetailid"":530060,""nMasterid"":2,""cFlag"":""N""}','r');fetch all in ""r""

 select * from et_individual_prenext_id ('{""nBundledetailid"":555366,""cFlag"":""N"",""jAvoid"":""[555366,555364,555365]"",""nMasterid"":2}','r1');fetch all in ""r1"";

select * from et_individual_prenext_id ('{""nBundledetailid"":555364,""cFlag"":""P"",""jAvoid"":""[555366,555364,555365]"",""nMasterid"":2}','r1');fetch all in ""r1"";

*/
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nBundledetailid:= NULLIF(parameter ->>'nBundledetailid','')::uuid;
cFlag := parameter ->>'cFlag';
jAvoid := parameter ->>'jAvoid';

	select "nSectionid","nBundleid" into nSectionid,nBundleid from "BundleDetail" where "nBundledetailid" = nBundledetailid;

open ref for 

		with 
		main as (

	
select bd.*
	from "BundleDetail" bd 
	  LEFT JOIN "BDPermission" bp 
            ON bp."nUserid" = nMasterid 
            AND bp."nBundledetailid" = bd."nBundledetailid"
where    bd."nSectionid" = nSectionid   
	AND CASE WHEN nBundleid IS NOT NULL THEN bd."nBundleid" = nBundleid ELSE bd."nBundleid" IS NULL END 
	and bp."nBDPid" is null
	 and "cFiletype" = 'PDF'
	-- and ((coalesce(jAvoid,('[]')::jsonb) @> to_jsonb(bd."nBundledetailid")) = false or bd."nBundledetailid" = nBundledetailid )

		
		),tm as ( SELECT 
            bd."nBundledetailid",
            LAG(bd."nBundledetailid") OVER (ORDER BY 
                sorted_tab,
                sorted_name
            ) AS "nextBDid"
        FROM main bd 
      
	)

			select  b."nBundledetailid",b."cFilename",b."cPath" as "originalPath" from tm t
			join "BundleDetail" b on b."nBundledetailid" = (case when cFlag = 'P' then t."nextBDid" else t."nBundledetailid" end)
			where case when cFlag = 'P' then t."nBundledetailid" = nBundledetailid else t."nextBDid" = nBundledetailid end;

/*	with tm as ( SELECT 
            bd."nBundledetailid",
            LAG(bd."nBundledetailid") OVER (ORDER BY 
                LEFT("cTab", 1),
                SUBSTRING("cTab"::text, '\D+'),
                SUBSTRING("cTab"::text, '\d+')::numeric,
                CAST(NULLIF(SPLIT_PART(SUBSTRING("cTab" FROM '[0-9\.]+'), '.', 2), '') AS numeric) NULLS FIRST,
                CAST(NULLIF(SPLIT_PART(SUBSTRING("cTab" FROM '[0-9\.]+'), '.', 3), '') AS numeric) NULLS FIRST,
                CAST(NULLIF(SPLIT_PART(SUBSTRING("cTab" FROM '[0-9\.]+'), '.', 4), '') AS numeric) NULLS FIRST,
                CAST(NULLIF(SPLIT_PART(SUBSTRING("cTab" FROM '[0-9\.]+'), '.', 5), '') AS numeric) NULLS FIRST,
                CAST(NULLIF(SPLIT_PART(SUBSTRING("cTab" FROM '[0-9\.]+'), '.', 6), '') AS numeric) NULLS FIRST,
                CAST(NULLIF(SPLIT_PART(SUBSTRING("cTab" FROM '[0-9\.]+'), '.', 7), '') AS numeric) NULLS FIRST,
                CAST(NULLIF(SPLIT_PART(SUBSTRING("cTab" FROM '[0-9\.]+'), '.', 8), '') AS numeric) NULLS FIRST,
                CAST(NULLIF(SPLIT_PART(SUBSTRING("cTab" FROM '[0-9\.]+'), '.', 9), '') AS numeric) NULLS FIRST,
                CAST(NULLIF(SPLIT_PART(SUBSTRING("cTab" FROM '[0-9\.]+'), '.', 10), '') AS numeric) NULLS FIRST,
                SUBSTRING("cTab", '\D+'),
                LEFT("cFilename", 1),
                SUBSTRING("cFilename"::text, '\D+'),
                SUBSTRING("cFilename"::text, '\d+')::numeric
            ) AS "nextBDid"
        FROM "BundleDetail" bd 
        LEFT JOIN "BDPermission" bp 
            ON bp."nUserid" = nMasterid  
            AND bp."nBundledetailid" = bd."nBundledetailid"
        WHERE 
            bd."nSectionid" = nSectionid   
	AND coalesce(bd."nBundleid",0) = coalesce(nBundleid,0) 
	and bp."nBDPid" is null
	and "cFiletype" = 'PDF'
	)

			select  b."nBundledetailid",b."cFilename",b."cPath",(coalesce(jAvoid,('[]')::jsonb) @> to_jsonb(b."nBundledetailid")) = false,nSectionid,nBundleid  from tm t
			join "BundleDetail" b on b."nBundledetailid" = (case when cFlag = 'P' then t."nextBDid" else t."nBundledetailid" end)
			where case when cFlag = 'P' then t."nBundledetailid" = nBundledetailid else t."nextBDid" = nBundledetailid end;*/

-- select * from "BDPermission"
 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
