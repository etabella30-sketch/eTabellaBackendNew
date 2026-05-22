CREATE OR REPLACE FUNCTION public.et_export_insert_data(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nCaseid uuid;
nExportid uuid;
cType text;bPagination boolean;
bDoc boolean;bFact boolean;bQfact boolean;
bCoverpg boolean;bFitpg boolean;

cDsize text;cFsize text; cQFsize text;
cOrientation text;cPgsize text;
jFiles jsonb;
jFContact jsonb;jFIssue jsonb;
jQFContact jsonb;jQFIssue jsonb;
jPages jsonb;

BEGIN
/* 

select * from public.et_export_insert_data ('{"cTranscript":"N","bPagination":false,"cPdftype":"S","bFact":true,"cFsize":"S","jFIssue":"[]","jFContact":"[]","bQfact":true,"cQFsize":"S","jQFIssue":"[]","jQFContact":"[]","bDoc":true,"cDsize":"S","bCoverpg":true,"cOrientation":"A","bFitpg":true,"cPgsize":"A4","nCaseid":"53b4e221-421a-4950-8176-60bd89db8e9f","jPages":"[]","jFiles":"[\"43b64dcf-7f5c-4e19-bed2-695bd001aea2\"]","nMasterid":"3a168b69-1bb8-4c7e-881f-dff78a854f80"}','r1');fetch all in "r1";
 
 
 */
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid; nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

cType := parameter->>'cPdftype';

bPagination := parameter->>'bPagination';
bDoc := parameter->>'bDoc'; bFact := parameter->>'bFact'; bQfact := parameter->>'bQfact';
bCoverpg := parameter->>'bCoverpg';bFitpg := parameter->>'bFitpg'; -- bQfact := parameter->>'bQfact';

cDsize := parameter->>'cDsize'; cFsize := parameter->>'cFsize'; cQFsize := parameter->>'cQFsize';
cOrientation := parameter->>'cOrientation'; cPgsize := parameter->>'cPgsize';

jFContact := parameter->>'jFContact'; jFIssue := parameter->>'jFIssue';
jQFContact := parameter->>'jQFContact'; jQFIssue := parameter->>'jQFIssue';
jPages := parameter->>'jPages';  

jFiles := parameter ->>'jFiles';
-- select * from "ExportMaster"
-- select * from "ExportDetail"
-- truncate table "ExportMaster" restart identity;
-- truncate table "ExportDetail" restart identity;

-- select * from "UserMaster" order by 1 desc

	insert into "ExportMaster" ("nUserid","nCaseid","cType","dReqDt","cStatus","bPagination","bDoc","bFact","bQfact","bCoverpg","bFitpg",
							   "cDsize","cFsize","cQFsize","cOrientation","cPgsize","jFContact","jFIssue","jQFContact","jQFIssue","jPages")
	
	values(nMasterid,nCaseid,cType,now(),'P',bPagination,bDoc,bFact,bQfact,bCoverpg,bFitpg,
		  cDsize,cFsize,cQFsize,cOrientation,cPgsize,coalesce(jFContact,'[]'::jsonb),coalesce(jFIssue,'[]'::jsonb),
		  coalesce(jQFContact,'[]'::jsonb),coalesce(jQFIssue,'[]'::jsonb),jPages)
      RETURNING "nExportid" INTO nExportid;
		  
	insert into "ExportDetail"("nExportid","nBDid")
	select distinct nExportid,NULLIF(t,'')::uuid from jsonb_array_elements_text(jFiles) t;
	
	open ref for select nExportid "nExportid";

 

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
