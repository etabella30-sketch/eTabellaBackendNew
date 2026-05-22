CREATE OR REPLACE FUNCTION upload.et_check_duplicacy(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nCaseid uuid;nSectionid uuid;jFiles jsonb;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
jFiles := parameter ->>'jFiles';

/*

SELECT * FROM upload.et_check_duplicacy (
  '{
    ""nCaseid"": 1129,
    ""nSectionid"": 9124,
    ""jFiles"": [
      {""id"":1,""nBundleid"":9798,""name"":""File 1""},
      {""id"":2,""nBundleid"":9798,""name"":""File 2""},
      {""id"":3,""nBundleid"":9801,""name"":""File 3""},
      {""id"":4,""nBundleid"":9801,""name"":""File 4""},
      {""id"":5,""nBundleid"":9799,""name"":""File 5""},
      {""id"":6,""nBundleid"":9799,""name"":""File 6""}
    ],
    ""nMasterid"": 2
  }',
  'r1'
);
FETCH ALL IN ""r1"";

delete from ""BundleMaster"" where ""nSectionid"" = 9124 and ""nBundleid"" not in (9744)

select * from ""BundleMaster"" where ""nSectionid"" = 9124 and ""nBundleid"" not in (9744)

select * from ""BundleDetail""  where ""nSectionid"" = 9124 order by 1 limit 10

*/

	drop table if exists temp_files;
	create temp table temp_files as 
	select *,'00000000-0000-0000-0000-000000000000'::uuid as "nBundledetailid" From jsonb_to_recordset(jFiles) as ("id" int,"nBundleid" uuid,"name" text);

	update temp_files t set "nBundledetailid" = b."nBundledetailid" 
		from "BundleDetail" b 
		where  b."nBundleid" = t."nBundleid" and b."nSectionid" = nSectionid and trim(upper(b."cFilename")) = trim(upper(t."name"));

	open ref for
		select * from "temp_files" where "nBundledetailid" != '00000000-0000-0000-0000-000000000000'::uuid;
	
	

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
