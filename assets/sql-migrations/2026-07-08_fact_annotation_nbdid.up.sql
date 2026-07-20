-- PDF Fact/QFact highlights (cFFrom 'I'): et_fact_insert_detail stored the jAn
-- geometry in "Annotations" but left nBDid EMPTY, so /common/getannotations
-- (document-scoped by nBDid) never returned them → the highlight never painted in
-- the reader (rail card showed, PDF stayed blank). Set nBDid on the insert
-- (mirrors the DocLink path) + backfill the orphaned rows. Realtime schema.

CREATE OR REPLACE FUNCTION realtime.et_fact_insert_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFSid uuid;jText jsonb;nFt integer;nSt integer;
jDate jsonb;cType text;nTZid integer;jOT jsonb;
jAn jsonb;nColorid uuid;jLinktype jsonb;cIsNote text;
bIsHighlighted boolean;
jCordinates jsonb;
nPage int; nLine int;cFFrom text;
nBDid uuid;
BEGIN
nFSid := NULLIF(parameter->>'nFSid','')::uuid;
jText := parameter->>'jT';
nFt := parameter->>'nFt';
nSt := parameter->>'nSt';
jDate:= parameter->>'jDate';
cType := parameter->>'cType';
nTZid := parameter->>'nTZid';
jOT := parameter->>'jOT';
jAn := parameter->>'jAn';
nColorid:= NULLIF(parameter->>'nColorid','')::uuid;
jLinktype := parameter ->> 'jLinktype';
cIsNote := parameter->>'cIsNote';
bIsHighlighted := parameter->>'bIsHighlighted';
jCordinates := parameter->>'jCordinates';
nPage := parameter->>'nPage';
nLine := parameter->>'nLine';
cFFrom:= parameter->>'cFFrom';
nBDid := NULLIF(parameter->>'nBDid','')::uuid;

	insert into "FactDetail" ("nFSid","nFiletype","nTZid","jDate","nStatus","cType","jTexts","jOT","nColorid","jLinktype","cIsNote", "bIsHighlighted", "jCordinates", "nPage","nLine" )
	select nFSid,nFt,nTZid,jDate,nSt,cType,jText,jOT,nColorid,jLinktype,coalesce(cIsNote,'N'),bIsHighlighted, case when cFFrom = 'I' then null else jCordinates end, nPage, nLine;

	if(cFFrom = 'I') then
		 insert into "Annotations"("uuid","type","rects","lines","colorid","width","page","nFSid","nBDid","dCreateDt")
		 select "uuid","type",coalesce("rects",'[]'::jsonb),coalesce("lines",'[]'::jsonb),nColorid,"width","page",nFSid,nBDid,now() from jsonb_to_recordset(jAn) as ("uuid" text,"type" text,"rects" jsonb,"lines" jsonb,width int,"page" int);
	 end if;

	open ref for select 1 msg;
    RETURN ref;
END;
$function$;

-- Backfill orphaned PDF-fact annotations (empty nBDid) → their document.
UPDATE "Annotations" a
SET "nBDid" = fm."nBundledetailid"
FROM "FactMaster" fm
WHERE a."nFSid" = fm."nFSid"
  AND (a."nBDid" IS NULL OR a."nBDid"::text = '')
  AND fm."nBundledetailid" IS NOT NULL;
