-- 2026-09-07 — Fact fields baseline (KF "Proposed Fact Fields" 04.09 + "Revised Fact Creation
-- Workflow" 05.09). Plan: eTabella angular 21/docs/fact-fields-workflow-plan.md.
--
--  * Codemaster cat 5 (Impact) reworded: Strongly For Us / For Us / Neutral / Against Us /
--    Strongly Against Us; "Unsure" retired (serial NULL → hidden from pickers, old facts keep it).
--  * Codemaster cat 4 (Significance, formerly Relevance): "Neutral" retired.
--  * Codemaster cat 23 (Source Type): the 9 KF values (existing Contract / Correspondence /
--    Expert Report / Witness Statement rows renamed and re-serialed, 5 new rows); the old
--    Drawing / Invoice / Variation Order / Photograph rows retired.
--  * Codemaster cat 24 (Dispute Status): + Undisputed, + Partially Disputed, Disputed kept;
--    Stipulated / Alleged / Tentative retired. 0 = Not Assessed.
--  * NEW Codemaster cat 27 (Review Status): Open / In Review / Finalized.
--  * NEW column "FactDetail"."nReviewid" (cat 27; NULL reads as Open).
--  * SPs: et_fact_insert_detail (nRv), realtime.et_factsheet_submit (nRv, key-present),
--    et_fact_update (nReviewid, key-present), et_fact_get_detail / realtime.et_factsheet_detail /
--    et_workspace_fact_list / et_navigate_factlist / et_export_fact_detail (return nReviewid +
--    cReview), filter_columnnames (REVIEW filter name).
--  * Data: old FactDetail.nFiletype / nStatus codes remapped onto the new vocabulary.
-- Apply to the DEV database etabella_tech_uuid only (guarded). realtime-server + coreapi DTOs
-- declare the new keys; both need a rebuild + restart.
DO $g$ BEGIN
  IF current_database() NOT IN ('etabella_tech_uuid', 'etabella_rg') THEN
    RAISE EXCEPTION 'ABORT: wrong database %', current_database();
  END IF;
END $g$;

-- ---------------------------------------------------------------- code rows
-- cat 5: Impact wording (ids unchanged, so FMIssue.nImpactid keeps meaning)
UPDATE "Codemaster" SET "cCodename" = 'Strongly For Us',     "nSerialno" = 1 WHERE "nCodeid" = 20 AND "nCategoryid" = 5;
UPDATE "Codemaster" SET "cCodename" = 'For Us',              "nSerialno" = 2 WHERE "nCodeid" = 19 AND "nCategoryid" = 5;
UPDATE "Codemaster" SET "cCodename" = 'Neutral',             "nSerialno" = 3 WHERE "nCodeid" = 22 AND "nCategoryid" = 5;
UPDATE "Codemaster" SET "cCodename" = 'Against Us',          "nSerialno" = 4 WHERE "nCodeid" = 18 AND "nCategoryid" = 5;
UPDATE "Codemaster" SET "cCodename" = 'Strongly Against Us', "nSerialno" = 5 WHERE "nCodeid" = 21 AND "nCategoryid" = 5;
UPDATE "Codemaster" SET "nSerialno" = NULL WHERE "nCodeid" = 23 AND "nCategoryid" = 5;   -- Unsure: retired
-- cat 4: Significance (was Relevance) — Neutral retired
UPDATE "Codemaster" SET "nSerialno" = NULL WHERE "nCodeid" = 17 AND "nCategoryid" = 4;
-- cat 23: Source Type
UPDATE "Codemaster" SET "cCodename" = 'Contract/Agreement', "nSerialno" = 1, "nUserid" = NULL WHERE "nCodeid" = 50 AND "nCategoryid" = 23;
UPDATE "Codemaster" SET "cCodename" = 'Correspondence',     "nSerialno" = 2, "nUserid" = NULL WHERE "nCodeid" = 51 AND "nCategoryid" = 23;
UPDATE "Codemaster" SET "cCodename" = 'Witness Evidence',   "nSerialno" = 6, "nUserid" = NULL WHERE "nCodeid" = 49 AND "nCategoryid" = 23;
UPDATE "Codemaster" SET "cCodename" = 'Expert Evidence',    "nSerialno" = 7, "nUserid" = NULL WHERE "nCodeid" = 48 AND "nCategoryid" = 23;
UPDATE "Codemaster" SET "nSerialno" = NULL WHERE "nCodeid" IN (52, 53, 54, 55) AND "nCategoryid" = 23;   -- Drawing / Invoice / Variation Order / Photograph: retired
INSERT INTO "Codemaster" ("nCategoryid", "cCodename", "nSerialno")
SELECT 23, v.name, v.serial FROM (VALUES
  ('Contemporaneous Record', 3), ('Financial/Commercial Record', 4), ('Pleading/Submission', 5), ('Decision/Order', 8), ('Other', 9)
) AS v(name, serial)
WHERE NOT EXISTS (SELECT 1 FROM "Codemaster" c WHERE c."nCategoryid" = 23 AND lower(c."cCodename") = lower(v.name));
-- cat 24: Dispute Status
UPDATE "Codemaster" SET "nSerialno" = 3, "nUserid" = NULL WHERE "nCodeid" = 45 AND "nCategoryid" = 24;   -- Disputed
UPDATE "Codemaster" SET "nSerialno" = NULL WHERE "nCodeid" IN (44, 46, 47) AND "nCategoryid" = 24;      -- Stipulated / Alleged / Tentative: retired
INSERT INTO "Codemaster" ("nCategoryid", "cCodename", "nSerialno")
SELECT 24, v.name, v.serial FROM (VALUES ('Undisputed', 1), ('Partially Disputed', 2)) AS v(name, serial)
WHERE NOT EXISTS (SELECT 1 FROM "Codemaster" c WHERE c."nCategoryid" = 24 AND lower(c."cCodename") = lower(v.name));
-- cat 27: Review Status (new category)
INSERT INTO "Codemaster" ("nCategoryid", "cCodename", "nSerialno")
SELECT 27, v.name, v.serial FROM (VALUES ('Open', 1), ('In Review', 2), ('Finalized', 3)) AS v(name, serial)
WHERE NOT EXISTS (SELECT 1 FROM "Codemaster" c WHERE c."nCategoryid" = 27 AND lower(c."cCodename") = lower(v.name));

-- ---------------------------------------------------------------- column
ALTER TABLE public."FactDetail" ADD COLUMN IF NOT EXISTS "nReviewid" integer;

-- ---------------------------------------------------------------- data: old codes → new vocabulary
DO $d$
DECLARE
  id_contemp int := (SELECT "nCodeid" FROM "Codemaster" WHERE "nCategoryid" = 23 AND "cCodename" = 'Contemporaneous Record' LIMIT 1);
  id_fin     int := (SELECT "nCodeid" FROM "Codemaster" WHERE "nCategoryid" = 23 AND "cCodename" = 'Financial/Commercial Record' LIMIT 1);
  id_other   int := (SELECT "nCodeid" FROM "Codemaster" WHERE "nCategoryid" = 23 AND "cCodename" = 'Other' LIMIT 1);
  id_undisp  int := (SELECT "nCodeid" FROM "Codemaster" WHERE "nCategoryid" = 24 AND "cCodename" = 'Undisputed' LIMIT 1);
BEGIN
  -- source type: Invoice → Financial/Commercial; Drawing / Variation Order / Photograph + cat-2 "Record" → Contemporaneous;
  -- cat-2 "Documentary" → Other; cat-2 "Expert opinion" → Expert Evidence; cat-2 "Witness statement" → Witness Evidence
  UPDATE "FactDetail" SET "nFiletype" = id_fin     WHERE "nFiletype" = 53;
  UPDATE "FactDetail" SET "nFiletype" = id_contemp WHERE "nFiletype" IN (52, 54, 55, 6);
  UPDATE "FactDetail" SET "nFiletype" = id_other   WHERE "nFiletype" = 5;
  UPDATE "FactDetail" SET "nFiletype" = 48         WHERE "nFiletype" = 7;
  UPDATE "FactDetail" SET "nFiletype" = 49         WHERE "nFiletype" = 8;
  -- dispute status: Stipulated (44 / cat-3 10) + cat-3 Undisputed (12) → Undisputed; cat-3 Disputed (11) → Disputed (45);
  -- Alleged / Tentative / cat-3 Assumption → Not Assessed
  UPDATE "FactDetail" SET "nStatus" = id_undisp WHERE "nStatus" IN (44, 10, 12);
  UPDATE "FactDetail" SET "nStatus" = 45        WHERE "nStatus" = 11;
  UPDATE "FactDetail" SET "nStatus" = 0         WHERE "nStatus" IN (46, 47, 9);
END $d$;

-- ---------------------------------------------------------------- stored procedures
CREATE OR REPLACE FUNCTION public.et_fact_insert_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFSid uuid;jText jsonb;nFt integer;nSt integer;nRv integer;
jDate jsonb;cType text;nTZid integer;jOT jsonb;
jAn jsonb;nColorid uuid;jLinktype jsonb;cIsNote text;
bIsHighlighted boolean;
-- select * from "FactDetail" limit 0
BEGIN
nFSid := NULLIF(parameter->>'nFSid','')::uuid;
jText := parameter->>'jT';
nFt := parameter->>'nFt';
nSt := parameter->>'nSt';
nRv := NULLIF(parameter->>'nRv','')::int;   -- review status (Codemaster cat 27), 2026-09-07
jDate:= parameter->>'jDate';
cType := parameter->>'cType';
nTZid := parameter->>'nTZid';
jOT := parameter->>'jOT';
jAn := parameter->>'jAn';
nColorid:= NULLIF(parameter->>'nColorid','')::uuid;
jLinktype := parameter ->> 'jLinktype';
cIsNote := parameter->>'cIsNote';
bIsHighlighted := parameter->>'bIsHighlighted';

-- alter table "FactDetail" add column "cIsNote" character varying(1) default 'N';

/*
select * from et_fact_insert_detail ('{...}','r1');fetch all in "r1";

select * from "FactDetail" order by 1 desc

alter table "FactDetail" add column "cIsNote" character varying(1) default 'N';

*/
-- select * from "Annotations" order by 1 desc

	insert into "FactDetail" ("nFSid","nFiletype","nTZid","jDate","nStatus","cType","jTexts","jOT","nColorid","jLinktype","cIsNote", "bIsHighlighted","nReviewid")
	select nFSid,nFt,nTZid,jDate,nSt,cType,jText,jOT,nColorid,jLinktype,coalesce(cIsNote,'N'),bIsHighlighted,nRv;
	
	insert into "Annotations"("uuid","type","rects","lines","colorid","width","page","nFSid","dCreateDt")
	select "uuid","type",coalesce("rects",'[]'::jsonb),coalesce("lines",'[]'::jsonb),nColorid,"width","page",nFSid,now() from jsonb_to_recordset(jAn) as ("uuid" text,"type" text,"rects" jsonb,"lines" jsonb,width int,"colorid" uuid,"page" int);
	
	open ref for select 1 msg;
    RETURN ref;
END;
$function$;

CREATE OR REPLACE FUNCTION realtime.et_factsheet_submit(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nFSid UUID;nMasterid uuid;
nSesid uuid;nColorid uuid;
nFt int;nSt int; nRv integer;
jFl jsonb;jIssues jsonb;jContacts jsonb;jTasks jsonb;jUsers jsonb;jDate jsonb;jT jsonb;

BEGIN

nFSid := (parameter ->>'nFSid')::UUID;
nMasterid := (parameter->>'nMasterid')::uuid;

nSesid := (parameter ->>'nSesid')::UUID;
nColorid := (parameter ->>'nColorid')::UUID;

nFt := parameter ->>'nFt';
nSt := parameter ->>'nSt';
nRv := NULLIF(parameter ->>'nRv','')::int;

jFl := parameter ->>'jFl';
jIssues := parameter ->>'jIssues';
jContacts := parameter ->>'jContacts';
jTasks := parameter ->>'jTasks';
jUsers := parameter ->>'jUsers';
jDate := parameter ->>'jDate';
jT := parameter ->>'jT';

/*
select * from realtime.et_factsheet_submit ('{"nFSid":"b70b6782-0e93-438b-9421-19b3331d3e88","nSesid":"79d6fa26-7d27-49a3-8204-1e128505b682","nColorid":"fa9402d3-1132-4d90-a449-c8aec21a52ad","nFt":230,"nSt":235,"jFl":"[{\"b\":\"4f8b09a1-bb84-4bc6-8820-67ec61153e29\",\"Linktype\":{\"end\":35,\"type\":\"P\",\"pages\":[],\"start\":3}},{\"b\":\"93e55e26-d690-4354-9703-82a6b664f472\",\"Linktype\":{\"end\":164,\"type\":\"P\",\"pages\":[],\"start\":2}}]","jIssues":"[{\"nIid\":\"8394121e-a3c6-41c5-9ed2-da690433e9cc\",\"nImpactid\":22,\"nRelid\":15},{\"nIid\":\"d27c56d7-e723-4d48-bce3-332968ada019\",\"nImpactid\":0,\"nRelid\":0},{\"nIid\":\"fa9402d3-1132-4d90-a449-c8aec21a52ad\",\"nImpactid\":21,\"nRelid\":14}]","jContacts":"[{\"c\":\"81520e33-18f3-40b8-8a92-1ce0d6024814\"}]","jTasks":"[{\"t\":\"588c9ec2-0874-41e7-9994-2b5741843d24\"},{\"t\":\"cb804998-3dd6-4732-93d8-b8c9088b02ce\"}]","jUsers":"[{\"nUserid\":\"7ee7a723-d96d-4d63-81c1-4dc4a2be4699\",\"bCanEdit\":null,\"bCanCopy\":null,\"bCanReshare\":true,\"bCanComment\":true}]","jDate":"{\"type\":\"D\",\"cValue\":\"Between\",\"nValue\":245,\"record\":[{\"date\":\"2025-08-11T00:00:00.000Z\"},{\"date\":\"2025-08-27T00:00:00.000Z\"}]}","jT":"[\" provision.  But then it would have been \\n    incouple.  on KFH to sir you were provided -- you''re\\n    obliged to provide these financial statements, where are\\n    they?  There''s no evidence to suggest that --\\nMR EGGERS:  Is it in dispute whether these additional\\n    statements were provided or not?\\nMR IKRAM:  No.  Our understanding is it''s not in dispute\\n    that the only financial statements that were produced --\\nMR EGGERS:  January, May 2008.\"]","nMasterid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5"}','r1');fetch all in "r1";

 select * From "FactDetail"
 select * From "FactMaster"
*/

	update "FactDetail" set "jDate" = jDate,"nFiletype" = nFt,"nStatus" = nSt,"nReviewid" = CASE WHEN (parameter::jsonb) ? 'nRv' THEN nRv ELSE "nReviewid" END,"nColorid" = nColorid,"jTexts" = jT where "nFSid" = nFSid;

-- jFl  select * from "FMLinks" where "nFSid" = 'b70b6782-0e93-438b-9421-19b3331d3e88'
	with tbl as (
		select * from jsonb_to_recordset(jFl) as ("b" uuid,"Linktype" jsonb)
	),del_op as (
		delete from "FMLinks" l 
		where l."nFSid" = nFSid 
			and not exists (
			select * from tbl t where t."b" = l."nBundledetailid"
			)
		returning "nFMLid"
	) insert into "FMLinks" ("jLinktype","nBundledetailid","nFSid")
		select t."Linktype",t."b",nFSid 
		from tbl t 
		where not exists (
			select * from "FMLinks" f where f."nFSid" = nFSid and f."nBundledetailid" = t."b" 
		);

-- jIssues select * from "FMIssue" where "nFSid" = 'b70b6782-0e93-438b-9421-19b3331d3e88'

	with tbl as (
		select * from jsonb_to_recordset(jIssues) as ("nIid" uuid,"nImpactid" int,"nRelid" int)
	),update_op as (
		update "FMIssue" f set "nRelevanceid" = t."nRelid","nImpactid" = t."nImpactid" 
		from tbl t where f."nFSid" = nFSid and t."nIid" = f."nIssueid"
		returning "nFMIid"
	),delete_op as (
		delete from "FMIssue" f where f."nFSid" = nFSid and  not exists (select * from tbl t where t."nIid" = f."nIssueid")
		returning "nFMIid"
	) insert into "FMIssue" ("nImpactid","nRelevanceid","nFSid","nIssueid")
		select t."nImpactid",t."nRelid",nFSid,t."nIid" from tbl t where not exists (select * from "FMIssue" f where f."nFSid" = nFSid and f."nIssueid" = t."nIid");

-- jContacts select * from "FMContact" where "nFSid" = 'b70b6782-0e93-438b-9421-19b3331d3e88'

	with tbl as (
		select * from jsonb_to_recordset(jContacts) as ("c" uuid)
	),delete_op as (
		delete from "FMContact" f where f."nFSid" = nFSid and not exists (select * from tbl t where t."c" = f."nContactid")
		returning "nFMCid"
	) insert into "FMContact" ("nContactid","nFSid")
		select t."c",nFSid from tbl t where not exists (select * from "FMContact" f where f."nFSid" = nFSid and f."nContactid" = t."c" );
		
-- jTasks  select * from "FMTasks" where "nFSid" = 'b70b6782-0e93-438b-9421-19b3331d3e88'

	with tbl as (
		select * from jsonb_to_recordset(jTasks) as ("t" uuid)
	),delete_op as (
		delete from "FMTasks" f where f."nFSid" = nFSid and not exists (select * from tbl t where t."t" = f."nTaskid")
		returning "nFMTsid"
	) insert into "FMTasks" ("nTaskid","nFSid")
		select t."t",nFSid from tbl t where not exists (select * from "FMTasks" f where f."nFSid" = nFSid and f."nTaskid" = t."t" );

-- jUsers  select * from "FMShared" where "nFSid" = 'b70b6782-0e93-438b-9421-19b3331d3e88'

	/*with tbl as (
		select * from jsonb_to_recordset(jUsers) as ("nUserid" uuid,"bCanEdit" boolean,"bCanCopy" boolean,"bCanReshare" boolean,"bCanComment" boolean)
	),update_op as (
		update "FMShared" f set "bCanEdit" = t."bCanEdit","bCanCopy" = t."bCanCopy" ,"bCanReshare" = t."bCanReshare" ,"bCanComment" = t."bCanComment" 
		from tbl t where f."nFSid" = nFSid and t."nUserid" = f."nUserid"
		returning "nFMSdid"
	),delete_op as (
		delete from "FMShared" f where f."nFSid" = nFSid and not exists (select * from tbl t where t."nUserid" = f."nUserid")
		returning "nFMSdid"
	) insert into "FMShared" ("nUserid","nFSid","bCanEdit","bCanCopy","bCanReshare","bCanComment")
		select t."nUserid",nFSid,t."bCanEdit",t."bCanCopy",t."bCanReshare",t."bCanComment" 
		from tbl t where not exists (select * from "FMShared" f where f."nFSid" = nFSid and f."nUserid" = t."nUserid" );*/

		
		

	update "FactMaster" set "dUpdateDt" = now() where "nFSid" = nFSid;

    OPEN ref1 FOR
	select 1 as msg,'FactSheet Update' as value;
    RETURN NEXT ref1;
    
    
END;
$function$;

CREATE OR REPLACE FUNCTION realtime.et_factsheet_detail(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nFSid UUID;nMasterid uuid;

	isAdmin boolean default false;
	nRoleid uuid;nTeamid uuid;nCaseid uuid;
	bIsTranscipt boolean default false;
BEGIN

nFSid := (parameter ->>'nFSid')::UUID;
nMasterid := (parameter->>'nMasterid')::uuid;
bIsTranscipt := COALESCE(parameter ->> 'bIsTranscipt','false')::boolean;

isAdmin := case when exists (  select * from "UserMaster" where "nUserid" = nMasterid and "isAdmin" = true )  then true  else false  end;

	select "nCaseid" into nCaseid from "FactMaster" where  "nFSid" =  nFSid;
	select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nMasterid and "nCaseid" = nCaseid limit 1;
	if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then
		isAdmin := true;
	end if;

    OPEN ref1 FOR
	select f."dCreateDt",f."cFType",f."nFSid",f."nUserid",
	d."jDate",d."nFiletype",d."nStatus",d."nReviewid",d."cType",d."jLinktype",d."jTexts",d."jOT",d."cIsNote",d."nColorid",
	-- CASE on bIsTranscipt so the published-view SP returns the transferred
	-- (page, line) written by run3.py during transferAnnotations. Mirrors the
	-- canonical pattern in et_marks.sql:57-58 for RHighlights.
	CASE WHEN COALESCE(bIsTranscipt,false) THEN d."nTPage" ELSE d."nPage" END AS "nPage",
	CASE WHEN COALESCE(bIsTranscipt,false) THEN d."nTLine" ELSE d."nLine" END AS "nLine",
	(u."cFname" || ' ' || coalesce(u."cLname", '')) AS "cCreatedBy",

	case when f."nUserid" = nMasterid or isAdmin then true else  fs."nFSid" is not null end as "bCanView",
	f."nUserid" = nMasterid or isAdmin as "bCanDelete",
	case when f."nUserid" = nMasterid or isAdmin then true else  fs."bCanComment" end as "bCanComment",
	case when f."nUserid" = nMasterid or isAdmin then true else  fs."bCanEdit" end as "bCanEdit",
	case when f."nUserid" = nMasterid or isAdmin then true else  fs."bCanReshare" end as "bCanReshare",
	rs."cName",
	b."cFilename",
	b."cTab",
	bm."cBundletag"
	From "FactMaster" f
	join "FactDetail" d on d."nFSid" = f."nFSid"
	join "UserMaster" u on u."nUserid" = f."nUserid"
	left join "RSessionMaster" rs on rs."nSesid" = f."nSesid"
	left join "BundleDetail" b on b."nBundledetailid" = f."nBundledetailid"
	left join "BundleMaster" bm on bm."nBundleid" = b."nBundleid"
	left join "FMShared" fs on fs."nFSid" = f."nFSid" and fs."nUserid" = nMasterid
	where f."nFSid" = nFSid
	  -- Orphan filter: on the published view, suppress facts whose annotation
	  -- could not be re-anchored (run3.py stamped 'O' and cleared jTCordinates).
	  AND (
	    COALESCE(bIsTranscipt, false) = false
	    OR (d."cTransferStatus" IS DISTINCT FROM 'O' AND d."jTCordinates" IS NOT NULL)
	  );
    RETURN NEXT ref1;


END;
$function$;

CREATE OR REPLACE FUNCTION public.et_fact_update(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
	
DECLARE nFSid uuid;jDate jsonb;jC jsonb;jIssue jsonb;jL jsonb;jT jsonb;jTexts jsonb;jU jsonb;
nFiletype int;nStatus int;nReviewid int;nTZid int;nColorid uuid;nFMLid uuid;rec record;Color text;
bIsHighlighted boolean; nMasterid uuid; jNotify jsonb; nCaseid uuid; nPMid int;

BEGIN
nFSid := NULLIF(parameter ->>'nFSid','')::uuid;
jDate := parameter ->>'jDate';
jC := parameter ->>'jC';
jIssue := parameter ->>'jIssue';
jL := parameter ->>'jL';
jT := parameter ->>'jT';
jTexts := parameter ->>'jTexts';
jU := parameter ->>'jU';
nFiletype := parameter ->>'nFiletype';
nStatus := parameter ->>'nStatus';
nReviewid := NULLIF(parameter ->>'nReviewid','')::int;
nTZid := parameter ->>'nTZid';
nColorid := NULLIF(parameter ->>'nColorid','')::uuid;
bIsHighlighted := parameter->>'bIsHighlighted';
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
/*

select * from public.et_fact_update ('{"nFSid":"40b40496-fff6-458f-84a4-97eec5fbba76","nTZid":98,"nFiletype":0,"nStatus":0,"jDate":"{\"type\":207,\"date1\":\"2024-12-26 04:31 PM\",\"date2\":\"\"}","jIssue":"[[\"7287a248-6e81-42af-867e-dcb1d48423c2\",0,0],[\"0d91c10a-c1c1-4ca9-ae8c-8b62a228cd19\",0,0],[\"c0d4e4ef-2bf9-4b02-8d4a-e77d387785ff\",0,0]]","jC":"[]","jT":"[]","jU":"[]","jTexts":"[\"where I indicate to the contrary, the facts and matters contained in this statement are within\\nmy own knowledge and belief. Where the facts are not within my own knowledge, I have identified\\nmy sources of information\"]","jL":"[]","nColorid":"c0d4e4ef-2bf9-4b02-8d4a-e77d387785ff","bIsHighlighted":false,"nMasterid":"3a168b69-1bb8-4c7e-881f-dff78a854f80"}','r1');fetch all in "r1";

*/

-- Get case ID
SELECT "nCaseid" INTO nCaseid FROM "FactMaster" WHERE "nFSid" = nFSid;

nPMid := (select "nPMid"  from "PermissionModule" where "cType" = 'NF' );

update "FactDetail" set "jDate" = jDate,"nFiletype"=nFiletype,"nStatus"=nStatus,
"nReviewid" = CASE WHEN (parameter::jsonb) ? 'nReviewid' THEN nReviewid ELSE "nReviewid" END,
"nTZid"=nTZid,"nColorid"=nColorid ,"jTexts" = jTexts, "bIsHighlighted" = bIsHighlighted
where "nFSid" = nFSid;

-- delete from "FMShared" where "nFSid" = nFSid;
-- insert into "FMShared"("nFSid","nUserid")
-- SELECT nFSid,t::uuid from jsonb_array_elements_text(jU) AS t;

-- Update sharing with notifications
WITH inserted_users AS (
    INSERT INTO "FMShared"("nFSid", "nUserid")
    SELECT nFSid, i.value::uuid
    FROM jsonb_array_elements_text(jU) AS i(value)
    WHERE NOT EXISTS (
        SELECT 1 FROM "FMShared" 
        WHERE "nFSid" = nFSid AND "nUserid" = i.value::uuid
    )
    RETURNING "nUserid"
),
deleted AS (
    DELETE FROM "FMShared" 
    WHERE "nFSid" = nFSid
    AND "nUserid" NOT IN (
        SELECT value::uuid FROM jsonb_array_elements_text(jU) AS i(value)
    )
),
notification_data AS (
    SELECT 
        u."nUserid",
        'Fact shared' as "cTitle",
        cr."cFname" || ' ' || cr."cLname" || ' has shared fact with you' as "cMsg",
        nFSid as "nFSid",
        u."cToken",
        'FS' as "cType",
        nCaseid as "nCaseid"
    FROM "UserMaster" u
    JOIN inserted_users ins ON ins."nUserid" = u."nUserid"
    JOIN "UserMaster" cr ON cr."nUserid" = nMasterid
	left join "UserPermission" up on up."nUserid" = u."nUserid"  and  up."nCaseid" = nCaseid and up."nPMid" = nPMid
	where
	 coalesce(up."nUPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid 
)
SELECT COALESCE(jsonb_agg(t), '[]') INTO jNotify FROM notification_data t;

update "Annotations" set "colorid" = coalesce(nColorid,"colorid") where "nFSid" = nFSid;

--select * from "FMIssue" where "nFSid" = 27

delete from "FMIssue" where "nFSid" = nFSid;
insert into "FMIssue"("nFSid","nIssueid","nImpactid","nRelevanceid")
SELECT nFSid,(t->>0)::uuid,(t->1)::int,(t->2)::int from jsonb_array_elements(jIssue) AS t;

delete from "FMTasks" where "nFSid" = nFSid;
insert into "FMTasks"("nFSid","nTaskid")
SELECT nFSid,t::uuid from jsonb_array_elements_text(jT) AS t;

delete from "FMContact" where "nFSid" = nFSid;
insert into "FMContact"("nFSid","nContactid")
SELECT nFSid,t::uuid from jsonb_array_elements_text(jC) AS t;

--select * from "FMContact"

drop table if exists temp_links;
create temp table temp_links as 
 select (t->>0)::uuid as "nFMLid",(t->>1)::uuid "nBundledetailid", (t->2) "jLinktype",coalesce((t->3),'[]'::jsonb) "highlights",coalesce((t->4),'[]'::jsonb) "jOTexts"
from jsonb_array_elements(jL) AS t;

WITH deleted_rows AS (
delete from "FMLinks" f where "nFSid" = nFSid and 
not exists (select * from temp_links t where t."nFMLid" = f."nFMLid" --t."nBundledetailid" = f."nBundledetailid"
	)
  RETURNING "nFMLid"
)
DELETE FROM "Annotations"
WHERE "nFMLid" IN (SELECT "nFMLid" FROM deleted_rows);

for rec in select *
FROM temp_links t where "nFMLid" IS NULL
LOOP
	 	 INSERT INTO "FMLinks" ("nFSid", "nBundledetailid", "jLinktype","jOTexts")    
		 SELECT nFSid, rec."nBundledetailid", rec."jLinktype",rec."jOTexts"
		 returning "nFMLid" into nFMLid;

	-- select * from "FMLinks"
INSERT INTO "Annotations" (
    "uuid", "type", "rects", "lines", "width","colorid", "page", "nFMLid", "dCreateDt"
)
SELECT  "uuid", "type", COALESCE("rects", '[]'::jsonb), COALESCE("lines", '[]'::jsonb), "width","colorid", "page", nFMLid, NOW()
FROM jsonb_to_recordset(rec.highlights) AS ( "uuid" text, "type" text, "rects" jsonb, "lines" jsonb, "width" int, "colorid" uuid, "page" int
);
end loop;

	
	select "cColor" into Color from "RIssueMaster" where "nIid" = nColorid;

	open ref for select 1 msg,'Updated' as value,nFSid as "nFSid",Color, jNotify "jNotify";
    RETURN ref;
END;
$function$;

CREATE OR REPLACE FUNCTION public.et_fact_get_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE 
    jFSids jsonb;
    nMasterid uuid;
BEGIN
    -- Extract and convert the nFSids array from the JSON parameter
--  SELECT et_fact_get_detail('{""jFSids"":""[1,2,3]""}', 'r');fetch all in ""r"";
    -- Extract nMasterid from the JSON parameter (if needed)
    nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
    jFSids := parameter->>'jFSids';
   -- select * from et_fact_get_detail ('{""jFSids"":""[710,706]"",""nMasterid"":2}','r1');fetch all in ""r1"";
	-- select * from "FactDetail" order by 1 desc
    -- Open the cursor for the desired query
    OPEN ref FOR
    SELECT 
        f."nFSid",
        f."dCreateDt",
        um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
        fd."nFiletype",
        fd."nTZid",
        tz."cCodename" AS "cTimezone",
        "jLinktype",
        fd."cType",
        f."cFType",
        fd."jTexts",
		fd."jOT",
        fd."nColorid",
        fd."nStatus",
        cl."cColor" AS "cColor",
		fd."jDate",
		cm."cCodename" as "cDatetype",
		st."cCodename" as "cStatus",
		ftp."cCodename" as "cFiletype",
		fd."nReviewid",
		rv."cCodename" as "cReview",
		count(distinct fls."nFMSdid") as t_shared,
		count(distinct flt."nFMTsid") as t_tasks,
		count(distinct flc."nFMCid") as t_contact,
		f."nUserid",
		 bd."nBundledetailid",
    	bd."cFilename",
    	bd."cTab",
    	bd."cExhibitno",
    	bd."cBundletag",
		fd."cIsNote",
		fd."bIsHighlighted",
		array_agg(distinct flc."nContactid") as "jContactids"
    FROM "FactMaster" f
    JOIN "UserMaster" um ON um."nUserid" = f."nUserid"
    JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"
	join bundlesource bd on bd."nBundledetailid" = f."nBundledetailid" 
		-- select * from "FMContact"
	left join "FMShared" fls on fls."nFSid" = f."nFSid" 
	left join "FMTasks" flt on flt."nFSid" = f."nFSid" 
	left join "FMContact" flc on flc."nFSid" = f."nFSid" 

	left join "Codemaster" cm on cm."nCodeid" = (fd."jDate"->>'type')::int
    left JOIN "Codemaster" tz ON tz."nCodeid" = fd."nTZid"
	left join "Codemaster" st on st."nCodeid" = fd."nStatus"
	left join "Codemaster" ftp on ftp."nCodeid" = fd."nFiletype"
	left join "Codemaster" rv on rv."nCodeid" = fd."nReviewid"
    left JOIN "RIssueMaster" cl ON cl."nIid" = fd."nColorid"
    WHERE jFSids @> to_jsonb(f."nFSid"::text) --f."nFSid" = ANY(jFSids)
	group by f."nFSid",f."dCreateDt",um."cFname" ,um."cLname",
        fd."nFiletype",fd."nTZid", tz."cCodename",
        "jLinktype",fd."cType",f."cFType",fd."jTexts",fd."jOT",
        fd."nColorid",cl."cColor",fd."jDate",fd."nStatus",
		cm."cCodename",st."cCodename",ftp."cCodename",fd."nReviewid",rv."cCodename",	f."nUserid",
		 bd."nBundledetailid",
    	bd."cFilename",
    	bd."cTab",
    	bd."cExhibitno",
    	bd."cBundletag",
		fd."cIsNote",
		fd."bIsHighlighted";

    RETURN ref;
END;
$function$;

CREATE OR REPLACE FUNCTION public.et_workspace_fact_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

DECLARE
    nMasterid uuid;
    cFacttype text;
    nCaseid uuid;
    nContactid uuid;
    nIssueid uuid;
    jFilter jsonb;

    filter_string text;
    sql_query TEXT;

    isAdmin boolean default false;
    nRoleid uuid;
    nTeamid uuid;

BEGIN

    ------------------------------------------------------------
    -- PARAMETERS
    ------------------------------------------------------------

    nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
    cFacttype := parameter ->>'cFacttype';
    nCaseid   := NULLIF(parameter ->>'nCaseid','')::uuid;
    nContactid:= NULLIF(parameter ->>'nContactid','')::uuid;
    nIssueid  := NULLIF(parameter ->>'nIssueid','')::uuid;

    jFilter := coalesce((parameter->>'jFilter')::jsonb,'[]'::jsonb);

    IF nCaseid IS NULL THEN
        RAISE EXCEPTION 'nCaseid is required';
    END IF;

    ------------------------------------------------------------
    -- ADMIN / TEAM
    ------------------------------------------------------------

    IF nMasterid IS NOT NULL THEN

        SELECT "isAdmin"
        INTO isAdmin
        FROM "UserMaster"
        WHERE "nUserid" = nMasterid;

        SELECT "nTeamid","nRoleid"
        INTO nTeamid,nRoleid
        FROM "TeamRelation"
        WHERE "nUserid" = nMasterid
          AND "nCaseid" = nCaseid
        LIMIT 1;

        IF (
            isAdmin = false
            AND (SELECT "nSrno" FROM "RoleMaster" WHERE "nRoleid" = nRoleid) = 1
        ) THEN
            isAdmin := true;
        END IF;

    END IF;

    filter_string :=
        (SELECT filter_whereclause_2(jFilter,'WRK'));

    ------------------------------------------------------------
    -- MAIN QUERY
    ------------------------------------------------------------

sql_query := '

WITH

issue_ct AS (
   SELECT "nFSid", count(*) as issues
   FROM "FMIssue"
   GROUP BY "nFSid"
),

contact_ct AS (
   SELECT "nFSid", count(*) as contacts
   FROM "FMContact"
   GROUP BY "nFSid"
),

task_ct AS (
   SELECT "nFSid", count(*) as tasks
   FROM "FMTasks"
   GROUP BY "nFSid"
),

link_ct AS (
   SELECT "nFSid", count(*) as links
   FROM "FMLinks"
   GROUP BY "nFSid"
),

shared_ct AS (
   SELECT "nFSid", count(*) as shared
   FROM "FMShared"
   GROUP BY "nFSid"
),

contact_email AS (
   SELECT 
       fc."nFSid",
       STRING_AGG(DISTINCT cm."cEmail", '', '') AS "cEmails"
   FROM "FMContact" fc
   JOIN "ContactMaster" cm 
        ON cm."nContactid" = fc."nContactid"
   GROUP BY fc."nFSid"
)

SELECT

    ----------------------------------------------------
    -- BASE FACT
    ----------------------------------------------------

    f."nFSid",
    f."nBundledetailid",
    f."dCreateDt",
    f."cFType",

    d."cFact",
    d."nTZid",
    d."jDate",
    d."nFiletype",
    d."nStatus",
    d."nReviewid",
    d."cType",
    d."jLinktype",
    d."jTexts",
    d."bIsHighlighted",
    d."jOT",

    ----------------------------------------------------
    -- CATEGORY SAFE CODEMASTER JOIN
    ----------------------------------------------------

    cs."cCodename" AS "cStatus",
    cf."cCodename" AS "cFiletype",
    cr."cCodename" AS "cReview",

    ----------------------------------------------------
    -- BUNDLE INFO
    ----------------------------------------------------

    bd."cFilename",
    bd."cTab",
    bd."cExhibitno",
    bd."cBundletag",

    ----------------------------------------------------
    -- COUNTERS
    ----------------------------------------------------

    COALESCE(issue_ct.issues,0)     AS "nIssues",
    COALESCE(contact_ct.contacts,0) AS "nContactcount",
    COALESCE(task_ct.tasks,0)       AS "nTaskcount",
    COALESCE(link_ct.links,0)       AS "nLinkscount",
    COALESCE(shared_ct.shared,0)    AS "nSUsers",

    ----------------------------------------------------
    -- EMAILS
    ----------------------------------------------------

    ce."cEmails",

    ----------------------------------------------------

    um."cFname" || '' '' || COALESCE(um."cLname", '''') AS "cCreateby"

FROM "FactMaster" f

JOIN "FactDetail" d
  ON d."nFSid" = f."nFSid"

--------------------------------------------------------
-- FIXED PART: CATEGORY SAFE JOINS
--------------------------------------------------------

LEFT JOIN "Codemaster" cs
  ON cs."nCodeid" = d."nStatus"
 AND cs."nCategoryid" = 24          -- STATUS CATEGORY

LEFT JOIN "Codemaster" cf
  ON cf."nCodeid" = d."nFiletype"
 AND cf."nCategoryid" = 23          -- FILETYPE CATEGORY

LEFT JOIN "Codemaster" cr
  ON cr."nCodeid" = d."nReviewid"
 AND cr."nCategoryid" = 27          -- REVIEW STATUS CATEGORY (2026-09-07)

--------------------------------------------------------

JOIN "UserMaster" um
  ON um."nUserid" = f."nUserid"

JOIN "bundlesource" bd
  ON bd."nBundledetailid" = f."nBundledetailid"

LEFT JOIN issue_ct   ON issue_ct."nFSid"   = f."nFSid"
LEFT JOIN contact_ct ON contact_ct."nFSid" = f."nFSid"
LEFT JOIN task_ct    ON task_ct."nFSid"    = f."nFSid"
LEFT JOIN link_ct    ON link_ct."nFSid"    = f."nFSid"
LEFT JOIN shared_ct  ON shared_ct."nFSid"  = f."nFSid"

LEFT JOIN contact_email ce 
    ON ce."nFSid" = f."nFSid"

WHERE
(
    f."nFSid" IS NOT NULL

    AND f."nCaseid" = ''' || nCaseid || '''::uuid

    AND (
        ' || quote_literal(cFacttype) || ' = ''ALL''
        OR f."cFType" = ' || quote_literal(cFacttype) || '
    )

    ----------------------------------------------------
    -- PERMISSION LOGIC
    ----------------------------------------------------

    AND (
        ' || CASE
             WHEN nMasterid IS NULL THEN 'true'
             ELSE '
             (
                f."nUserid" = ''' || nMasterid || '''::uuid

                OR EXISTS (
                    SELECT 1 FROM "FMShared" s
                    WHERE s."nFSid" = f."nFSid"
                      AND s."nUserid" = ''' || nMasterid || '''::uuid
                )

                OR (
                    ' || isAdmin || '::boolean = true
                    AND EXISTS (
                        SELECT 1
                        FROM "TeamRelation" tr
                        WHERE tr."nTeamid" = ''' || nTeamid || '''
                          AND tr."nUserid" = f."nUserid"
                          AND tr."nCaseid" = ''' || nCaseid || '''
                    )
                )
             )'
             END || '
    )

    ' || CASE WHEN filter_string IS NOT NULL
              THEN ' AND (' || filter_string || ') '
              ELSE '' END || '
)

ORDER BY
    coalesce((d."jDate"->>''date1''), f."dCreateDt"::text) DESC
';

OPEN ref FOR EXECUTE sql_query;

RETURN ref;

END;
$function$;

CREATE OR REPLACE FUNCTION public.et_navigate_factlist(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;
    nBundledetailid uuid;
    isAdmin boolean;
    cSortby text;
    cSorttype text;
    pageNumber int;
    offsetCount int;
    perPage int := 10;
    factids uuid[];
    sql_query TEXT;
	jFilter jsonb;
	filter_string text;
	cFType text;

BEGIN
    -- Extract parameters
    nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
    nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
    cSorttype := parameter->>'cSorttype';
    cSortby := parameter->>'cSortby';
    pageNumber := COALESCE((parameter->>'nPageNumber')::int, 1);
	jFilter := parameter ->>'jFilter';
    offsetCount := (pageNumber - 1) * perPage;
	cFType := NULLIF(parameter->>'cFType', '');

/*

select * from et_navigate_factlist ('{"nBundledetailid":555364,"cSorttype":"H","cSortby":"D","nPageNumber":1,"jFilter":"[{\"name\":\"CLAIM\",\"type\":\"V\",\"value\":[233,231,232]},{\"name\":\"CLAIM\",\"type\":\"C\",\"value\":\"AND\"},{\"name\":\"ISSUE\",\"type\":\"V\",\"value\":[1,2,3,4]},{\"name\":\"ISSUE\",\"type\":\"C\",\"value\":\"AND\"},{\"name\":\"TYPE\",\"type\":\"V\",\"value\":[5,6,8]},{\"name\":\"TYPE\",\"type\":\"C\",\"value\":\"AND\"},{\"name\":\"RELEVANCE\",\"type\":\"V\",\"value\":[13,15,16]},{\"name\":\"RELEVANCE\",\"type\":\"C\",\"value\":\"AND\"},{\"name\":\"IMPACT\",\"type\":\"V\",\"value\":[19,22,21]},{\"name\":\"IMPACT\",\"type\":\"C\",\"value\":\"OR\"},{\"name\":\"STATUS\",\"type\":\"V\",\"value\":[10,11]},{\"name\":\"STATUS\",\"type\":\"C\",\"value\":\"OR\"},{\"name\":\"CONTACT\",\"type\":\"V\",\"value\":[81,80,79]}]","nMasterid":2}','r1','r2','r3');fetch all in "r1";fetch all in "r2";fetch all in "r3";

*/

filter_string := (select filter_whereclause_2(jFilter,'FCH'));

  sql_query := 'select (array (SELECT distinct f."nFSid"
    FROM "FactMaster" f
    JOIN "FactDetail" d ON d."nFSid" = f."nFSid"
    LEFT JOIN "FMTasks" t ON t."nFSid" = f."nFSid"
        LEFT JOIN "TaskDetail" td ON td."nTaskid" = t."nTaskid"
    LEFT JOIN "FMIssue" i ON i."nFSid" = f."nFSid"
        LEFT JOIN "RIssueMaster" im ON im."nIid" = i."nIssueid"
    LEFT JOIN "FMShared" s ON s."nFSid" = f."nFSid"
    LEFT JOIN "FMContact" c ON c."nFSid" = f."nFSid"
    LEFT JOIN "FMLinks" l ON l."nFSid" = f."nFSid"
    WHERE f."nBundledetailid" = ''' || nBundledetailid || '''::uuid
    AND (f."nUserid" = ''' || nMasterid || '''::uuid OR s."nUserid" = ''' || nMasterid || '''::uuid)' || (CASE WHEN cFType IS NOT NULL THEN ' AND f."cFType" = ''' || cFType || '''' ELSE '' END) || (case when filter_string is not null then (' and (' || filter_string || ') ') else '' end) || '))';

    -- Get factids
		  EXECUTE sql_query INTO factids;
    --factids := EXECUTE sql_query;
	
	/*(array (SELECT distinct f."nFSid"
    FROM "FactMaster" f
    LEFT JOIN "FMShared" fs ON fs."nFSid" = f."nFSid"
    WHERE f."nBundledetailid" = nBundledetailid
      AND (f."nUserid" = nMasterid OR fs."nUserid" = nMasterid)
    GROUP BY f."nFSid", f."dCreateDt"
   -- ORDER BY f."dCreateDt" DESC
    --LIMIT perPage
    --OFFSET offsetCount 
));

select * from "FMTasks"
select * from "FMContact"
select * from "FMShared"

*/

    -- Open ref1
OPEN ref1 FOR 
    SELECT f."nFSid", f."dCreateDt", 
           um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
		   um."nUserid",
           fd."nFiletype", fd."nTZid", tz."cCodename" AS "cTimezone", 
           fd."jLinktype", fd."cType", f."cFType",
           fd."jTexts", fd."jOT", fd."nColorid", fd."nStatus", fd."nReviewid", 
           cl."cColor" AS "cColor", fd."jDate", 
           cm."cCodename" as "cDatetype",
           st."cCodename" as "cStatus", 
           ftp."cCodename" as "cFiletype",
           rv."cCodename" as "cReview",
	count(s."nFMSdid") as "t_shared",
	count(ft."nFMTsid") as "t_tasks",
	count(fc."nFMCid") as "t_contact"
    FROM "FactMaster" f
    JOIN "UserMaster" um ON um."nUserid" = f."nUserid"
    JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"
	left join "FMShared" s on s."nFSid" = f."nFSid"
	left join "FMTasks" ft on ft."nFSid" = f."nFSid"
	left join "FMContact" fc on fc."nFSid" = f."nFSid"
	
    LEFT JOIN "Codemaster" cm ON cm."nCodeid" = (fd."jDate"->>'type')::int
    LEFT JOIN "Codemaster" tz ON tz."nCodeid" = fd."nTZid"
    LEFT JOIN "Codemaster" st ON st."nCodeid" = fd."nStatus"
    LEFT JOIN "Codemaster" ftp ON ftp."nCodeid" = fd."nFiletype"
    LEFT JOIN "Codemaster" rv ON rv."nCodeid" = fd."nReviewid"
    JOIN "RIssueMaster" cl ON cl."nIid" = fd."nColorid"
    WHERE f."nFSid" = ANY(factids)
	group by f."nFSid", f."dCreateDt", 
           um."cFname" ,um."cLname",um."nUserid",
           fd."nFiletype", fd."nTZid", tz."cCodename", 
           fd."jLinktype", fd."cType", f."cFType",
           fd."jTexts", fd."jOT", fd."nColorid", fd."nStatus", fd."nReviewid", 
           cl."cColor", fd."jDate",cm."cCodename",st."cCodename", ftp."cCodename", rv."cCodename"
	ORDER BY 
				 -- f."dCreateDt" desc
		CASE WHEN cSortby = 'asc' THEN f."dCreateDt" END ASC,
		CASE WHEN cSortby = 'desc' THEN f."dCreateDt" END DESC,
		f."dCreateDt" DESC; 

    -- Open ref2
    OPEN ref2 FOR 	
    SELECT jsonb_agg(f."nFSid") AS "jFSids", 
           fi."nIssueid", fi."nImpactid", fi."nRelevanceid",
           im."nICid", ic."cCategory", im."cIName", im."cColor",
           rl."cCodename" AS "cRelevance",
           impct."cCodename" AS "cImpact"
    FROM "FactMaster" f
    JOIN "FMIssue" fi ON fi."nFSid" = f."nFSid"
    JOIN "RIssueMaster" im ON im."nIid" = fi."nIssueid"
    JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"
    LEFT JOIN "Codemaster" rl ON rl."nCodeid" = fi."nRelevanceid" 
    LEFT JOIN "Codemaster" impct ON impct."nCodeid" = fi."nImpactid" 
    WHERE f."nFSid" = ANY(factids)
    GROUP BY fi."nIssueid", fi."nImpactid", fi."nRelevanceid", 
             im."nICid", ic."cCategory", im."cIName", im."cColor",
             rl."cCodename", impct."cCodename";

    -- Open ref3
    OPEN ref3 FOR 	
    SELECT fl."nFSid",fl."nFMLid", fl."nBundledetailid", 
           bd."cFilename" AS "cName", bd."cExhibitno", bd."cTab", 
           fl."jLinktype", bd."cPage",b."cBundletag"
    FROM "FMLinks" fl
    JOIN "BundleDetail" bd ON bd."nBundledetailid" = fl."nBundledetailid"
	left JOIN "BundleMaster" b ON b."nBundleid" = bd."nBundleid" 
    WHERE fl."nFSid" = ANY(factids);

    RETURN NEXT ref1;
    RETURN NEXT ref2;
    RETURN NEXT ref3;
END;
$function$;

CREATE OR REPLACE FUNCTION public.et_export_fact_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid;nFSid uuid;
fact_detail jsonb;issue_ls jsonb;task_ls jsonb;contact_ls jsonb;
filelist jsonb;user_list jsonb;bundle_detail jsonb;
nBundledetailid uuid;
BEGIN
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nFSid := NULLIF(parameter ->>'nFSid','')::uuid;
-- select * from et_export_fact_detail ('{"nFSid":1,"nMasterid":2}','refcursor'); FETCH All in "refcursor";

-- select * From "FactMaster"
-- select * From "IssueMaster"
-- select * From "TaskMaster"
-- select * From "BundleDetail"

nBundledetailid := (select "nBundledetailid" from "FactMaster" where "nFSid" = nFSid);

select jsonb_agg(t) into bundle_detail from (
select "nBundledetailid","nBundleid","cTab","cExhibitno","cFilename","cPath","cPage"
from "BundleDetail" where "nBundledetailid" = nBundledetailid
)t;
-- select * from "FactDetail"
select jsonb_agg(t) into fact_detail from (
select f."nFSid",fd."nTZid",b."cPage",fd."cFact",fd."jDate",c."cCodename" as "cTimezone",
ft."cCodename" as "cFiletype" ,s."cCodename" as "cStatus",rv."cCodename" as "cReview",fd."nReviewid",fd."jTexts",fd."nStatus",
fd."nFiletype",fd."cType",fd."jLinktype","cTooltype",f."nBundledetailid",bm."cBundletag"
From "FactMaster" f
join "FactDetail" fd on fd."nFSid" = f."nFSid"
join "BundleDetail" b on b."nBundledetailid" = f."nBundledetailid"
left join "BundleMaster" bm on bm."nBundleid" = b."nBundleid"
left join "Codemaster" c on c."nCodeid" = fd."nTZid"
left join "Codemaster" ft on ft."nCodeid" = fd."nFiletype"
left join "Codemaster" s on s."nCodeid" = fd."nStatus"
left join "Codemaster" rv on rv."nCodeid" = fd."nReviewid"
where f."nFSid" = nFSid  --and f."nUserid" =  
)t;
-- select * from "RIssueMaster"
select jsonb_agg(t) into issue_ls from (
	select ic."nICid",ic."cCategory",jsonb_agg(distinct im) as "sublist"
	from "IssueCategory" ic
	join (
	select i."nIssueid",i."nImpactid",i."nRelevanceid",im."nICid",im."cIName" "cIssue",im."cColor" "cClr",r."cCodename" as "cRelevance",
	imp."cCodename" as "cImpact"--,imp."cImg" as "cImpimg"
	from "FactMaster" f 
	join "FMIssue" i on i."nFSid" = f."nFSid"
	join "RIssueMaster" im on im."nIid" = i."nIssueid"
	left join "Codemaster" r on r."nCodeid" = i."nRelevanceid" 
	left join "Codemaster" imp on imp."nCodeid" = i."nImpactid"
	where f."nFSid" = nFSid 
	) im on im."nICid" = ic."nICid"
	group by ic."nICid",ic."cCategory" 
)t;

-- select * From "tasks"

-- select * From "IssueMaster"
/*
select jsonb_agg(t) into task_ls from (
	select t."nTaskid",tm."cSubject",tm."cDesc",tm."jUsers",tm."jEmailnotify",tm."nClaimid",tm."nPriority",
	tm."nProgress",tm."jTimeline",tm."jReminder",c."cPriority",c."cImg",
	tm."teamlist",tm."cClr",tm."cImpimg",tm."cImpact",tm."cRelevance",tm."cIssue"
	from "FactMaster" f
	join "FMTasks" t on t."nFSid" = f."nFSid"
	join tasks tm on tm."nTaskid" = t."nTaskid"
	left join "PriorityMaster" c on c."nPriorityid" = tm."nPriority"
	where f."nFSid" = nFSid --and tm."dDelDt" is null
)t;

select jsonb_agg(t) into contact_ls from (
	select cm."nContactid",cm."nCaseid",cm."cProfile",cm."cFname",cm."cLname",cm."cAlias",cm."cLinkedin",cm."cEmail",
	cm."cCountrycode",cm."cMobile",cm."nTZid",cm."nRoleid",cm."nCompanyid",cm."cNote",tz."cCodename" as "cTimezone",
	cr."cRole",cc."cCompany"
	from "FactSheet" f,jsonb_populate_recordset(null::record,"jContact") as c("nContactid" int) 
	join "ContactMaster" cm on cm."nContactid" = c."nContactid"
	left join "Codemaster" tz on tz."nCodeid" = cm."nTZid" 
	left join "ContactRole" cr on cr."nCRoleid" = cm."nRoleid"
	left join "ContactCompany" cc on cc."nCompanyid" = cm."nCompanyid"
	where f."nFSid" = nFSid and cm."dDelDt" is null
)t;

*/
-- select * From "UserMaster"
-- select  * from "FactSheet"

open ref for 
select fact_detail,issue_ls,task_ls,contact_ls,filelist,user_list,bundle_detail
;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$;

CREATE OR REPLACE FUNCTION public.filter_columnnames(filter_name text, ctype text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    column_name TEXT;
BEGIN
    -- Map filter names to actual column names
    column_name :=
	case when  (ctype = 'FCH' or ctype = 'FCO') then 
	(CASE filter_name
        WHEN 'CLAIM' THEN 'im."nICid"'
        WHEN 'ISSUE' THEN 'i."nIssueid"'
        WHEN 'TYPE' THEN 'd."nFiletype"'
        WHEN 'RELEVANCE' THEN 'i."nRelevanceid"'
        WHEN 'IMPACT' THEN 'i."nImpactid"'
        WHEN 'STATUS' THEN 'd."nStatus"'
        WHEN 'REVIEW' THEN 'd."nReviewid"'
        WHEN 'CONTACT' THEN 'c."nContactid"'
		WHEN 'DATE' THEN 'f."dCreateDt"'
        -- Add more mappings as needed
        ELSE NULL
    END)
	when ctype = 'DL' then
	(CASE filter_name
        WHEN 'DOCTITLE' THEN 'l."nBundledetailid"'
        WHEN 'EXHIBITNO' THEN 'l."nBundledetailid"'
        WHEN 'REF' THEN 'l."nBundledetailid"'
        WHEN 'DESTINATION' THEN 'l."nDMLids"'
        WHEN 'INCOMMING' THEN 'l."nBundledetailid"'
        WHEN 'OUTGOING' THEN 'l."nBundledetailid"'
		WHEN 'DATE' THEN 'm."dCreateDt"'
        -- Add more mappings as needed
        ELSE NULL
    END)
	when ctype = 'WL' then
	
	(CASE filter_name
      	WHEN 'CLAIM' THEN 'im."nICid"'
        WHEN 'ISSUE' THEN 'i."nIssueid"'
        WHEN 'TYPE' THEN 'd."nFiletype"'
        WHEN 'RELEVANCE' THEN 'i."nRelevanceid"'
        WHEN 'IMPACT' THEN 'i."nImpactid"'
        WHEN 'STATUS' THEN 'd."nStatus"'
        WHEN 'REVIEW' THEN 'd."nReviewid"'
        WHEN 'CONTACT' THEN 'c."nContactid"'
        ELSE NULL
    END)
	when ctype = 'WRK' then 
	(CASE filter_name
        WHEN 'CLAIM' THEN 'im."nICid"'
        WHEN 'ISSUE' THEN 'fi."nIssueid"'
        WHEN 'TYPE' THEN 'd."nFiletype"'
        WHEN 'RELEVANCE' THEN 'fi."nRelevanceid"'
        WHEN 'IMPACT' THEN 'fi."nImpactid"'
        WHEN 'STATUS' THEN 'd."nStatus"'
        WHEN 'REVIEW' THEN 'd."nReviewid"'
        WHEN 'CONTACT' THEN 'fc."nContactid"'
		WHEN 'DATE' THEN 'f."dCreateDt"'
        ELSE NULL
    END)
	
	
	when ctype = 'TSK' then 
	(CASE filter_name
        WHEN 'CLAIM' THEN 'im."nICid"'
        WHEN 'ISSUE' THEN 'fi."nIssueid"'
        WHEN 'TYPE' THEN 'd."nFiletype"'
        WHEN 'RELEVANCE' THEN 'fi."nRelevanceid"'
        WHEN 'IMPACT' THEN 'fi."nImpactid"'
        WHEN 'STATUS' THEN 'd."nStatus"'
        WHEN 'REVIEW' THEN 'd."nReviewid"'
        WHEN 'CONTACT' THEN 'fc."nContactid"'
        WHEN 'ASSIGNEE' THEN 'ts."nUserid"'
        WHEN 'CREATOR' THEN 'tm."nUserid"'
        ELSE NULL
    END)

	when ctype = 'FILEC' then
        (CASE filter_name
        WHEN 'CLAIM' THEN 'im."nICid"'
        WHEN 'ISSUE' THEN 'fi."nIssueid"'
        WHEN 'TYPE' THEN 'd."nFiletype"'
        WHEN 'RELEVANCE' THEN 'fi."nRelevanceid"'
        WHEN 'IMPACT' THEN 'fi."nImpactid"'
        WHEN 'STATUS' THEN 'd."nStatus"'
        WHEN 'REVIEW' THEN 'd."nReviewid"'
        WHEN 'CONTACT' THEN 'bc."nContactid"'
        ELSE NULL
    END)

	when ctype = 'NWL' then
        (CASE filter_name
        WHEN 'TITLE' THEN 'wd."nWebid"'
        WHEN 'DESCRIPTION' THEN 'wd."nWebid"'
        WHEN 'URL' THEN 'wd."nWebid"'
		WHEN 'DATE' THEN 'w."dCreateDt"'
        ELSE NULL
    END)
	
	when ctype = 'FILES' then 

	(CASE filter_name
        WHEN 'CLAIM' THEN 'im."nICid"'
        WHEN 'ISSUE' THEN 'fi."nIssueid"'
        WHEN 'TYPE' THEN 'd."nFiletype"'
        WHEN 'RELEVANCE' THEN 'fi."nRelevanceid"'
        WHEN 'IMPACT' THEN 'fi."nImpactid"'
        WHEN 'STATUS' THEN 'd."nStatus"'
        WHEN 'REVIEW' THEN 'd."nReviewid"'
        WHEN 'CONTACT' THEN 'fc."nContactid"'
        WHEN 'ASSIGNEE' THEN 'ts."nUserid"'
        WHEN 'CREATOR' THEN 'tm."nUserid"'
        WHEN 'DATE' THEN 'cr.start_date'
        ELSE NULL
    END)
	
	when ctype = 'FILEC' then 

	(CASE filter_name
        WHEN 'CLAIM' THEN 'im."nICid"'
        WHEN 'ISSUE' THEN 'fi."nIssueid"'
        WHEN 'TYPE' THEN 'd."nFiletype"'
        WHEN 'RELEVANCE' THEN 'fi."nRelevanceid"'
        WHEN 'IMPACT' THEN 'fi."nImpactid"'
        WHEN 'STATUS' THEN 'd."nStatus"'
        WHEN 'REVIEW' THEN 'd."nReviewid"'
        WHEN 'CONTACT' THEN 'bc."nContactid"'
        ELSE NULL
    END)
	
	else 
	'NOCLOUMN' 
	end
	
	;
    IF column_name IS NULL THEN
        RAISE NOTICE  'Unknown filter name: %', filter_name;
		RETURN NULL;
    END IF;
    RETURN column_name;
END;
$function$;
