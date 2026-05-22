CREATE OR REPLACE FUNCTION public.et_activity_scandata(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nCaseid uuid;isAdmin boolean;renameCount int;
nConverts int;useStorage numeric;nPaginates int;nHyperlinks int;
lastscan date; dCaseCreateDt date;
BEGIN
-- select * from et_activity_scandata('{"nMasterid":"367-uuid-format"}','r');fetch all in "r"
-- select * from "HyperLink" 
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

    select "dCreateDt" into dCaseCreateDt from "CaseMaster" where "nCaseid" = nCaseid;
    -- select * from "PTaskDetail"
   select count(distinct c."nBundledetailid") into nConverts from "ConvertLog" c
    join "BundleDetail" b on b."nBundledetailid" = c."nBundledetailid"
    join "SectionMaster" s on s."nSectionid" = b."nSectionid" and "cFoldertype" = 'MB'
    where b."cStatus" = 'C' and s."nCaseid" = nCaseid  
    and c."cStatus" = 'C';

    select count(distinct b."nBundledetailid") into nHyperlinks from "Annotations" h
    join "DocMaster" d on h."nDocid" = d."nDocid"
    join "BundleDetail" b on b."nBundledetailid" = d."nBundledetailid"
    join "SectionMaster" s on s."nSectionid" = b."nSectionid" and "cFoldertype" = 'MB'
    where b."cStatus" = 'C' and s."nCaseid" = nCaseid;

     select count(distinct b."nBundledetailid") into nPaginates from "BundleDetail" b
    join "SectionMaster" s on s."nSectionid" = b."nSectionid" and "cFoldertype" = 'MB'
    where b."cStatus" = 'C' and s."nCaseid" = nCaseid and coalesce(b."cRefpage",'') != '' and upper("cFiletype") = 'PDF'
     and b."cIsindex" = false;

    
    /*
        select sum(b."cFilesize"::numeric) into useStorage from "BundleDetail" b
    join "SectionMaster" s on s."nSectionid" = b."nSectionid"
    where b."cStatus" = 'C' and s."nCaseid" = nCaseid  
    and coalesce("cFilesize",'') != '';
    */

    select count(distinct b."nBundledetailid") into renameCount from "LogBDUpdate" d
    join "BundleDetail" b on b."nBundledetailid" = d."nBDid"
    join "SectionMaster" s on s."nSectionid" = b."nSectionid" and "cFoldertype" = 'MB'
    where b."cStatus" = 'C' and s."nCaseid" = nCaseid;
    
    
     select max("dCreateDt"::date) into lastscan from "PaginateScanLog"
    where "nCaseid" = nCaseid;

    open ref1 for select nConverts "nConverts",nPaginates "nPaginates",nHyperlinks "nHyperlinks",useStorage "useStorage",lastscan,
    dCaseCreateDt "dCaseCreateDt",renameCount "renameCount";

    
    RETURN NEXT ref1;
    
END;
$function$
