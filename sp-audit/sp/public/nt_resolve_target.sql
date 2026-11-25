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
$fn$
