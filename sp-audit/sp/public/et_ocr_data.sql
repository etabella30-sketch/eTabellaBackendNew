CREATE OR REPLACE FUNCTION public.et_ocr_data(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nUDid uuid;nTotal int;nProcess int;
    nComplete int;
    ocrFiles text;
BEGIN
    nUDid := NULLIF(parameter->>'nUDid', '')::uuid;
/*
    select jsonb_agg( jsonb_build_object(
        'id', bd."nBundledetailid",
        'cFilename', bd."cFilename",
        'message', '',
        'dStartDt', o."dStartDt",
        'dEndDt', o."dEndDt",
        'cStatus', o."cStatus"
    ))  into ocrFiles from "BundleDetail" bd
    join "OCRLog" o on bd."nBundledetailid" = o."nBundledetailid"
    where "nUDid" = nUDid;-- and  o."cStatus"='OCR' ;
    -- select * from et_ocr_data('{"nUDid":4779}','r','r1');fetch all in "r1"
*/    
        open ref1 for select count("nOLid") "nOCRFiles",sum(case when "cStatus"='C' then 1 else 0 end) "nCompleted",sum(case when "cStatus" = 'OCR' then 1 else 0 end) "nOProgress" from "OCRLog" where "nUDid" = nUDid;
    RETURN next ref1;

        open ref2 for
        select bd."nBundledetailid" id,bd."cFilename",
            '' "message" ,o."dStartDt",o."dEndDt",trim(o."cStatus") "cStatus"
            from "BundleDetail" bd
            join "OCRLog" o on bd."nBundledetailid" = o."nBundledetailid"
        where "nUDid" = nUDid  and  o."cStatus" in ('OCR','P','C') ;

        RETURN next ref2;
    END;
$function$
