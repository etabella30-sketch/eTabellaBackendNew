CREATE OR REPLACE FUNCTION public.et_notification_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nCaseid uuid;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid   := NULLIF(parameter ->>'nCaseid','')::uuid;

/*
select * from et_notification_list ('{"nCaseid":"...","nMasterid":"..."}','r1');
fetch all in "r1";

select * From present."PresentationMaster"
*/

open ref for
    select
        n."nNTid", n."nUserid", n."cTitle", n."cMsg", n."dDate", n."cStatus",
        n."nFSid", n."nDocid", n."nWebid", n."cType", n."nBundledetailid",
        fm."nBundledetailid" as "nFBundledetailid",
        dm."nBundledetailid" as "nDBundledetailid",
        wm."nBundledetailid" as "nWBundledetailid",
        b."cFilename", b."cTab", b."cBundletag", b."cPage",
        n."nUPid", up."nCaseid", n."bIsseen",
        um."cFname", um."cLname", um."cProfile",
        n."nRefuserid", n."nPresentid",
        pr."cStatus" as "cPresentStatus"
    from "Notifications" n
    left join "UserMaster"  um on um."nUserid" = n."nRefuserid"
    left join "FactMaster"  fm on fm."nFSid"   = n."nFSid"
    left join "DocMaster"   dm on dm."nDocid"  = n."nDocid"
    left join "WebMaster"   wm on wm."nWebid"  = n."nWebid"
    left join "UploadMaster" up on up."nUPid"  = n."nUPid"
    -- Coalesce candidate bundle-detail IDs so FS/DS/WS share rows
    -- (which leave n."nBundledetailid" NULL) resolve via the master
    -- row instead. See migration:
    --   assets/sql-migrations/2026-05-05_notification_list_bundle_enrichment.sql
    left join "bundlesource" b on b."nBundledetailid" = COALESCE(
        n."nBundledetailid",
        fm."nBundledetailid",
        dm."nBundledetailid",
        wm."nBundledetailid"
    )
    left join present."PresentationMaster" pr on pr."nPresentid" = n."nPresentid"
    where n."nCaseid" = nCaseid
      and n."nUserid" = nMasterid
    order by n."dDate" desc;

RETURN ref;
END;
$function$
;
