CREATE OR REPLACE FUNCTION elastic.debug_et_advance_search_filter(parameter json)
 RETURNS TABLE(nbundledetailid uuid)
 LANGUAGE plpgsql
AS $function$
DECLARE 
	nCaseid uuid;
	nMasterid uuid;
	nSectionid uuid;
	jIssues jsonb;
	jImpact jsonb;
	jRelevance jsonb;
	jMarkup jsonb;
	debug_msg text;
BEGIN
	nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
	nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
	nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;

	jIssues := nullif((parameter ->>'jIssues')::text,'');
	jImpact := nullif((parameter ->>'jImpact')::text,'');
	jRelevance := nullif((parameter ->>'jRelevance')::text,'');
	jMarkup := nullif((parameter ->>'jMarkup')::text,'');
	
	RAISE NOTICE 'Parameters: nCaseid=%, nMasterid=%, jIssues=%, jMarkup=%', nCaseid, nMasterid, jIssues, jMarkup;
	
	-- Convert JSON text to JSONB if not null
	IF jIssues IS NOT NULL THEN
		jIssues := jIssues::jsonb;
		RAISE NOTICE 'jIssues as JSONB: %', jIssues;
	END IF;
	
	IF jMarkup IS NOT NULL THEN
		jMarkup := jMarkup::jsonb;
		RAISE NOTICE 'jMarkup as JSONB: %', jMarkup;
	END IF;

	RETURN QUERY
	with fct as (
		select f."nFSid",f."nBundledetailid",i."nIssueid",i."nImpactid",i."nRelevanceid",f."cFType"
		from "FactMaster" f
		join "FMIssue" i on i."nFSid" = f."nFSid"
		where f."nUserid" = nMasterid 
		  and (jIssues IS NULL OR jIssues @> to_jsonb(i."nIssueid"))
		  and (jMarkup IS NULL OR jMarkup @> to_jsonb(ARRAY[f."cFType"]))
	),doc as (
		select d."nDocid",d."nBundledetailid" 
		From "DocMaster" d 
		where "nUserid" = nMasterid
		  and (jMarkup IS NULL OR jMarkup @> to_jsonb(ARRAY['D']))
	),web as (
		select w."nWebid",w."nBundledetailid" 
		From "WebMaster" w 
		where "nUserid" = nMasterid
		  and (jMarkup IS NULL OR jMarkup @> to_jsonb(ARRAY['W']))
	)
	select distinct b."nBundledetailid"
		from "BundleDetail" b
		join "SectionMaster" s on s."nSectionid" = b."nSectionid"
		left join fct f on f."nBundledetailid" = b."nBundledetailid"
		left join doc d on d."nBundledetailid" = b."nBundledetailid"
		left join web w on w."nBundledetailid" = b."nBundledetailid"
		where b."cStatus" = 'C' and b."cFiletype" = 'PDF'
		and s."nCaseid" = nCaseid 
		and case when nSectionid IS NOT NULL then b."nSectionid" = nSectionid else true end
		and case when (jIssues is not null or jImpact is not null or jRelevance is not null) then f."nBundledetailid" IS NOT NULL else true end
		and case when (jMarkup is not null and jMarkup @> to_jsonb(ARRAY['D'])) then d."nBundledetailid" IS NOT NULL else true end
		and case when (jMarkup is not null and jMarkup @> to_jsonb(ARRAY['W'])) then w."nBundledetailid" IS NOT NULL else true end;
END;
$function$
