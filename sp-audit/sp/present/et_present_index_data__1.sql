CREATE OR REPLACE FUNCTION present.et_present_index_data(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;
    nCaseid uuid;
    nTypeid int;
    nSubtypeid INTEGER;
    dStartDt DATE;
    dEndDt DATE;
    cPname text;
    jFiles text;nDTaskid uuid;
BEGIN
    nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
    nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
    nTypeid := parameter ->>'nTypeid';
    nSubtypeid := (parameter ->> 'nSubtypeid');
    dStartDt := NULLIF(parameter ->> 'dStartDt', '')::DATE;
    dEndDt := NULLIF(parameter ->> 'dEndDt', '')::DATE;
    cPname:= parameter ->>'cPname';
    jFiles:= parameter ->>'jFiles';
    nDTaskid := NULLIF(parameter ->>'nDTaskid','')::uuid;
-- select * from present.et_present_index_data ('{""nCaseid"":1126,""nTypeid"":217,""cPname"":""test Roshan 1"",""nSubtypeid"":215,""dStartDt"":""2025-04-01T11:25:12.746Z"",""dEndDt"":""2025-04-01T11:25:12.746Z"",""nMasterid"":367}','r1','r2');fetch all in ""r1"";fetch all in ""r2"";

open ref1 for 
            SELECT "nCaseid", "cCasename", "cCaseno", dStartDt::date::text "dStartDt",dEndDt::date::text "dEndDt", case when cPname ='' or coalesce(cPname,'A') = 'A' then 'All session' else cPname end "cPname"
               FROM "CaseMaster"
               WHERE "nCaseid" = nCaseid;

    RETURN NEXT ref1;

    OPEN ref2 FOR
    select "nBundledetailid", "cFilename"::text,
                "cTab"::text,"cExhibitno"::text,"cRefpage"::text,"dIntrestDt"::text,"cDescription"::text,array_to_string(t.sub_info, ' / ') sub_info ,t.kind::text,"nParentBundleid",t."cBundletag"::text,sorted_tab,sorted_name from (
            with  tree_data as (
                select row_number() OVER(order by pm."cName") serial,pm."cName"  "cFilename",ARRAY[pm."cName"] sub_info,null "dCreateDt",pm."cName", '00000000-0000-0000-0000-000000000000'::uuid "nParentBundleid"
                from present."PresentationMaster" pm                
                join present."PMDocuments" pmd on pm."nPresentid" = pmd."nPresentid" and 
                  case when array_length(jFiles::uuid[], 1) is not null then pmd."nBundledetailid" = ANY(jFiles::uuid[]) else true end 
                where coalesce("cName",'') !='' and  pm."nCreateid"  = nMasterid and pm."nTypeid" = nTypeid and pm."cStatus" = 'C' and pm."nCaseid" =  nCaseid
                    AND  case when nSubtypeid > 0 then pm."nSubtypeid" = nSubtypeid else true end
                    AND ((dStartDt IS NOT NULL AND dEndDt IS NOT NULL AND 
                         pm."dCreateDt"::DATE BETWEEN dStartDt AND dEndDt)
                        OR
                        (dStartDt IS NULL OR dEndDt IS NULL))     
                 and case when  coalesce(cPname,'A') !='A' and cPname !='' then pm."cName" = cPname else true end    
                 group by pm."cName"

             union all 
                     select row_number() OVER(order by pm."cName",pm."dCreateDt"::date) serial,pm."dCreateDt"::date::text  "cFilename",Array[pm."cName",pm."dCreateDt"::date::text] sub_info,pm."dCreateDt"::date "dCreateDt",pm."cName",'00000000-0000-0000-0000-000000000001'::uuid "nParentBundleid"
                        from present."PresentationMaster" pm 
                         join present."PMDocuments" pmd on pm."nPresentid" = pmd."nPresentid" and 
                         case when array_length(jFiles::uuid[], 1) is not null then pmd."nBundledetailid" = ANY(jFiles::uuid[]) else true end 
                        where coalesce("cName",'') !='' and pm."nCreateid"  = nMasterid and pm."nTypeid" = nTypeid and pm."cStatus" = 'C' and pm."nCaseid" =  nCaseid
                            AND  case when nSubtypeid > 0 then pm."nSubtypeid" = nSubtypeid else true end
                            AND ((dStartDt IS NOT NULL AND dEndDt IS NOT NULL AND 
                                 pm."dCreateDt"::DATE BETWEEN dStartDt AND dEndDt)
                                OR
                                (dStartDt IS NULL OR dEndDt IS NULL))     
                     and case when  coalesce(cPname,'A') !='A' and cPname !='' then pm."cName" = cPname else true end    
                     group by pm."cName",pm."dCreateDt"::date
            ) 
                select serial,'00000000-0000-0000-0000-000000000000'::uuid AS "nBundledetailid",  t."cFilename"::text "cFilename",
                serial::text AS "cTab", ''::text AS "cExhibitno", ''::text AS "cRefpage",
                ''::text AS "dIntrestDt", ''::text AS "cDescription", t.sub_info,''::text kind,serial::text "cBundletag", t."nParentBundleid",null as sorted_tab,null sorted_name
                    from tree_data t
                    
                union all

                
                SELECT dt."nSerial"::text,bd."nBundledetailid",bd."cFilename",
                bd."cTab"::text, TRIM(REPLACE(REPLACE(COALESCE(bd."cExhibitno", ''), E'\n', ''), E'\r', ''))::text AS "cExhibitno",
                COALESCE(bd."cRefpage", '')::text "cRefpage", COALESCE(bd."dIntrestDt", '')::text AS "dIntrestDt",
                COALESCE(bd."cDesc", '')::text AS "cDescription",p.sub_info || bd."cFilename"::text ,"cFiletype"::text kind,''::text "cBundletag", null "nParentBundleid",  case when coalesce(bd."cTab",'') !='' then bd.sorted_tab else '{}'::text[] end sorted_tab,bd.sorted_name
            from present."PMDocuments" pmd 
        join present."PresentationMaster" pm on pm."nPresentid" = pmd."nPresentid"
        join tree_data p on pm."dCreateDt"::date = p."dCreateDt"::date and p."nParentBundleid" = '00000000-0000-0000-0000-000000000001'::uuid -- and pm."cName" = p."cFilename"
        join "BundleDetail" bd on bd."nBundledetailid" = pmd."nBundledetailid"         
        left join "DownloadTDetail" dt on dt."nBDid" = bd."nBundledetailid" and "nDTaskid" = nDTaskid 
        where pm."nCreateid"  = nMasterid and pm."nTypeid" = nTypeid and pm."cStatus" = 'C' and pm."nCaseid" =  nCaseid        
        And case when array_length(jFiles::uuid[], 1) is not null then bd."nBundledetailid" = ANY(jFiles::uuid[]) else true end 
        AND  case when nSubtypeid > 0 then pm."nSubtypeid" = nSubtypeid else true end
        AND ((dStartDt IS NOT NULL AND dEndDt IS NOT NULL AND 
             pmd."dCreateDt"::DATE BETWEEN dStartDt AND dEndDt)
            OR
            (dStartDt IS NULL OR dEndDt IS NULL))     
 and case when  coalesce(cPname,'A') !='A' and cPname !='' then pm."cName" = cPname else true end    
 group by p.serial,bd."nBundledetailid", bd."cFilename","cTab","cExhibitno","cRefpage","dIntrestDt","cDescription",pm."dCreateDt"::date,"cFiletype",
 p.sub_info 
            ) t ORDER BY serial,sub_info,sorted_tab,sorted_name

          ;

    RETURN NEXT ref2;         
         
    
    
END;
$function$
