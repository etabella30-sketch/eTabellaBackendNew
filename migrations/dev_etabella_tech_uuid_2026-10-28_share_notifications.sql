DO $$ BEGIN IF current_database() <> 'etabella_tech_uuid' THEN RAISE EXCEPTION 'dev only'; END IF; END $$;

-- R3-003 + R4-004 (RT QA 2026-10-28, Phase B item B3): share notifications.
--
-- realtime.et_doc_insert: the jNotify list never names the DocLink's creator
-- (`s."nUserid" <> nMasterid`), so a self-share row or a client that lists the
-- actor cannot raise a "shared with you" notice to its own author; a private
-- DocLink (jUsers []) still yields jNotify '[]'. The DS copy names the sharer
-- and the Mark's page:line (the inbox composes its own text from verified
-- metadata; this copy is for the push and the socket event).
--
-- public.nt_resolve_target: an annotation target now carries the Mark's place
-- ('page', 'line': the transferred nTPage/nTLine once the session is published,
-- the live nPage/nLine before) and the recipient's own 'level' on it ('owner',
-- or FMShared/DMShared's highest right: share > edit > comment > read), so the
-- coreapi inbox can say "Fact · p12:4 · by <sharer> · Can edit" without trusting
-- stored text. A Mark on a LIVE session (live status, started within the shared
-- 18 h window of apps/realtime-server session-access-gate.ts LIVE_SESSIONS_SQL)
-- resolves to the CASE instead of the annotation: the live feed is entered only
-- from the Home Realtime button (R3-001), so no notification may open it.
-- Mirrors: sp-audit/sp/realtime/et_doc_insert.sql, sp-audit/sp/public/nt_resolve_target.sql.
-- Dev only; prod stays pending (assets/sql-migrations/2026-10-08_central_notifications.up.sql
-- is the prod source of nt_resolve_target and is left as it was).

BEGIN;

