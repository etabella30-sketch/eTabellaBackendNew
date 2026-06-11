-- Up: restore the public.et_share_get_bundles(json, refcursor) SP.
-- Context: the app (coreapi /bundles/getbundleshared -> db.executeRef('share_get_bundles'))
-- calls public.et_share_get_bundles, but on the 3.0.etabella.com.uuid database only
-- public.et_share_get_bundles_backupnow exists, so Private Bundle level-2 (a user's
-- shared bundles) returns "function does not exist". This body is the canonical version
-- found live on the etabella_legal_uuid database (same Vultr host/credentials).
-- Its CB/shared-bundle query is byte-identical to the CB branch of _backupnow on 3.0.
BEGIN;
CREATE OR REPLACE FUNCTION public.et_share_get_bundles(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;
    nSectionid uuid; nUserid uuid;
    nCaseid uuid;
BEGIN
    -- Parse input JSON once
    nMasterid := NULLIF(parameter ->> 'nMasterid','')::uuid;
    nSectionid := NULLIF(parameter ->> 'nSectionid','')::uuid;
    nUserid := NULLIF(parameter ->> 'nUserid','')::uuid;
    -- select * from et_share_get_bundles('{"nMasterid":29,"nSectionid":9039,"nUserid":367}','r1'); fetch all in "r1"

    OPEN ref1 FOR
        with bundle as
        (
            select ROW_NUMBER() OVER(ORDER BY substring("cBundletag", '\D+'),substring("cBundletag", '\d+')::numeric,"cBundletag",substring("cBundlename", '\D+'),substring("cBundlename", '\d+')::numeric,"cBundlename" ) serial, b."nBundleid",CASE WHEN b."nParentBundleid" IS NULL THEN null ELSE b."nParentBundleid" END "nParentBundleid",b."cBundlename",b."cBundletag"
            from "BundleMaster" b
            join (select distinct "nSectionid","nBundleid" from "BDShare" where "nSectionid" = nSectionid and "nUserid" = nMasterid and "nMasterid" = nUserid and "nBundledetailid" is null) shared on  b."nSectionid" = shared."nSectionid" and (case when shared."nBundleid" IS NOT NULL then shared."nBundleid" = b."nBundleid" else b."nParentBundleid" is null end)
            left join "BMPermission" p on p."nUserid" = nMasterid and p."nBundleid" = b."nBundleid"
            where case when shared."nBundleid" IS NOT NULL then b."nBundleid" = shared."nBundleid" else b."nParentBundleid" is null end
            group by b."cBundletag",b."cBundlename",b."nParentBundleid",b."nBundleid"
        ) select * from bundle
        order by serial;

    RETURN NEXT ref1;
END;
$function$;
COMMIT;
