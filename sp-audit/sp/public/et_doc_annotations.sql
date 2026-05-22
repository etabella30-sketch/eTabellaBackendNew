CREATE OR REPLACE FUNCTION public.et_doc_annotations(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;
    nBundledetailid uuid;nPresentid uuid;
BEGIN

    nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
    nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
    nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;

-- select * from et_doc_annotations('{"nBundledetailid":"168390-uuid-format","nMasterid":"366-uuid-format"}','r');fetch all in "r";
    
-- select * From "FactMaster" order by 1 desc where "" 326284 326284 21234
-- select * from "FactDetail" 
    open ref for 
-- select * from annotations limit 100
-- select * from "FactMaster" order by 1 desc
-- select * from "FMShared" order by 1 desc
-- select * from "DMShared" order by 1 desc
-- select * from "WMShared" order by 1 desc

/*

        select * From present."PresentationMaster"

        select * From "Annotations" a where "nBDid" = "11866-uuid-format"
        
        select * From present."PMHighlights"
        select * From present."PMLinkShared"
        
*/

        
with tbl as (
    select f."nFSid" as id,f."nFSid",'00000000-0000-0000-0000-000000000000'::uuid as "nDocid",'00000000-0000-0000-0000-000000000000'::uuid as "nWebid",coalesce(f."cFType",'F') as "linktype"
    from "FactMaster" f
    left join "FMShared" s on s."nFSid" = f."nFSid"
    left join "LocationShare" ls on ls."nShareby" = f."nUserid" and ls."nBundledetailid" = nBundledetailid 
    where (f."nUserid" = nMasterid or s."nUserid" = nMasterid or ls."nUserid" = nMasterid) and f."nBundledetailid" = nBundledetailid
    union all
    select d."nDocid" as id,'00000000-0000-0000-0000-000000000000'::uuid as "nFSid", d."nDocid",'00000000-0000-0000-0000-000000000000'::uuid as "nWebid",'D' as "linktype"
    from "DocMaster" d
    left join "DMShared" s on s."nDocid" = d."nDocid"
    left join "LocationShare" ls on ls."nShareby" = d."nUserid" and ls."nBundledetailid" = nBundledetailid 
    where (d."nUserid" = nMasterid or s."nUserid" = nMasterid or ls."nUserid" = nMasterid) and d."nBundledetailid" = nBundledetailid
    union all
    select w."nWebid" as id,'00000000-0000-0000-0000-000000000000'::uuid as "nFSid",'00000000-0000-0000-0000-000000000000'::uuid as "nDocid",w."nWebid",'W' as "linktype"
    from "WebMaster" w
    left join "WMShared" s on s."nWebid" = w."nWebid"
    left join "LocationShare" ls on ls."nShareby" = w."nUserid" and ls."nBundledetailid" = nBundledetailid 
    where (w."nUserid" = nMasterid or s."nUserid" = nMasterid or ls."nUserid" = nMasterid) and w."nBundledetailid" = nBundledetailid  and false
    union all
        select h."nHLid" as id,'00000000-0000-0000-0000-000000000000'::uuid as "nFSid",'00000000-0000-0000-0000-000000000000'::uuid as "nDocid",'00000000-0000-0000-0000-000000000000'::uuid as "nWebid",'H' as "linktype" 
        from "HyperLink" h where h."nBundledetailid" = nBundledetailid
), alldata as (
        select t.id,t."nFSid",t."nDocid",t."nWebid",t."linktype"
        From tbl t
        group by t.id,t."nFSid",t."nDocid",t."nWebid",t."linktype"
        
),present_shared as (

    select distinct a."nAId",a."uuid",a."type",a."rects",a."lines",a."width",a."color",a."page",
    case when p."isWithLink" = true then
        CASE 
            WHEN a."nFSid" IS NOT NULL THEN a."nFSid"
            WHEN a."nDocid" IS NOT NULL THEN a."nDocid"
            ELSE a."nWebid"
        END
    else '00000000-0000-0000-0000-000000000000'::uuid end as "id",
    case when p."isWithLink" = true then
        case 
            when a."nFSid" IS NOT NULL then 'F' 
            when a."nDocid" IS NOT NULL then 'D'
            when a."nWebid" IS NOT NULL then 'W'
        else
            'P' 
        end
    else 'P' end as "linktype",a."nFSid",a."nDocid"
    ,a."nWebid"
    from present."PMLinkShared" p
    join "annotations" a on a."nAId" = p."nAId"
    join present."PresentationMaster" pm on pm."nPresentid" = p."nPresentid"
    where p."nBundledetailid" = nBundledetailid and p."nUserid" = nMasterid and pm."nCreateid" != nMasterid
        
) select t.id,a."nAId",a."uuid",a."type",a."rects",a."lines",a."width",a."color",a."page",a."nFSid",a."nDocid"
    ,a."nWebid",a."nHLid",a."isHyperlink",t."linktype",'00000000-0000-0000-0000-000000000000'::uuid as "nPresentid"
    from alldata t
    join annotations a on a."nFSid" = t."nFSid" or a."nDocid" = t."nDocid" or a."nWebid" = t."nWebid" or (a."nHLid" = t."id" and t."linktype" = 'H') 
        union all
     select distinct '00000000-0000-0000-0000-000000000000'::uuid as id,a."nAId",a."uuid",a."type",a."rects",a."lines",a."width",a."color",a."page",a."nFSid",a."nDocid"
    ,a."nWebid",a."nHLid",a."isHyperlink",'P' "linktype",a."nPresentid"
    from annotations a 
    join present."presenthighlights" h on h."nPresentid" = a."nPresentid" and(h."nCreateid" = nMasterid or (h."nUserid" = nMasterid and h."nAId" = a."nAId")) 
    where a."nBDid" = nBundledetailid and h."cStatus" = 'C'
    union all
        select a.id,a."nAId",a."uuid",a."type",a."rects",a."lines",a."width",a."color",a."page",a."nFSid",a."nDocid"
    ,a."nWebid",'00000000-0000-0000-0000-000000000000'::uuid as "nHLid",false as "isHyperlink",a."linktype",'00000000-0000-0000-0000-000000000000'::uuid as "nPresentid"
        from present_shared a

        

        -- select * From annotations
        -- select * From present.presenthighlights
    --where a."uuid" = '8f2d0b80-4b19-4c3a-8031-ac216cf2d419'
    ;

    
    RETURN ref; -- Return the cursor to the caller
END;
$function$