CREATE OR REPLACE FUNCTION realtime.et_doc_insert(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nDocid uuid;
nBundledetailid uuid;
nMasterid uuid;
cDFrom text;

cType text;jLinktype jsonb;jAn jsonb;
jTeams jsonb;
jDocLink jsonb;rec record;nDMLids uuid;jOT jsonb;nCaseid uuid;jNotify jsonb;
nPMid int;
nSesid uuid;
jCordinates jsonb;
jTexts jsonb;
nPage int; nLine int;

BEGIN
nSesid := NULLIF(parameter->>'nSesid','')::uuid;
nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
cType := parameter->>'cType';
jLinktype := parameter->>'jLT';
jAn := parameter->>'jAn';
jTeams:= parameter->>'jUsers';
jDocLink := parameter->>'jDl';
jOT := parameter ->>'jOT';
nCaseid := NULLIF(parameter->>'nCaseid','')::uuid;
cDFrom := parameter->>'cDFrom';
jTexts := parameter->>'jT';
jCordinates := parameter->>'jCordinates';
nPage := parameter->>'nPage';
nLine := parameter->>'nLine';

	-- select * from "DMLinks"

/*

select * from public.et_doc_insert ('{"nBDid":"51c4f72f-a203-46ec-b0a5-d9bd386d10c1","jLT":"{\"type\":\"H\",\"start\":1,\"end\":26,\"pages\":[3]}","jAn":"[{\"isTemp\":true,\"id\":null,\"linktype\":\"F\",\"type\":\"strikeout1\",\"color\":\"#0066FF\",\"uuid\":\"6fc27cdc-1807-4fe4-9ab4-1ea041910a02\",\"page\":3,\"rects\":[{\"x\":174.22247314453125,\"y\":188.58984375,\"width\":57.537689208984375,\"height\":12}]}]","jDl":"[[\"a6fb9b76-a97d-420b-936d-f303fd60fe48\",{\"type\":\"F\",\"start\":1,\"end\":9,\"pages\":[]},[],[]]]","jOT":"[\"Abu Dhabi \"]","jUsers":"[\"4337e269-a052-4e83-9a09-8d889e9c97df\"]","cType":"S","nMasterid":"c67fea37-4c67-4ea4-89eb-f9d0441142a0"}','r1');fetch all in "r1";

*/

-- nCaseid := (select s."nCaseid" from "SectionMaster" s join "BundleDetail" d on d."nSectionid" = s."nSectionid" where d."nBundledetailid" = nBundledetailid limit 1);

nPMid := (select "nPMid"  from "PermissionModule" where "cType" = 'NF' );

	insert into "DocMaster" ("nSesid","nUserid","dCreateDt","nCaseid", "cDFrom","nBundledetailid")
	values(nSesid,nMasterid,now(),nCaseid, cDFrom,nBundledetailid)
	RETURNING "nDocid" INTO nDocid;

	insert into "DocDetail" ("nDocid","cType","jLinktype","jOText", "jCordinates", "jTexts",  "nPage","nLine" )
	values(nDocid,cType,jLinktype,jOT, jCordinates,jTexts, nPage, nLine);
	if(cDFrom ='I') then
		insert into "Annotations"("uuid","type","rects","lines","width","page","nDocid","dCreateDt")
		select "uuid","type",coalesce("rects",'[]'::jsonb),coalesce("lines",'[]'::jsonb),"width","page",nDocid,now()
			from jsonb_to_recordset(jAn) as ("uuid" text,"type" text,"rects" jsonb,"lines" jsonb,width int,"colorid" uuid,"page" int);
	end if;

        -- Example conditional update
     for rec in select NULLIF(i->>0,'')::uuid "nBDid", (i->>1)::jsonb "jLinktype",(i->>2)::jsonb annot,(i->>3)::jsonb "jTexts"   FROM jsonb_array_elements(jDocLink) i
	  LOOP
	 	 INSERT INTO "DMLinks" ("nDocid", "nBundledetailid", "jLinktype","jOTexts")
		 SELECT nDocid, rec."nBDid", rec."jLinktype",coalesce(rec."jTexts",'[]'::jsonb)
		 RETURNING "nDMLids" INTO nDMLids;

	-- select * from "Annotations"
	-- INSERT INTO "Annotations" (
	--     "uuid", "type", "rects", "lines", "width","colorid", "page", "nDMLinkid", "dCreateDt"
	-- )
	-- SELECT  "uuid", "type", COALESCE("rects", '[]'::jsonb), COALESCE("lines", '[]'::jsonb), "width","colorid", "page", nDMLids, NOW()
	-- FROM jsonb_to_recordset(rec.annot) AS ( "uuid" text, "type" text, "rects" jsonb, "lines" jsonb, "width" int, "colorid" uuid, "page" int
	-- );

	end loop;

	insert into "DMShared" (
	"nDocid",
	"nUserid",
	"bCanEdit",
	"bCanCopy",
    "bCanReshare",
    "bCanComment"
	)
	SELECT
	nDocid,
	(team->>'nUserid')::uuid,
	(team->>'bCanEdit')::boolean,
	(team->>'bCanCopy')::boolean,
	(team->>'bCanReshare')::boolean,
	(team->>'bCanComment')::boolean
	FROM jsonb_array_elements(jTeams) AS team;

	-- R3-003 (2026-10-28): the DS notice names the sharer and the Mark's place; the creator is never told about
	-- his own DocLink, whatever the share list said (a private DocLink, jUsers [], still answers jNotify '[]').
	with tbl as (select u."nUserid",'DocLink shared with you' as "cTitle",
		trim(coalesce(cr."cFname",'') || ' ' || coalesce(cr."cLname",''))  || ' shared a DocLink with you' || coalesce(' (p' || nPage::text || ':' || nLine::text || ')','') as "cMsg",
		s."nDocid",u."cToken",'DS' as "cType",nCaseid as "nCaseid"
		from "UserMaster" u
		join "DMShared" s on s."nUserid" = u."nUserid"
		join "DocMaster" fm on fm."nDocid" = s."nDocid"
		join "UserMaster" cr on cr."nUserid" = fm."nUserid"
		left join "UserPermission" up on up."nUserid" = u."nUserid"  and  up."nCaseid" = nCaseid and up."nPMid" = nPMid
		where s."nDocid" = nDocid -- and nullif(u."cToken",'') is not null
		and s."nUserid" <> nMasterid
		and coalesce(up."nUPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid

		)	select jsonb_agg(t) into jNotify from tbl t;

	open ref for select 1 msg,nDocid "nDocid",coalesce(jNotify,'[]'::jsonb) as "jNotify";
    RETURN ref;
END;
$function$;

CREATE OR REPLACE FUNCTION public.nt_resolve_target(actor uuid, target jsonb, expected_case uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $fn$
DECLARE typ text:=target->>'type'; actual_case uuid; declared_case uuid:=public.nt_uuid(target->>'caseId');
  doc_id uuid:=public.nt_uuid(target->>'documentId'); annotation_id uuid:=public.nt_uuid(target->>'annotationId');
  session_id uuid; source_type text:=upper(coalesce(target->>'sourceType','F'));
  folder_id uuid:=public.nt_uuid(target->>'folderId'); section_id uuid:=public.nt_uuid(target->>'sectionId');
  upload_id uuid:=public.nt_uuid(target->>'uploadId'); task_id uuid:=public.nt_uuid(target->>'taskId');
  presentation_id uuid:=public.nt_uuid(target->>'presentationId'); result jsonb; allowed boolean:=false; key text;
  -- R4-004 (2026-10-28): the Mark's place and the actor's own level on it, resolved live.
  mark_page int; mark_line int; mark_level text;
BEGIN
  IF actor IS NULL OR jsonb_typeof(target) IS DISTINCT FROM 'object'
    OR NOT EXISTS (SELECT 1 FROM public."UserMaster" u WHERE u."nUserid"=actor) THEN RETURN NULL; END IF;
  IF (target ? 'caseId' AND declared_case IS NULL) THEN RETURN NULL; END IF;
  FOREACH key IN ARRAY ARRAY['documentId','annotationId','sessionId','folderId','sectionId','uploadId','taskId','presentationId'] LOOP
    IF target->>key IS NOT NULL AND public.nt_uuid(target->>key) IS NULL THEN RETURN NULL; END IF;
  END LOOP;
  IF typ='document' AND doc_id IS NULL OR typ='annotation' AND annotation_id IS NULL THEN RETURN NULL; END IF;
  IF typ='information' THEN
    IF expected_case IS NULL AND declared_case IS NULL THEN RETURN jsonb_build_object('type','information'); END IF;
    typ:='case';
  END IF;
  IF typ='document' THEN
    SELECT s."nCaseid" INTO actual_case FROM public."BundleDetail" d JOIN public."SectionMaster" s ON s."nSectionid"=d."nSectionid" WHERE d."nBundledetailid"=doc_id;
    IF NOT public.nt_file_visible(actor,doc_id) THEN RETURN NULL; END IF;
    SELECT jsonb_strip_nulls(jsonb_build_object('type','document','caseId',actual_case,'documentId',doc_id,
      'tab',d."cTab",'name',d."cFilename",'exhibit',d."cExhibitno")) INTO result FROM public."BundleDetail" d WHERE d."nBundledetailid"=doc_id;
  ELSIF typ='annotation' THEN
    IF source_type IN ('F','QF') THEN
      SELECT f."nCaseid",f."nBundledetailid",f."nSesid",(f."nUserid"=actor OR EXISTS (
        SELECT 1 FROM public."FMShared" sh WHERE sh."nFSid"=f."nFSid" AND sh."nUserid"=actor)
        OR EXISTS (SELECT 1 FROM public."FMTasks" ft JOIN public."TaskMaster" tm ON tm."nTaskid"=ft."nTaskid"
          JOIN public."TaskShared" ts ON ts."nTaskid"=tm."nTaskid"
          JOIN public."TeamRelation" tr ON tr."nCaseid"=tm."nCaseid" AND tr."nUserid"=ts."nUserid" AND tr."cStatus"='A'
          WHERE ft."nFSid"=f."nFSid" AND tm."nCaseid"=f."nCaseid" AND ts."nUserid"=actor)),
        COALESCE(d."nTPage",d."nPage"),COALESCE(d."nTLine",d."nLine"),
        CASE WHEN f."nUserid"=actor THEN 'owner' ELSE (SELECT CASE WHEN sh."bCanReshare" THEN 'share' WHEN sh."bCanEdit" THEN 'edit'
          WHEN sh."bCanComment" THEN 'comment' ELSE 'read' END FROM public."FMShared" sh WHERE sh."nFSid"=f."nFSid" AND sh."nUserid"=actor LIMIT 1) END
        INTO actual_case,doc_id,session_id,allowed,mark_page,mark_line,mark_level
        FROM public."FactMaster" f LEFT JOIN public."FactDetail" d ON d."nFSid"=f."nFSid" WHERE f."nFSid"=annotation_id;
    ELSIF source_type='D' THEN
      SELECT d."nCaseid",d."nBundledetailid",d."nSesid",(d."nUserid"=actor OR EXISTS (
        SELECT 1 FROM public."DMShared" sh WHERE sh."nDocid"=d."nDocid" AND sh."nUserid"=actor)),
        COALESCE(dd."nTPage",dd."nPage"),COALESCE(dd."nTLine",dd."nLine"),
        CASE WHEN d."nUserid"=actor THEN 'owner' ELSE (SELECT CASE WHEN sh."bCanReshare" THEN 'share' WHEN sh."bCanEdit" THEN 'edit'
          WHEN sh."bCanComment" THEN 'comment' ELSE 'read' END FROM public."DMShared" sh WHERE sh."nDocid"=d."nDocid" AND sh."nUserid"=actor LIMIT 1) END
        INTO actual_case,doc_id,session_id,allowed,mark_page,mark_line,mark_level
        FROM public."DocMaster" d LEFT JOIN public."DocDetail" dd ON dd."nDocid"=d."nDocid" WHERE d."nDocid"=annotation_id;
    ELSIF source_type='W' THEN
      SELECT w."nCaseid",w."nBundledetailid",NULL::uuid,(w."nUserid"=actor OR EXISTS (
        SELECT 1 FROM public."WMShared" sh WHERE sh."nWebid"=w."nWebid" AND sh."nUserid"=actor))
        INTO actual_case,doc_id,session_id,allowed FROM public."WebMaster" w WHERE w."nWebid"=annotation_id;
    ELSE RETURN NULL; END IF;
    IF NOT coalesce(allowed,false) THEN RETURN NULL; END IF;
    IF doc_id IS NOT NULL AND NOT public.nt_file_visible(actor,doc_id) THEN RETURN NULL; END IF;
    IF session_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public."RSessionMaster" r WHERE r."nSesid"=session_id
      AND r."nCaseid"=actual_case AND r."dDelDt" IS NULL AND public.rt_entry_eligible(r."nSesid",actor)) THEN RETURN NULL; END IF;
    -- R3-001 / R4-004: a Mark on a LIVE session (live status, started within the 18 h window of
    -- realtime-server's LIVE_SESSIONS_SQL) opens nowhere but the RT page, entered from the Home
    -- Realtime button: the notice resolves to the case, never to the annotation.
    IF session_id IS NOT NULL AND EXISTS (SELECT 1 FROM public."RSessionMaster" r WHERE r."nSesid"=session_id
      AND r."cStatus" IN ('R','A','L')
      AND (r."dStartDt" IS NULL OR (r."dStartDt"::timestamp AT TIME ZONE COALESCE(
            (SELECT z.name FROM pg_timezone_names z WHERE z.name=r."cTimezone" LIMIT 1),current_setting('TimeZone')))
          > now() - make_interval(hours => 18))) THEN
      result:=jsonb_build_object('type','case','caseId',actual_case);
    ELSE
      result:=jsonb_strip_nulls(jsonb_build_object('type','annotation','caseId',actual_case,'annotationId',annotation_id,
        'sourceType',source_type,'documentId',doc_id,'sessionId',session_id,'page',mark_page,'line',mark_line,'level',mark_level));
    END IF;
  ELSIF typ='evidence' THEN
    IF upload_id IS NOT NULL THEN
      SELECT u."nCaseid",u."nSectionid",u."nBundleid" INTO actual_case,section_id,folder_id FROM public."UploadMaster" u WHERE u."nUPid"=upload_id;
      -- A queued/failed batch is not a successful upload notice. Check the actual stored documents.
      IF NOT EXISTS (SELECT 1 FROM public."UploadDetail" ud WHERE ud."nUPid"=upload_id AND public.nt_file_visible(actor,ud."nBundledetailid")) THEN RETURN NULL; END IF;
      IF NOT public.nt_folder_visible(actor,section_id,folder_id) THEN section_id:=NULL; folder_id:=NULL; END IF;
    ELSE
      IF target ? 'folderId' AND folder_id IS NULL OR target ? 'sectionId' AND section_id IS NULL THEN RETURN NULL; END IF;
      IF folder_id IS NOT NULL THEN SELECT b."nSectionid" INTO section_id FROM public."BundleMaster" b WHERE b."nBundleid"=folder_id; END IF;
      SELECT s."nCaseid" INTO actual_case FROM public."SectionMaster" s WHERE s."nSectionid"=section_id;
      IF section_id IS NOT NULL THEN
        IF NOT public.nt_folder_visible(actor,section_id,folder_id) THEN RETURN NULL; END IF;
      ELSE actual_case:=coalesce(declared_case,expected_case); END IF;
    END IF;
    result:=jsonb_strip_nulls(jsonb_build_object('type','evidence','caseId',actual_case,'folderId',folder_id,'sectionId',section_id,'uploadId',upload_id));
  ELSIF typ='workspace' THEN
    IF task_id IS NOT NULL THEN
      SELECT t."nCaseid",(t."nUserid"=actor OR EXISTS (SELECT 1 FROM public."TaskShared" sh WHERE sh."nTaskid"=t."nTaskid" AND sh."nUserid"=actor))
        INTO actual_case,allowed FROM public."TaskMaster" t WHERE t."nTaskid"=task_id;
      IF NOT coalesce(allowed,false) THEN RETURN NULL; END IF;
    ELSE actual_case:=coalesce(declared_case,expected_case); END IF;
    result:=jsonb_strip_nulls(jsonb_build_object('type','workspace','caseId',actual_case,'taskId',task_id));
  ELSIF typ='presentation' THEN
    IF presentation_id IS NULL THEN RETURN NULL; END IF;
    SELECT p."nCaseid",(p."nCreateid"=actor OR EXISTS (SELECT 1 FROM present."PMUser" u WHERE u."nPresentid"=p."nPresentid" AND u."nUserid"=actor AND u."cStatus" IS DISTINCT FROM 'I'))
      INTO actual_case,allowed FROM present."PresentationMaster" p WHERE p."nPresentid"=presentation_id;
    IF NOT coalesce(allowed,false) THEN RETURN NULL; END IF;
    result:=jsonb_build_object('type','presentation','caseId',actual_case,'presentationId',presentation_id);
  ELSIF typ='case' THEN
    actual_case:=coalesce(declared_case,expected_case);
    result:=jsonb_build_object('type','case','caseId',actual_case);
  ELSE RETURN NULL; END IF;
  IF actual_case IS NULL OR NOT public.nt_case_visible(actor,actual_case)
    OR (expected_case IS NOT NULL AND expected_case<>actual_case)
    OR (declared_case IS NOT NULL AND declared_case<>actual_case) THEN RETURN NULL; END IF;
  RETURN result;
END;
$fn$;

COMMIT;
