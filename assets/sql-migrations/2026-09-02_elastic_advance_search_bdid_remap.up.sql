-- TEMP FIX: content search file list empty for case 54970cc5 (ARABTEC / DIAC 240221).
-- Root cause: Pleadings bundle deleted + re-uploaded 2026-08-31 -> new nBundledetailids.
-- Elasticsearch index still holds the 19 deleted ids, so elastic.et_advance_search's
-- inner join to BundleDetail drops every hit. This remaps dead ids -> live ids inside the SP.
-- Remove after the case is reindexed (run the .down.sql).

CREATE TABLE IF NOT EXISTS elastic.bdid_remap (
    old_id     uuid PRIMARY KEY,
    new_id     uuid NOT NULL,
    note       text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- old (DeleteBundleDetail / UploadDetail 2026-08-26 job, bundle 4ca492dc) -> new (BundleDetail, bundles 719ec566 / a3273066)
INSERT INTO elastic.bdid_remap (old_id, new_id, note) VALUES
('261abef0-66a0-49e6-98d1-6f25354691c7','9a935423-97e7-4837-8c47-67918536b9ba','I1 RFA Arabtec vs Front Line'),
('36afd63f-cfcc-48eb-b83e-df11dee38e73','a603759d-8014-46e3-ad03-ddde363d9fbd','I3 Respondent''s Application for Security for Costs'),
('d9aa08bf-4c1b-414c-90fc-806d2ef31e87','681a48a2-38a5-447b-bb0b-5497c64bf7db','I4 Claimant''s response to application for security for costs'),
('52bdc586-7970-403b-b103-b2cbb8ef7ca5','e11d2f6a-2154-43c6-ac7d-0f6503067db1','I5 Claimant''s SOC'),
('37c186ab-7484-4cb1-a480-24d891fba85e','18e98c12-7084-4d40-91e1-7e84ce0397c5','I6 R Statement of Defence and Counterclaim'),
('fd94a7b1-2237-489f-b6d8-b087ce240b21','783382a3-e0fa-4640-afa7-e25dc55a9f68','I7.1 Annex 1 Claimant''s Redfern'),
('d3abf9a7-6d06-49dc-807f-7b302f8837ab','13c4a10e-e00c-494b-92cb-5593298c621f','I7.2 Claimant''s Document Production'),
('f05615b1-f877-4f6e-a79a-7bd04b458ede','ca755a95-8a67-4199-acca-8b0b6ccb7e43','I8 Respondents Redfern Schedule'),
('cf5cdaa1-fc39-4888-876c-8d42e6a6d227','2ec3d2eb-7a5d-4ecf-b6d4-312563c2228e','I9 Claimant''s Communication on Document Searches'),
('64a89fac-2b6d-4b2e-805e-9722311a7ba8','379364e6-96f7-4f75-bb8a-47ae5512f5db','I10 Claimant''s Reply to SOD & Defence to Counterclaim'),
('8a939839-d1ec-458b-981a-741dcd0702bd','7ef22357-3c89-4e7f-858f-a3fd7f398cf8','I11 R Statement of Reply to Counterclaim'),
('720c3784-e61e-4bef-897f-03d40e0294fa','92ca6df5-d43a-4bb2-a322-14baf1870aa7','I12 Claimant''s Answer to Tribunal''s Questions'),
('2dcdd7fe-112b-4c8a-bc5b-dd2ca98553fd','ff4e6b25-0412-4870-84ae-c95213ad171f','I13 R Answers to Tribunals questions - counterclaim'),
('136b7e29-c875-4755-9e87-c4baebfb2dae','5aa285b3-f4db-448d-8c67-55c634d185ac','I14 Claimant''s Responsive Submission'),
('00a68cdc-f336-41ad-8c69-9a92ab0098d7','d7f5b050-874f-472b-a157-184cff88a602','I15 R Response to Claimants Answers - counterclaim'),
('891edf14-92b0-4a0b-86d0-64ecd6e322e2','bbb77a04-ae79-49ea-a675-cc32e0262a7e','I16 Claimant''s document production request'),
('41f480b8-a4c2-4226-930f-2b71f3a2d251','4ee71373-1a35-4ed2-b4ea-3eb775c30a30','I17 Claimant''s Document Production Request - RCC Item 9'),
('0440d6d9-a698-4d31-9f28-0ebc810c3ef5','9afb2307-9df2-4894-ad78-ee2e317097c7','I18 R Responses to Claimant''s documents request (docx)'),
('fbcef1f7-622d-46d5-9312-1fd226ac554b','ee4e1876-3067-467a-b61e-ac562e5431c4','I19 Claimant''s Defence to Delay Damages')
ON CONFLICT (old_id) DO UPDATE SET new_id = EXCLUDED.new_id, note = EXCLUDED.note;

-- Patched SP: identical to original except dts remaps dead ids via elastic.bdid_remap
-- and collapses duplicates (old+new both present) to one row.
CREATE OR REPLACE FUNCTION elastic.et_advance_search(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nCaseid    uuid;
    nMasterid  uuid;
    nSectionid uuid;
    jFiles     jsonb;
BEGIN
    nCaseid    := (parameter ->> 'nCaseid')::uuid;
    nMasterid  := (parameter ->> 'nMasterid')::uuid;
    nSectionid := NULLIF(parameter ->> 'nSectionid', '')::uuid;
    jFiles     := parameter ->> 'jFiles';

    OPEN ref FOR
        WITH raw AS (
            SELECT * FROM jsonb_to_recordset(jFiles)
              AS ("nBundledetailid" uuid, "matches" int)
        ), dts AS (
            -- TEMP: remap deleted ids still present in the search index to their re-uploaded rows
            SELECT COALESCE(r.new_id, x."nBundledetailid") AS "nBundledetailid",
                   MAX(x."matches")                          AS "matches"
            FROM raw x
            LEFT JOIN elastic.bdid_remap r ON r.old_id = x."nBundledetailid"
            GROUP BY 1
        ), tbl AS (
            SELECT
                b."nBundledetailid",
                b."cTab",
                b."cExhibitno",
                b."cFilename" AS "cName",
                b."cPath",
                COALESCE(b."cRefpage", b."cPage") AS "cPage",
                b."cFiletype",
                b."dIntrestDt",
                b."sorted_tab",
                b."start_date",
                b."end_date",
                t."matches",
				bm."cBundletag"
            FROM "BundleDetail" b
            JOIN "SectionMaster" s ON s."nSectionid" = b."nSectionid"
            JOIN dts t ON t."nBundledetailid" = b."nBundledetailid"
			left join "BundleMaster" bm on bm."nBundleid" = b."nBundleid"
			WHERE b."cStatus" = 'C'
              AND s."nCaseid" = nCaseid
              AND CASE WHEN nSectionid IS NOT NULL
                       THEN b."nSectionid" = nSectionid
                       ELSE TRUE
                  END
        )
        SELECT
            t."nBundledetailid",
            t."cTab",
            t."cExhibitno",
            t."cName",
            t."cPath",
            t."cPage",
            t."cFiletype",
			t."cBundletag"
        FROM tbl t
        ORDER BY t.matches DESC;

    RETURN ref;
END;
$function$;
