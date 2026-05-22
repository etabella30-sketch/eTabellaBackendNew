CREATE OR REPLACE FUNCTION public.et_realtime_transcriptfiles(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare cUnicuserid text;pageNumber int;nCaseid uuid;offsetCount int;perPage int default 50;
nSectionid uuid;
BEGIN
cUnicuserid := parameter ->>'cUnicuserid';
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
pageNumber := coalesce((parameter ->>'pageNumber')::int, 1);
offsetCount := (pageNumber - 1) * perPage;

select "nSectionid" into nSectionid from "SectionMaster" s where s."nCaseid" = nCaseid and "cFoldertype" = 'TS';

open ref for 
select b."nBundleid",b."nBundledetailid",b."nSectionid",b."cFilename",b."dCreateDt" "date",b."cFiletype" "filetype",b."cStatus","cPath" from "BundleDetail" b 
where b."nSectionid" = nSectionid order by "dCreateDt" desc;

 RETURN ref;
 END;
$function$
