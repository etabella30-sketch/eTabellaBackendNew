-- ROLLBACK for migrations/prod_etabella_com_uuid_2026-09-15.sql  (generated 2026-09-15)
-- Restores every replaced function to its pre-migration body (2026-05-19 snapshot, or the known live
-- version for et_bundles), drops new functions/triggers/indexes. New TABLES and COLUMNS are KEPT
-- (dropping them would destroy data written after the migration) -- drop by hand if really wanted.
-- Codemaster: relabels are reversed (guarded); inserted codes are left in place (harmless, may be referenced).
\set ON_ERROR_STOP on
DO $g$ BEGIN IF current_database() <> 'etabella.com.uuid' THEN RAISE EXCEPTION 'ABORT wrong DB %', current_database(); END IF; END $g$;
BEGIN;
DROP TRIGGER IF EXISTS trg_bundledetail_filecount ON public."BundleDetail";
DROP TRIGGER IF EXISTS trg_bundlemaster_delete_cascade ON public."BundleMaster";
DROP TRIGGER IF EXISTS trg_bundlemaster_parent_move ON public."BundleMaster";
DROP FUNCTION IF EXISTS public.roman_to_int(text);
DROP FUNCTION IF EXISTS sym.fn_bundle_delete_cascade();
DROP FUNCTION IF EXISTS sym.fn_bundle_filecount_bd_change();
DROP FUNCTION IF EXISTS sym.fn_bundle_parent_move();
DROP FUNCTION IF EXISTS public.et_is_case_member(uuid, uuid);
DROP FUNCTION IF EXISTS download.et_expire_downloads(json, refcursor);
DROP FUNCTION IF EXISTS public.et_admindashboard_count(json, refcursor);
DROP FUNCTION IF EXISTS public.et_annotation_index_rows(json, refcursor);
DROP FUNCTION IF EXISTS public.et_bundle_index(json, refcursor);
DROP FUNCTION IF EXISTS public.et_bundle_search(json, refcursor);
DROP FUNCTION IF EXISTS public.et_case_bundle_sizes(json, refcursor);
DROP FUNCTION IF EXISTS public.et_case_doclinks(json, refcursor);
DROP FUNCTION IF EXISTS public.et_dashboard(json, refcursor, refcursor, refcursor, refcursor);
DROP FUNCTION IF EXISTS public.et_output_data_export_complete(json, refcursor);
DROP FUNCTION IF EXISTS public.et_output_data_export_delete(json, refcursor);
DROP FUNCTION IF EXISTS public.et_output_data_export_get(json, refcursor);
DROP FUNCTION IF EXISTS public.et_output_data_export_insert(json, refcursor);
DROP FUNCTION IF EXISTS public.et_output_data_export_list(json, refcursor);
DROP FUNCTION IF EXISTS public.et_savedsearch_delete(json, refcursor);
DROP FUNCTION IF EXISTS public.et_savedsearch_list(json, refcursor);
DROP FUNCTION IF EXISTS public.et_savedsearch_save(json, refcursor);
DROP FUNCTION IF EXISTS public.et_share_get_bundles(json, refcursor);
DROP FUNCTION IF EXISTS public.et_workspace_company_list(json, refcursor);
DROP FUNCTION IF EXISTS public.et_workspace_participant_factlinks(json, refcursor);
DROP FUNCTION IF EXISTS public.et_workspace_participant_list(json, refcursor);
DROP FUNCTION IF EXISTS public.et_workspace_task_factlink(json, refcursor);
DROP FUNCTION IF EXISTS public.et_workspace_task_list(json, refcursor);
DROP FUNCTION IF EXISTS public.et_workspace_task_users(json, refcursor);
DROP FUNCTION IF EXISTS public.et_workspace_view_delete(json, refcursor);
DROP FUNCTION IF EXISTS public.et_workspace_view_list(json, refcursor);
DROP FUNCTION IF EXISTS public.et_workspace_view_save(json, refcursor);

-- ===== public.filter_columnnames(text, text) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.filter_columnnames(filter_name text, ctype text) RETURNS text
    LANGUAGE plpgsql
    AS $$
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
$$;

-- ===== realtime.filter_marknav(jsonb, uuid, uuid, text, uuid, boolean) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION realtime.filter_marknav(jfilter jsonb, nsesid uuid, nuserid uuid, ctype text, nteamid uuid, isadmin boolean) RETURNS TABLE(id uuid, type text)
    LANGUAGE plpgsql
    AS $$

declare
		jClaims jsonb;jIssues jsonb;jRels jsonb;jImps jsonb;
		IsNote boolean;IsFactlink boolean;IsComment boolean;
		jContacts jsonb;jCRoles jsonb;jCPartys jsonb;jCCompanies jsonb;IsContactNote boolean;
		jTasks jsonb;IsTaskDesc boolean;jTShared jsonb;jTStatus jsonb;jTPriority jsonb;
		jDate jsonb;jFiletypes jsonb;jStatus jsonb;createDate jsonb;createBy jsonb;dTDate timestamp;

		IsCreateByMe boolean;IsShared boolean;

		start_dt timestamp;end_dt timestamp;dateType text;
		cMainType text;



BEGIN

	jClaims := jFilter ->>'jClaims';
	jIssues := jFilter ->>'jIssues';
	jRels := jFilter ->>'jRels';
	jImps := jFilter ->>'jImps';

	IsNote := jFilter ->>'IsNote';
	IsFactlink := jFilter ->>'IsFactlink';
	IsComment := jFilter ->>'IsComment';

	jContacts := jFilter ->>'jContacts';
	jCRoles := jFilter ->>'jCRoles';
	jCPartys := jFilter ->>'jCPartys';
	jCCompanies := jFilter ->>'jCCompanies';
	IsContactNote := jFilter ->>'IsContactNote';
	dTDate := jFilter ->>'dTDate';

	jTasks := jFilter ->>'jTasks';
	IsTaskDesc := jFilter ->>'IsTaskDesc';
	jTShared := jFilter ->>'jTShared';
	jTStatus := jFilter ->>'jTStatus';
	jTPriority := jFilter ->>'jTPriority';

	jDate := jFilter ->>'jDate';
	jFiletypes := jFilter ->>'jFiletypes';
	jStatus := jFilter ->>'jStatus';
	createDate := jFilter ->>'createDate';
	createBy := jFilter ->>'createBy';

	IsCreateByMe := jFilter ->>'IsCreateByMe';
	IsShared := jFilter ->>'IsShared';
	cMainType := jFilter ->>'cType';

/*
select now()::date
t
where case when jFilter is not null then  exists  (
select * from realtime.filter_marknav('{"dTDate":"2025-08-30"}'::jsonb,'79d6fa26-7d27-49a3-8204-1e128505b682','ba561c55-81f5-4180-8934-2ce6dcaa096c','ALL') m
where m."id" = t."nId"
)
select * from realtime.filter_marknav('{}'::jsonb,'79d6fa26-7d27-49a3-8204-1e128505b682','ba561c55-81f5-4180-8934-2ce6dcaa096c','ALL')

2025-08-27

select * from realtime.filter_marknav_backup('{}'::jsonb,'79d6fa26-7d27-49a3-8204-1e128505b682','ba561c55-81f5-4180-8934-2ce6dcaa096c','ALL')

select * from "FactMaster" order by "dCreateDt" desc

select * from "ContactMaster" order by "dCreateDt" desc

select * from "TaskDetail" where "nTaskid" = '009f3033-a347-42b2-b224-21f9c6ad9f8a'

select "jTimeline"->>'dEnd',* from "TaskDetail"

select td."dEndDt",f.* From "FactMaster" f
left join "FMTasks" fm on fm."nFSid" = f."nFSid"
left join "TaskDetail" td on td."nTaskid" = fm."nTaskid"
 where f."nFSid" = 'b0f97b93-7d08-4fe8-a0f8-1e9cbdc674ca' and td."dEndDt"::date = ('2025-08-27')::date

select * from "FactDetail" limit 100

select * from realtime.filter_marknav('{"IsComment":true}'::jsonb,'f083ca63-1145-4711-aede-8d08a0260f68'::uuid,'fc2b2057-ac44-41c7-9058-64e8617ed3e5'::uuid,'ALL');

*/
start_dt := (SELECT fact_bound_ts_immutable(jDate, 'start'));
end_dt := (SELECT fact_bound_ts_immutable(jDate, 'end'));
dateType := (select ("jOther"->>'type')::text from "Codemaster" where "nCodeid" = (jDate->>'nValue')::int limit 1);

    /*RAISE NOTICE 'filter_marknav -> start_dt: %, end_dt: %, dateType: %',
      start_dt, end_dt, COALESCE(dateType, 'NULL');*/
    RETURN QUERY

with tbl as (
	select f."nFSid" as "id",f."cFType"::text "type",f."nSesid",f."nBundledetailid",f."nUserid" as "nCreateid",
	fi."nImpactid",fi."nRelevanceid",fi."nIssueid",i."nICid",
	jsonb_array_length(coalesce(fd."jTexts",'[]'::jsonb))>0 as "IsNote",
	coalesce(fl."nFMLid",'00000000-0000-0000-0000-000000000000'::uuid) != '00000000-0000-0000-0000-000000000000'::uuid as "IsFactlink",
	cm."nContactid",cm."nRoleid",cm."nCompanyid",cm."nPartyid",
	coalesce(cm."cNote",'') != '' as "IsContactNote",
	td."nTaskid",coalesce(td."cDesc",'') != '' as "IsTaskDesc",td."nStatus" as "nTStatus",td."nPriority",ts."nUserid" as "nTShareUserid",td."dEndDt" as "dTEndDt",
	fd."nFiletype",fd."nStatus",f."dCreateDt",fd."jDate",
	fs."nUserid" as "nShareUserid",fd."start_date",fd."end_date",case when (cmt."nFSid" is not null) then true else false end  "IsComment"
	from "FactMaster" f
	join "FactDetail" fd on fd."nFSid" = f."nFSid" and (case when cMainType ='M' then fd."cType" = 'M' when fd."cType" = 'S' then fd."cType" != 'M'   else true end)
	join "FMIssue" fi on fi."nFSid" = f."nFSid"
	join "RIssueMaster" i on i."nIid" = fi."nIssueid"
	left join "FMShared" fs on fs."nFSid" = f."nFSid"
	left join "FMLinks" fl on fl."nFSid" = f."nFSid"
	left join "FMContact" fc on fc."nFSid" = f."nFSid"
	left join "ContactMaster" cm on cm."nContactid" = fc."nContactid"
	left join "FMTasks" fm on fm."nFSid" = f."nFSid"
	left join "TaskDetail" td on td."nTaskid" = fm."nTaskid"
	left join "TaskShared" ts on ts."nTaskid" = fm."nTaskid"
	left join (
			select distinct c."nFSid",c."nSesid" from realtime."Comments" c  where c."dDelDt" is null
	) cmt on cmt."nFSid" = f."nFSid"
	where case when cType = 'ALL' then true else ("cFType" = cType) end
	union all
	select d."nDocid" as "id",'D'::text as "type",d."nSesid",d."nBundledetailid",d."nUserid" as "nCreateid",
	  NULL        as "nImpactid",
	  NULL        as "nRelevanceid",
	  NULL::uuid        as "nIssueid",
	  NULL::uuid        as "nICid",
	  NULL::boolean     as "IsNote",
	  NULL::boolean     as "IsFactlink",
	  NULL::uuid        as "nContactid",
	  NULL::uuid        as "nRoleid",
	  NULL::uuid        as "nCompanyid",
	  NULL        as "nPartyid",
	  NULL::boolean     as "IsContactNote",
	  NULL::uuid        as "nTaskid",
	  NULL::boolean     as "IsTaskDesc",
	  NULL::integer     as "nTStatus",
	  NULL::integer     as "nPriority",
	  NULL::uuid        as "nTShareUserid",
	  null      		as "dTEndDt",
	  NULL::integer     as "nFiletype",
	  NULL::integer     as "nStatus",
	  d."dCreateDt",
	  NULL::jsonb       as "jDate",
	  s."nUserid" as "nShareUserid",null "start_date",null "end_date", false "IsComment"
	From "DocMaster" d
	join "DocDetail" dd on dd."nDocid" = d."nDocid" and (case when cMainType ='M' then dd."cType" = 'M' when dd."cType" = 'S' then dd."cType" != 'M' else true end)
	left join "DMShared" s on s."nDocid" = d."nDocid"
	where case when cType = 'ALL' then true else cType = 'D' end

	union all

	select
	  rh."nHid" as "id",
	  'QF'::text as "type",
	  rh."nSessionId",
      null::uuid 			as "nBundledetailid",
	  rh."nUserid" 		as "nCreateid",
	  NULL        		as "nImpactid",
	  NULL       		as "nRelevanceid",
	  NULL::uuid        as "nIssueid",
	  NULL::uuid        as "nICid",
	  NULL::boolean     as "IsNote",
	  NULL::boolean     as "IsFactlink",
	  NULL::uuid        as "nContactid",
	  NULL::uuid        as "nRoleid",
	  NULL::uuid        as "nCompanyid",
	  NULL              as "nPartyid",
	  NULL::boolean     as "IsContactNote",
	  NULL::uuid        as "nTaskid",
	  NULL::boolean     as "IsTaskDesc",
	  NULL::integer     as "nTStatus",
	  NULL::integer     as "nPriority",
	  NULL::uuid        as "nTShareUserid",
	  null      		as "dTEndDt",
	  NULL::integer     as "nFiletype",
	  NULL::integer     as "nStatus",
	  rh."dCreatedt",
	  NULL::jsonb       as "jDate",
	  null as "nShareUserid",
	  null "start_date",
	  null "end_date",
	  false "IsComment"
	From "RHighlights" rh
	where case when cType = 'ALL' then true else cType = 'QM' end

) select t."id",t."type"
	from tbl t
	 left join "TeamRelation" tr ON tr."nTeamid" = nTeamid
	where ("nSesid" = nSesid   or "nBundledetailid" = nSesid)
	and
	(
		(IsCreateByMe is null and IsShared is null and ("nCreateid" = nUserid or "nShareUserid" = nUserid
		or (case when isAdmin = true then  "nCreateid" = tr."nUserid" else false end)) )
		or (
			(IsCreateByMe is not null and  "nCreateid" = nUserid)
			or
			(IsShared is not null and "nShareUserid" = nUserid )
		)
	)
--- ISSUE _FILTER
	and
	(
		jClaims is null
		or (jClaims is not null and jClaims @> to_jsonb("nICid"))
	)
	and
	(
		jIssues is null
		or (jIssues is not null and jIssues @> to_jsonb("nIssueid"))
	)
	and
	(
		jRels is null
		or (jRels is not null and jRels @> to_jsonb("nRelevanceid"))
	)
	and
	(
		jImps is null
		or (jImps is not null and jImps @> to_jsonb("nImpactid"))
	)

--- OTHER FACT DETAIL

	and
	(
		IsNote is null
		or (IsNote is not null and "IsNote" = true)
	)
	and
	(
		IsFactlink is null
		or (IsFactlink is not null and "IsFactlink" = true)
	)
	and
	(
		IsComment is null
		or (IsComment is not null and "IsComment" = true)
	)
	-- or (IsComment is not null and "IsComment" = true)

--------  CONTACT FILTER

	and
	(
		jContacts is null
		or (jContacts is not null and jContacts @> to_jsonb("nContactid"))
	)
	and
	(
		jCRoles is null
		or (jCRoles is not null and jCRoles @> to_jsonb(t."nRoleid"))
	)
	and
	(
		jCPartys is null
		or (jCPartys is not null and jCPartys @> to_jsonb("nPartyid"))
	)
	and
	(
		jCCompanies is null
		or (jCCompanies is not null and jCCompanies @> to_jsonb("nCompanyid"))
	)
	and
	(
		IsContactNote is null
		or (IsContactNote is not null and "IsContactNote" = true)
	)

--------------- TASK FILTER
	and
	(
		jTasks is null
		or (jTasks is not null and jTasks @> to_jsonb("nTaskid"))
	)
	and
	(
		IsTaskDesc is null
		or (IsTaskDesc is not null and "IsTaskDesc"  = true)
	)
	and
	(
		jTShared is null
		or (jTShared is not null and jTShared @> to_jsonb("nTShareUserid"))
	)
	and
	(
		jTStatus is null
		or (jTStatus is not null and jTStatus @> to_jsonb("nTStatus"))
	)
	and
	(
		jTPriority is null
		or (jTPriority is not null and jTPriority @> to_jsonb("nPriority"))
	)

	and
	(
		dTDate is null
		or (dTDate is not null and ("dTEndDt")::date  =  (dTDate)::date )
	)
----------------------------- FACT DETAIL

	and
	(
		jFiletypes is null
		or (jFiletypes is not null and jFiletypes @> to_jsonb("nFiletype"))
	)
	and
	(
		jStatus is null
		or (jStatus is not null and jStatus @> to_jsonb("nStatus") )
	)
	and
	(
		createDate is null
		or (createDate is not null and "dCreateDt"::date between (createDate->>'start')::date and  (createDate->>'end')::date )
	)
	and
	(
		createBy is null
		or (createBy is not null and createBy @> to_jsonb("nCreateid"))
	)
	-- or jDate

	and
	(
	 	jDate is null
		or (jDate is not null and
			 case when (dateType = 'ON' or dateType = 'C' or dateType = 'BT') then
				(
					start_dt::date BETWEEN "start_date"::date AND "end_date"::date
         			OR end_dt::date   BETWEEN "start_date"::date AND "end_date"::date
          			OR "start_date"::date BETWEEN start_dt::date AND end_dt::date
        			OR "end_date"::date   BETWEEN start_dt::date AND end_dt::date
				)
				when  dateType = 'B' then
				start_date::date >= "start_date"::date
				when  dateType = 'A' then
				"start_date"::date >= start_date::date
			 end

		)
	)
	group by t."id",t."type"
;


END;
$$;

-- ===== download.et_delete(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION download.et_delete(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$
-- select * from "BundleDetail"
declare nDPid uuid;nMasterid uuid;cUrl text;isNeedToClear boolean;

BEGIN
nDPid:= parameter ->>'nDPid';
nMasterid := parameter ->>'nMasterid';

-- select * from download.et_delete ('{"nDPid":1}','r1');fetch all in "r1";
-- select * from download."ProcessMaster" where "cStatus" = 'C' order by "dCreateDt" desc


		update download."Users" set "dDelDt" = now() where "nDPid" = nDPid and "nUserid" = nMasterid;

		if not exists(select * from download."Users" where "nDPid" = nDPid and "dDelDt" is null )then
			delete from download."ProcessBatchs" where "nDPid" = nDPid;

			update download."ProcessMaster" set "dDelDt" = now() where "nDPid" = nDPid
			returning "cUrl" into cUrl;

			isNeedToClear = true;

		end if;


		OPEN ref FOR
			select 1 as msg,cUrl as "cUrl",'Deleted!' as value,isNeedToClear as  "isNeedToClear";

   return ref ;-- Return the cursor to the caller
    END;
$$;

-- ===== download.et_get_approximate_size(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION download.et_get_approximate_size(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$
-- select * from "BundleDetail"
declare nUserid uuid;nCaseid uuid;nSectionid uuid;
jFolders jsonb;jFiles jsonb;cFilename text;cFinalSize numeric;cDSize numeric;defaultSize numeric default 1073741824;
isHyperlink boolean;

BEGIN
nCaseid:= NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid:= NULLIF(parameter ->>'nSectionid','')::uuid;
jFolders := parameter ->>'jFolders';
jFiles := parameter ->>'jFiles';
nUserid:= NULLIF(parameter ->>'nMasterid','')::uuid;
isHyperlink:= parameter ->>'bIshyperlink';
	-- select * from et_download_getdata ('{"nCaseid":22,"nSectionid":92,"jFolders":"{}","jFiles":"{}","nMasterid":59}','r1');fetch all in "r1";

	cFilename := (select REGEXP_REPLACE("cCasename", '[^a-zA-Z0-9 ]', '', 'g') from "CaseMaster" where "nCaseid" = nCaseid);

/*

select * from "SectionMaster" where "nCaseid" = '007a3614-ac77-40e4-bad1-4962b6571c58'

 select * from download.et_get_approximate_size ('{"nCaseid":"2de50566-859e-4d12-b1f4-8cebbf1e58a3","nSectionid":"59445b8f-f372-49d1-a443-8c597e7bd62d","jFolders":"[]","jFiles":"[]","nMasterid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5"}','r1');fetch all in "r1";

-- select * From "CaseMaster"

alter table "CaseMaster" add column "cDSize" character varying(150)

*/

	select nullif("cDSize",'')::numeric into cDSize From "CaseMaster" where "nCaseid" = nCaseid;

	if(cDSize is null)then
		cDSize = defaultSize;
	end if;

	if(jsonb_array_length(jFolders) > 0) then
		cFilename := (select REGEXP_REPLACE("cBundlename", '[^a-zA-Z0-9 ]', '', 'g') from "BundleMaster" where jFolders @> to_jsonb("nBundleid") limit 1);
	end if;

		WITH RECURSIVE bdl_tree AS (
            SELECT bm."nBundleid", bm."cBundlename"::text AS "cBundlename", bm."nParentBundleid",
                bm."cBundlename"::text AS sub_info, bm."nSectionid", bm."cBundletag"
            FROM "BundleMaster" bm
			join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
			left join "BMPermission" bp on bm."nBundleid" = bp."nBundleid" and bp."nUserid" = nUserid
            WHERE coalesce(bp."nBMPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid and  CASE
        WHEN jsonb_array_length(jFolders) = 0 and jsonb_array_length(jFiles) = 0 THEN  bm."nParentBundleid" IS NULL
		ELSE jFolders @> to_jsonb(bm."nBundleid") -- bm."nBundleid" = ANY(jFolders::uuid[])
    END

			AND sm."nCaseid" = nCaseid AND bm."nSectionid" = nSectionid
            UNION ALL
            SELECT c."nBundleid", c."cBundlename", c."nParentBundleid",
                p.sub_info || '/' || c."cBundlename"::text, c."nSectionid", c."cBundletag"
            FROM "BundleMaster" c
            JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"
			left join "BMPermission" bp on c."nBundleid" = bp."nBundleid" and bp."nUserid" = nUserid
			WHERE coalesce(bp."nBMPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid
       ), final_detail as (
					  SELECT t.*
		        FROM (
					with tm as (
					            SELECT bd."nBundledetailid",bd."cFilesize"
					            FROM "BundleDetail" bd
								JOIN bdl_tree p ON p."nBundleid" = bd."nBundleid"
								left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
								WHERE  coalesce(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid -- bp."nBDPid" is null
						union all
								 SELECT bd."nBundledetailid",bd."cFilesize"
					            FROM "BundleDetail" bd
								 join "BDAssignment" ba on ba."nBundledetailid" = bd."nBundledetailid"
								JOIN bdl_tree p ON p."nBundleid" = ba."nBundleid"
								left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
								WHERE  coalesce(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid -- bp."nBDPid" is null
					)
						select "nBundledetailid","cFilesize" from tm
					union all
						SELECT DISTINCT bd."nBundledetailid",bd."cFilesize" from "HyperLink" h
							join tm on tm."nBundledetailid" = h."nBundledetailid"
							join "Annotations" a on h."nHLid" = a."nHLid"
							join "BundleDetail" bd on bd."nBundledetailid" = NULLIF(rects[0]->>'bundledetailid','00000000-0000-0000-0000-000000000000')::uuid
							where  bd."cStatus" ='C' and isHyperlink = true
		        ) t

			union all
			select "nBundledetailid","cFilesize" from
			( with tm as ( SELECT bd."nBundledetailid",bd."cFilesize"
               FROM "BundleDetail" bd
			   	left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
               WHERE  coalesce(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid and  bd."nSectionid" = nSectionid AND (case when jsonb_array_length(jFiles) = 0 THEN bd."cIsindex"  != true else  true end)
					and   CASE WHEN jsonb_array_length(jFolders) = 0 and jsonb_array_length(jFiles) = 0 THEN bd."nBundleid" IS NULL
			when jsonb_array_length(jFiles) > 0 then jFiles @>  to_jsonb(bd."nBundledetailid") and not exists (select * from "bdl_tree" bt where bt."nBundleid" = bd."nBundleid")	ELSE false end

			union all

			SELECT bd."nBundledetailid",bd."cFilesize"
               FROM "BundleDetail" bd
			   join "BDAssignment" ba on ba."nBundledetailid" = bd."nBundledetailid"
			   	left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
               WHERE  coalesce(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid and  ba."nSectionid" = nSectionid AND (case when jsonb_array_length(jFiles) = 0 THEN bd."cIsindex"  != true else  true end)
					and   CASE WHEN jsonb_array_length(jFolders) = 0 and jsonb_array_length(jFiles) = 0 THEN ba."nBundleid" IS NULL
			when jsonb_array_length(jFiles) > 0 then jFiles @>  to_jsonb(bd."nBundledetailid") and not exists (select * from "bdl_tree" bt where bt."nBundleid" = ba."nBundleid")	ELSE false end

			)
					select "nBundledetailid","cFilesize" from tm
				union all
				SELECT DISTINCT bd."nBundledetailid",bd."cFilesize" from "HyperLink" h
				join tm on tm."nBundledetailid" = h."nBundledetailid"
				join "Annotations" a on h."nHLid" = a."nHLid"
				join "BundleDetail" bd on bd."nBundledetailid" = NULLIF(rects[0]->>'bundledetailid','00000000-0000-0000-0000-000000000000')::uuid
				where bd."cStatus" ='C' and isHyperlink = true

			) t



	   ) select sum(nullif("cFilesize",'')::numeric) into cFinalSize from final_detail;


    OPEN ref FOR
	   select 1 as msg,cDSize >= coalesce(cFinalSize,0) as "isValidForStream",coalesce(cFinalSize,0) as "cFinalSize";



   return ref ;-- Return the cursor to the caller
    END;
$$;

-- ===== download.et_get_download_jobs(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION download.et_get_download_jobs(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$
-- select * from "BundleDetail"
declare nCaseid uuid;nMasterid uuid;pageNumber int;cSortBy text;

offsetCount int;perPage int default 10;nDPid uuid;
BEGIN
nCaseid := parameter ->>'nCaseid';
nMasterid := parameter ->>'nMasterid';
pageNumber := parameter ->>'PageNumber';
cSortBy := parameter ->>'cSortBy';
nDPid := parameter ->>'nDPid';

offsetCount := (pageNumber - 1) * perPage;
/*

select * from download.et_get_download_jobs ('{"nMasterid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5","nCaseid":"007a3614-ac77-40e4-bad1-4962b6571c58","cSortBy":"N","nDPid":"445f875b-976f-42b7-9df8-2535ae189212"}','r1');fetch all in "r1";

 select * from download.et_get_download_jobs ('{"nCaseid":"007a3614-ac77-40e4-bad1-4962b6571c58","PageNumber":2,"cSortBy":"N","nDPid":"445f875b-976f-42b7-9df8-2535ae189212","nMasterid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5"}','r1');fetch all in "r1";

select * from download."ProcessMaster"  order by "dCreateDt"
select * from download."ProcessBatchs"
select * from "SectionMaster"  limit 1
select * from download."ProcessBatchs"

select * from download."ProcessMaster"
select * from download."Users"
select * from "BundleMaster"  limit 1

select * From download."ProcessStatusLogs"

*/

    OPEN ref FOR
		with tbl as (
		select p."nDPid",p."cStatus",u."dCreateDt",p."dLastUpdateDt",p."isBatchUpdated",
		c."cCasename" as "cTitle",sum(coalesce(b."cSize",'0')::bigint) "totalSize",count(b."nBundledetailid") as "totalFiles",
		p."dStartDt"
		from download."ProcessMaster" p
		join "CaseMaster" c on c."nCaseid" = p."nCaseid"
		join download."Users" u on u."nDPid" = p."nDPid" and u."nUserid" = nMasterid and u."dDelDt" is null
		left join download."ProcessBatchs" b on b."nDPid" = p."nDPid" and b."isFileExists" = true
		where p."nCaseid" = nCaseid and p."dDelDt" is null --and p."nCreateId" = nMasterid
		and case when nDPid is not null then p."nDPid" = nDPid else true end
		group by p."nDPid",p."cStatus",u."dCreateDt",p."dLastUpdateDt",p."isBatchUpdated",
		c."cCasename" ,p."dStartDt"

		) select * from tbl  order by
  			CASE WHEN cSortBy = 'N' THEN "dCreateDt" END DESC,
  			CASE WHEN cSortBy <> 'N' THEN "dCreateDt" END ASC
		LIMIT perPage
        OFFSET offsetCount
		;




   return ref ;-- Return the cursor to the caller
    END;
$$;

-- ===== download.et_get_download_presigned_url(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION download.et_get_download_presigned_url(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$
-- select * from "BundleDetail"
declare nMasterid uuid;nDPid uuid;
BEGIN
nMasterid := parameter ->>'nMasterid';
nDPid := parameter ->>'nDPid';
/*

select * from download.et_get_download_presigned_url ('{"nMasterid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5","nCaseid":"007a3614-ac77-40e4-bad1-4962b6571c58","cSortBy":"N","nDPid":"2a0df4fc-301a-4e2c-8b21-2b9f8cd6f0ca"}','r1');fetch all in "r1";

select * from download."ProcessMaster"  order by "dCreateDt"
select * from download."ProcessBatchs"
select * from "SectionMaster"  limit 1
select * from download."ProcessBatchs"

select * from download."ProcessMaster"
select * from "BundleMaster"  limit 1

select * From download."ProcessStatusLogs"

*/

    OPEN ref FOR
		select "cUrl"
		from download."ProcessMaster" where "nDPid" = nDPid

		;




   return ref ;-- Return the cursor to the caller
    END;
$$;

-- ===== download.et_get_hyperlink_jobs(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION download.et_get_hyperlink_jobs(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $_$
-- select * from "BundleDetail"
declare nCaseid uuid;nMasterid uuid;pageNumber int;cSortBy text;

offsetCount int;perPage int default 10;nDPid uuid;totalFiles int;
BEGIN
nCaseid := parameter ->>'nCaseid';
nMasterid := parameter ->>'nMasterid';
pageNumber := parameter ->>'PageNumber';
cSortBy := parameter ->>'cSortBy';
nDPid := parameter ->>'nDPid';
totalFiles := parameter ->>'totalFiles';

offsetCount := (pageNumber - 1) * perPage;
/*

select * from download.et_get_download_jobs ('{"nMasterid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5","nCaseid":"007a3614-ac77-40e4-bad1-4962b6571c58","cSortBy":"N","nDPid":"445f875b-976f-42b7-9df8-2535ae189212"}','r1');fetch all in "r1";

 select * from download.et_get_download_jobs ('{"nCaseid":"007a3614-ac77-40e4-bad1-4962b6571c58","PageNumber":2,"cSortBy":"N","nDPid":"445f875b-976f-42b7-9df8-2535ae189212","nMasterid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5"}','r1');fetch all in "r1";

select * from download."ProcessMaster"  order by "dCreateDt"
select * from download."ProcessBatchs"
select * from "SectionMaster"  limit 1
select * from download."ProcessBatchs"

select * from download."ProcessMaster"
select * from download."Users"
select * from "BundleMaster"  limit 1

select rects[0]->>'bundledetailid',* From "Annotations" where "nHLid" is not null limit 10

*/

    OPEN ref FOR
		select nMasterid "nMasterid",totalFiles "totalFiles",p."nDPid",b."nBundledetailid",b."cPath",jsonb_agg(jsonb_build_object('page',a.page,'rect',a.rects,'target_file_path','hyperlink/'|| (case when coalesce(bd."cTab",'') !='' then  bd."cTab" || '_' else '' end) || ((CASE  WHEN upper(bd."cFilename") LIKE ('%' || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$'))))  THEN regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') ELSE  regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$')))
								END)),'link_text',bd."cTab")) "metadata",bs."cIsindex"
		from download."ProcessMaster" p
		join download."ProcessBatchs" b on b."nDPid" = p."nDPid"
		join "BundleDetail" bs on bs."nBundledetailid" = b."nBundledetailid"
		join "HyperLink" hl on hl."nBundledetailid" = b."nBundledetailid"
	    join "Annotations" a on hl."nHLid" = a."nHLid"
		join "BundleDetail" bd on bd."nBundledetailid" = coalesce(a.rects[0]->>'bundledetailid','00000000-0000-0000-0000-000000000000')::uuid
		 where p."nDPid" = nDPid and "cFtype" = 'F' and bs."cFiletype" ='PDF'
		and case when bs."cIsindex" != true then  hl."nHLid" is not null else true end
		group by p."nDPid",b."nBundledetailid",b."cPath",bs."cIsindex"
	union all
		select nMasterid "nMasterid",totalFiles "totalFiles",p."nDPid",b."nBundledetailid",b."cPath",jsonb_agg(jsonb_build_object('page',0,'rect','[]'::jsonb,'target_file_path','hyperlink/'||  (case when coalesce(bd."cTab",'') !='' then  bd."cTab" || '_' else '' end) || ((CASE  WHEN upper(bd."cFilename") LIKE ('%' || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$'))))  THEN regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') ELSE  regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$')))
									END)),'link_text',bd."cTab")) "metadata",bs."cIsindex"
			from download."ProcessMaster" p
			join download."ProcessBatchs" b on b."nDPid" = p."nDPid"
			join "BundleDetail" bs on bs."nBundledetailid" = b."nBundledetailid"
			join "SectionMaster" s on s."nCaseid" = p."nCaseid"
			join "BundleDetail" bd on bd."nSectionid" = s."nSectionid"
			 where p."nDPid" = nDPid and "cFtype" = 'F' and bs."cFiletype" ='PDF' and bs."cIsindex" = true
			group by p."nDPid",b."nBundledetailid",b."cPath",bs."cIsindex";



   return ref ;-- Return the cursor to the caller
    END;
$_$;

-- ===== download.et_insert_download_process(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION download.et_insert_download_process(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$DECLARE
    nMasterid uuid;
    nCaseid uuid;
    nSectionid uuid;

    jFolder jsonb;
    jFiles jsonb;

    nDPid uuid;
    isExistingJob boolean DEFAULT false;

    batch_ids uuid[];
    isHyperlink boolean;
BEGIN

    --------------------------------------------------
    -- READ PARAMETERS
    --------------------------------------------------
    nMasterid := NULLIF(parameter ->> 'nMasterid','')::uuid;
    nCaseid   := NULLIF(parameter ->> 'nCaseid','')::uuid;
    nSectionid:= NULLIF(parameter ->> 'nSectionid','')::uuid;

    jFolder := COALESCE((parameter ->> 'jFolders')::jsonb, '[]'::jsonb);
    jFiles  := COALESCE((parameter ->> 'jFiles')::jsonb,  '[]'::jsonb);

    -- ✅ FIXED BOOLEAN PARSING
    isHyperlink := COALESCE(NULLIF(parameter ->> 'isHyperlink','')::boolean, false);

    --------------------------------------------------
    -- BUILD BUNDLE TREE
    --------------------------------------------------
    WITH RECURSIVE bdl_tree AS (
        SELECT bm."nBundleid", bm."cBundlename", bm."nParentBundleid"
        FROM "BundleMaster" bm
        JOIN "SectionMaster" sm
          ON sm."nSectionid" = bm."nSectionid"
        LEFT JOIN "BMPermission" bp
          ON bp."nBundleid" = bm."nBundleid"
         AND bp."nUserid" = nMasterid
        WHERE COALESCE(bp."nBMPid",'00000000-0000-0000-0000-000000000000'::uuid)
              = '00000000-0000-0000-0000-000000000000'::uuid
          AND sm."nCaseid" = nCaseid
          AND bm."nSectionid" = nSectionid
          AND (
                (jsonb_array_length(jFolder) = 0
                 AND jsonb_array_length(jFiles) = 0
                 AND bm."nParentBundleid" IS NULL)
             OR (jsonb_array_length(jFolder) > 0
                 AND jFolder @> to_jsonb(bm."nBundleid"))
          )

        UNION ALL

        SELECT c."nBundleid", c."cBundlename", c."nParentBundleid"
        FROM "BundleMaster" c
        JOIN bdl_tree p
          ON c."nParentBundleid" = p."nBundleid"
        LEFT JOIN "BMPermission" bp
          ON bp."nBundleid" = c."nBundleid"
         AND bp."nUserid" = nMasterid
        WHERE COALESCE(bp."nBMPid",'00000000-0000-0000-0000-000000000000'::uuid)
              = '00000000-0000-0000-0000-000000000000'::uuid
    ),

    --------------------------------------------------
    -- FINAL FILE SET
    --------------------------------------------------
    final_data AS (
        SELECT bd."nBundledetailid"
        FROM "BundleDetail" bd
        JOIN bdl_tree t ON t."nBundleid" = bd."nBundleid"
        LEFT JOIN "BDPermission" bp
          ON bp."nBundledetailid" = bd."nBundledetailid"
         AND bp."nUserid" = nMasterid
        WHERE COALESCE(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid)
              = '00000000-0000-0000-0000-000000000000'::uuid

        UNION

        SELECT bd."nBundledetailid"
        FROM "BundleDetail" bd
        JOIN "BDAssignment" ba ON ba."nBundledetailid" = bd."nBundledetailid"
        JOIN bdl_tree p ON ba."nBundleid" = p."nBundleid"
        LEFT JOIN "BDPermission" bp
          ON bp."nBundledetailid" = bd."nBundledetailid"
         AND bp."nUserid" = nMasterid
        WHERE COALESCE(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid)
              = '00000000-0000-0000-0000-000000000000'::uuid

        UNION

        SELECT bd."nBundledetailid"
        FROM "BundleDetail" bd
        LEFT JOIN "BDPermission" bp
          ON bp."nBundledetailid" = bd."nBundledetailid"
         AND bp."nUserid" = nMasterid
        WHERE COALESCE(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid)
              = '00000000-0000-0000-0000-000000000000'::uuid
          AND bd."nSectionid" = nSectionid
          AND (
                (jsonb_array_length(jFolder) = 0
                 AND jsonb_array_length(jFiles) = 0
                 AND bd."nBundleid" IS NULL)
             OR (jsonb_array_length(jFiles) > 0
                 AND jFiles @> to_jsonb(bd."nBundledetailid"))
          )
    )

    SELECT array_agg("nBundledetailid" ORDER BY "nBundledetailid")
    INTO batch_ids
    FROM final_data;

    --------------------------------------------------
    -- FIND EXISTING PROCESS
    --------------------------------------------------
    SELECT pb."nDPid"
    INTO nDPid
    FROM download."ProcessBatchs" pb
    JOIN download."ProcessMaster" pm
      ON pm."nDPid" = pb."nDPid"
    WHERE pm."cStatus" NOT IN ('E','F')
      AND pm."nCaseid" = nCaseid
      AND pm."nSectionid" = nSectionid
      AND COALESCE(pm."isHyperlink",false) = false
    GROUP BY pb."nDPid"
    HAVING COUNT(DISTINCT pb."nBundledetailid") = cardinality(batch_ids)
       AND bool_and(pb."nBundledetailid" = ANY(batch_ids))
    LIMIT 1;

    IF FOUND THEN
        isExistingJob := true;
    ELSE
        INSERT INTO download."ProcessMaster"
            ("nCaseid","nSectionid","nCreateId","jFiles","jFolders","isHyperlink")
        VALUES
            (nCaseid,nSectionid,nMasterid,jFiles,jFolder,isHyperlink)
        RETURNING "nDPid" INTO nDPid;

        INSERT INTO download."ProcessStatusLogs"
            ("nDPid","cStatus","dLogDt")
        VALUES
            (nDPid,'Q',NOW());
    END IF;

    --------------------------------------------------
    -- RESPONSE
    --------------------------------------------------
    IF isExistingJob
       AND (SELECT "nCreateId"
            FROM download."ProcessMaster"
            WHERE "nDPid" = nDPid) = nMasterid THEN

        OPEN ref FOR
        SELECT -1 AS msg,
               CASE WHEN "cStatus" = 'C'
                    THEN 'Already Downloaded.'
                    ELSE 'Download Already Inprocess'
               END AS value,
               nDPid AS "nDPid",
               isExistingJob AS "isExistingJob"
        FROM download."ProcessMaster"
        WHERE "nDPid" = nDPid;

    ELSE
        INSERT INTO download."Users"
            ("nDPid","nUserid","dCreateDt")
        VALUES
            (nDPid,nMasterid,NOW());

        IF isExistingJob THEN
            OPEN ref FOR
            SELECT 1 AS msg,
                   CASE WHEN "cStatus" = 'C'
                        THEN 'Already Downloaded.'
                        ELSE 'Download Already Inprocess'
                   END AS value,
                   nDPid AS "nDPid",
                   isExistingJob AS "isExistingJob"
            FROM download."ProcessMaster"
            WHERE "nDPid" = nDPid;
        ELSE
            OPEN ref FOR
            SELECT 1 AS msg,
                   'Download Process Started' AS value,
                   nDPid AS "nDPid",
                   isExistingJob AS "isExistingJob";
        END IF;
    END IF;

    RETURN ref;
END;
$$;

-- ===== download.et_insert_download_process_files(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION download.et_insert_download_process_files(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$

declare nUserid uuid;nCaseid uuid;nSectionid uuid;
-- jFolders uuid[];jFiles uuid[];
jFolders jsonb;jFiles jsonb;
cFilename text;
nDPid uuid;totalFiles int;
cFoldertype text;

BEGIN

/*

 select * from download.et_insert_download_process_files ('{"nCaseid":1131,"nSectionid":9350,"nMasterid":377}','r1');fetch all in "r1";

select * From download."ProcessMaster"
select * From download."Options"
select * From download."Users"

select * from download."ProcessBatchs"

alter table download."ProcessBatchs" add column "cFilename" character varying(500)

*/
 nDPid := parameter ->>'nDPid';
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;

-- jFolders := parameter ->>'jFolders';
-- jFiles := parameter ->>'jFiles';

jFolders := coalesce((parameter ->>'jFolders')::jsonb,'[]'::jsonb);
jFiles := coalesce((parameter ->>'jFiles')::jsonb,'[]'::jsonb);

-- alter table download."ProcessBatchs" add column "isFileExists"

-- select * from download.et_insert_download_process_files ('{"nCaseid":1131,"nSectionid":9350,"nMasterid":377,"nDPid":2}','r1');fetch all in "r1";

cFilename := (select REGEXP_REPLACE("cCasename", '[^a-zA-Z0-9 ]', '', 'g') from "CaseMaster" where "nCaseid" = nCaseid);
/*
	if(array_length(jFolders,1) = 1) then
		cFilename := (select REGEXP_REPLACE("cBundlename", '[^a-zA-Z0-9 ]', '', 'g') from "BundleMaster" where "nBundleid" = any(jFolders));
	end if;
*/

	SELECT "cFoldertype" INTO cFoldertype
    FROM "SectionMaster"
    WHERE "nSectionid" = nSectionid;

	if(jsonb_array_length(jFolders) = 1) then
		cFilename := (select REGEXP_REPLACE("cBundlename", '[^a-zA-Z0-9 ]', '', 'g') from "BundleMaster" where jFolders @> to_jsonb("nBundleid"));
	end if;

-- select * From download."ProcessBatchs"
		WITH RECURSIVE bdl_tree AS (
            SELECT bm."nBundleid", bm."cBundlename"::text AS "cBundlename", bm."nParentBundleid",
                bm."cBundlename"::text AS sub_info, bm."nSectionid", bm."cBundletag"
            FROM "BundleMaster" bm
			join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
			left join "BMPermission" bp on bm."nBundleid" = bp."nBundleid" and bp."nUserid" = nUserid
            WHERE  coalesce(bp."nBMPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid  --  bp."nBMPid" is null
			/*  and CASE  WHEN
		 array_length(jFolders::uuid[], 1) IS NULL and array_length(jFiles::uuid[], 1) IS NULL THEN  bm."nParentBundleid" is null
		ELSE bm."nBundleid" = ANY(jFolders::uuid[])
			END */
			AND (
          -- when client asked “all” (no folders/files) we start at root
          (jsonb_array_length(jFolders) = 0 AND jsonb_array_length(jFiles) = 0
            AND bm."nParentBundleid" IS NULL)
          -- otherwise only the explicit folder list
          OR (jFolders IS NOT NULL and jsonb_array_length(jFolders) > 0
            AND jFolders @> to_jsonb(bm."nBundleid"))
        )

			AND sm."nCaseid" = nCaseid AND bm."nSectionid" = nSectionid
            UNION ALL
            SELECT c."nBundleid", c."cBundlename", c."nParentBundleid",
                p.sub_info || ' / ' || c."cBundlename"::text, c."nSectionid", c."cBundletag"
            FROM "BundleMaster" c
            JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"
			left join "BMPermission" bp on c."nBundleid" = bp."nBundleid" and bp."nUserid" = nUserid
			WHERE  coalesce(bp."nBMPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid  -- bp."nBMPid" is null
        ),final_data as (
	  SELECT t."nBundledetailid",t."cPath",t."foldername",t."cFilename"
        FROM (
            SELECT cFilename "filename",bd."nBundledetailid",(case when coalesce(bd."cTab",'') !='' then  bd."cTab" || ' ' else '' end) || left(REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '')::text,150) || (case when (upper("cFilename") like '%.' || upper("cFiletype")) = false  then ('.' || lower("cFiletype")) else '' end) AS "cFilename", p.sub_info Foldername,"cPath"
            FROM "BundleDetail" bd
			LEFT JOIN "BDAssignment" ba ON ba."nBundledetailid" = bd."nBundledetailid" and case when cFoldertype = 'CB' then true else false end
            JOIN bdl_tree p ON p."nBundleid" = case when cFoldertype != 'CB' then bd."nBundleid" else  ba."nBundleid" end
			left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
			WHERE  coalesce(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid -- bp."nBDPid" is null
        ) t
 		 union all
			SELECT bd."nBundledetailid","cPath",'/' as Foldername,(case when coalesce(bd."cTab",'') !='' then  bd."cTab" || ' ' else '' end) || left(REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '')::text,150) || (case when (upper("cFilename") like '%.' || upper("cFiletype")) = false  then ('.' || lower("cFiletype")) else '' end) AS "cFilename"
    	    FROM "BundleDetail" bd
			LEFT JOIN "BDAssignment" ba ON ba."nBundledetailid" = bd."nBundledetailid" and case when cFoldertype = 'CB'  then true else false end
			left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
   	      WHERE  coalesce(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid -- bp."nBDPid" is null
			 and case when cFoldertype != 'CB' then bd."nSectionid" else  ba."nSectionid" end = nSectionid
			/* and   CASE WHEN array_length(jFolders::uuid[], 1) IS NULL and array_length(jFiles::uuid[], 1) IS NULL THEN   bd."nBundleid" is null
			when array_length(jFiles::uuid[], 1) is not null then bd."nBundledetailid" = ANY(jFiles::uuid[]) and not exists (select * from "bdl_tree" bt where bt."nBundleid" = bd."nBundleid")	ELSE false end
			*/
			 and   CASE WHEN jsonb_array_length(jFolders) = 0 and jsonb_array_length(jFiles) = 0 THEN
	  coalesce(bd."nBundleid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid
		when jsonb_array_length(jFiles) > 0 then jFiles @> to_jsonb(bd."nBundledetailid") and not exists (select * from "bdl_tree" bt where bt."nBundleid" = bd."nBundleid")	ELSE false end
		)
		insert into download."ProcessBatchs" ("nDPid","nBundledetailid","cPath","foldername","cFilename","nSerial")
		select distinct nDPid,f."nBundledetailid",f."cPath",f."foldername",f."cFilename",
   			 ROW_NUMBER() OVER (
     			 ORDER BY f."nBundledetailid"
   			 )

		from final_data f;



select  count("nBundledetailid") into totalFiles from download."ProcessBatchs" where "nDPid" = nDPid;

open ref for select 1 as msg,'Download Process Started' as value,nDPid as "nDPid",totalFiles as "totalFiles"

;



RETURN ref;                                                       -- Return the cursor to the caller
    END;
$$;

-- ===== download.et_insert_download_process_files_hyperlink(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION download.et_insert_download_process_files_hyperlink(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $_$

declare nUserid uuid;nCaseid uuid;nSectionid uuid;
-- jFolders uuid[];jFiles uuid[];
jFolders jsonb;jFiles jsonb;
cFilename text;
nDPid uuid;totalFiles int;
cFoldertype text;

BEGIN

/*

 select * from download.et_insert_download_process_files ('{"nCaseid":1131,"nSectionid":9350,"nMasterid":377}','r1');fetch all in "r1";

select * From download."ProcessMaster"
select * From download."Options"
select * From download."Users"

select * from download."ProcessBatchs"

alter table download."ProcessBatchs" add column "cFilename" character varying(500)

*/
 nDPid := parameter ->>'nDPid';
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;

-- jFolders := parameter ->>'jFolders';
-- jFiles := parameter ->>'jFiles';

jFolders := coalesce((parameter ->>'jFolders')::jsonb,'[]'::jsonb);
jFiles := coalesce((parameter ->>'jFiles')::jsonb,'[]'::jsonb);

-- alter table download."ProcessBatchs" add column "isFileExists"

-- select * from download.et_insert_download_process_files ('{"nCaseid":1131,"nSectionid":9350,"nMasterid":377,"nDPid":2}','r1');fetch all in "r1";

cFilename := (select REGEXP_REPLACE("cCasename", '[^a-zA-Z0-9 ]', '', 'g') from "CaseMaster" where "nCaseid" = nCaseid);
/*
	if(array_length(jFolders,1) = 1) then
		cFilename := (select REGEXP_REPLACE("cBundlename", '[^a-zA-Z0-9 ]', '', 'g') from "BundleMaster" where "nBundleid" = any(jFolders));
	end if;
*/

	SELECT "cFoldertype" INTO cFoldertype
    FROM "SectionMaster"
    WHERE "nSectionid" = nSectionid;

	if(jsonb_array_length(jFolders) = 1) then
		cFilename := (select REGEXP_REPLACE("cBundlename", '[^a-zA-Z0-9 ]', '', 'g') from "BundleMaster" where jFolders @> to_jsonb("nBundleid"));
	end if;

-- select * From download."ProcessBatchs"
		WITH RECURSIVE bdl_tree AS (
            SELECT bm."nBundleid", bm."cBundlename"::text AS "cBundlename", bm."nParentBundleid",
                bm."cBundlename"::text AS sub_info, bm."nSectionid", bm."cBundletag"
            FROM "BundleMaster" bm
			join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
			left join "BMPermission" bp on bm."nBundleid" = bp."nBundleid" and bp."nUserid" = nUserid
            WHERE  coalesce(bp."nBMPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid  --  bp."nBMPid" is null
			/*  and CASE  WHEN
		 array_length(jFolders::uuid[], 1) IS NULL and array_length(jFiles::uuid[], 1) IS NULL THEN  bm."nParentBundleid" is null
		ELSE bm."nBundleid" = ANY(jFolders::uuid[])
			END */
			AND (
          -- when client asked “all” (no folders/files) we start at root
          (jsonb_array_length(jFolders) = 0 AND jsonb_array_length(jFiles) = 0
            AND bm."nParentBundleid" IS NULL)
          -- otherwise only the explicit folder list
          OR (jFolders IS NOT NULL and jsonb_array_length(jFolders) > 0
            AND jFolders @> to_jsonb(bm."nBundleid"))
        )

			AND sm."nCaseid" = nCaseid AND bm."nSectionid" = nSectionid
            UNION ALL
            SELECT c."nBundleid", c."cBundlename", c."nParentBundleid",
                p.sub_info || ' / ' || c."cBundlename"::text, c."nSectionid", c."cBundletag"
            FROM "BundleMaster" c
            JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"
			left join "BMPermission" bp on c."nBundleid" = bp."nBundleid" and bp."nUserid" = nUserid
			WHERE  coalesce(bp."nBMPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid  -- bp."nBMPid" is null
        ),final_data as (
	  SELECT t."nBundledetailid",t."cPath",t."foldername",t."cFilename"
        FROM (
			with tm as (
			            SELECT cFilename "filename",bd."nBundledetailid",(case when coalesce(bd."cTab",'') !='' then  bd."cTab" || ' ' else '' end) || left(REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '')::text,150) || (case when (upper("cFilename") like '%.' || upper("cFiletype")) = false  then ('.' || lower("cFiletype")) else '' end) AS "cFilename", p.sub_info ||  '/' || (CASE  WHEN COALESCE(bd."cTab", '') != '' THEN COALESCE(bd."cTab", '')   ELSE left(regexp_replace(bd."cFilename", '\.[^.]*$', ''),100)  END) || '/' Foldername,"cPath"
			            FROM "BundleDetail" bd
						LEFT JOIN "BDAssignment" ba ON ba."nBundledetailid" = bd."nBundledetailid" and case when cFoldertype = 'CB' then true else false end
						JOIN bdl_tree p ON p."nBundleid" = case when cFoldertype != 'CB' then bd."nBundleid" else  ba."nBundleid" end
			            -- JOIN bdl_tree p ON bd."nBundleid" = p."nBundleid"
						left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
						WHERE  coalesce(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid -- bp."nBDPid" is null
			)
				select "nBundledetailid","cPath",Foldername,"cFilename" from tm
			union all
				SELECT DISTINCT bd."nBundledetailid",bd."cPath", COALESCE(tm.Foldername, '') || 'hyperlink doc/' as Foldername,(CASE  WHEN upper(bd."cFilename") LIKE ('%' || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$'))))  THEN regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') ELSE  regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$')))
						END) AS "cFilename" from "HyperLink" h
					join tm on tm."nBundledetailid" = h."nBundledetailid"
					join "Annotations" a on h."nHLid" = a."nHLid"
					join "BundleDetail" bd on bd."nBundledetailid" = NULLIF(rects[0]->>'bundledetailid','')::uuid
					where  bd."cStatus" ='C'
        ) t



 		 union all
		  SELECT t."nBundledetailid",t."cPath",t."foldername",t."cFilename" from
					( with tm as (SELECT bd."nBundledetailid","cPath",'/' ||  (CASE  WHEN COALESCE(bd."cTab", '') != '' THEN COALESCE(bd."cTab", '')   ELSE left(regexp_replace(bd."cFilename", '\.[^.]*$', ''),100)  END) || '/' as Foldername,(case when coalesce(bd."cTab",'') !='' then  bd."cTab" || ' ' else '' end) || left(REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '')::text,150) || (case when (upper("cFilename") like '%.' || upper("cFiletype")) = false  then ('.' || lower("cFiletype")) else '' end) AS "cFilename"
		    	    FROM "BundleDetail" bd

					LEFT JOIN "BDAssignment" ba ON ba."nBundledetailid" = bd."nBundledetailid" and case when cFoldertype = 'CB'  then true else false end
					left join "BDPermission" bp on bd."nBundledetailid" = bp."nBundledetailid" and bp."nUserid" = nUserid
		   	      WHERE  coalesce(bp."nBDPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid -- bp."nBDPid" is null
					  and case when cFoldertype != 'CB' then bd."nSectionid" else  ba."nSectionid" end = nSectionid
					/* and   CASE WHEN array_length(jFolders::uuid[], 1) IS NULL and array_length(jFiles::uuid[], 1) IS NULL THEN   bd."nBundleid" is null
					when array_length(jFiles::uuid[], 1) is not null then bd."nBundledetailid" = ANY(jFiles::uuid[]) and not exists (select * from "bdl_tree" bt where bt."nBundleid" = bd."nBundleid")	ELSE false end
					*/
					 and   CASE WHEN jsonb_array_length(jFolders) = 0 and jsonb_array_length(jFiles) = 0 THEN
			  coalesce(bd."nBundleid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid
				when jsonb_array_length(jFiles) > 0 then jFiles @> to_jsonb(bd."nBundledetailid") and not exists (select * from "bdl_tree" bt where bt."nBundleid" = bd."nBundleid")	ELSE false end)
					select "nBundledetailid","cPath",Foldername,"cFilename" from tm
				union all
				SELECT DISTINCT bd."nBundledetailid",bd."cPath",COALESCE(tm.Foldername, '') || 'hyperlink doc/' as Foldername, (CASE  WHEN upper(bd."cFilename") LIKE ('%' || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$'))))  THEN regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') ELSE  regexp_replace(bd."cFilename", '[\/\\\""\''''\:?\<\>\n\r]', '', 'g') || ('.' || upper(substring(bd."cPath" FROM '.*\.([^.]+)$')))
								END) AS "cFilename" from "HyperLink" h
							join tm on tm."nBundledetailid" = h."nBundledetailid"
							join "Annotations" a on h."nHLid" = a."nHLid"
							join "BundleDetail" bd on bd."nBundledetailid" = NULLIF(rects[0]->>'bundledetailid','')::uuid
							where bd."cStatus" ='C') t

		)
		insert into download."ProcessBatchs" ("nDPid","nBundledetailid","cPath","foldername","cFilename","nSerial")
		select nDPid,f."nBundledetailid",f."cPath",f."foldername",f."cFilename",
   			 ROW_NUMBER() OVER (
     			 ORDER BY f."nBundledetailid"
   			 )

		from final_data f;



select  count("nBundledetailid") into totalFiles from download."ProcessBatchs" where "nDPid" = nDPid;

open ref for select 1 as msg,'Download Process Started' as value,nDPid as "nDPid",totalFiles as "totalFiles"

;



RETURN ref;                                                       -- Return the cursor to the caller
    END;
$_$;

-- ===== download.et_process_retry(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION download.et_process_retry(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$

declare
nDPid uuid;

BEGIN

/*

select * from download.et_process_retry('{"nDPid":1}','r');fetch all in "r"

 select * from download.et_process_retry('{"nDPid":"1a9ba0f6-7e30-4501-8dbb-89a2e0ba4064","nSectionid":9425,"nMasterid":59}','r');fetch all in "r";

select * From download."ProcessMaster"
 select * From download."ProcessStatusLogs" where "nDPid" = '1a9ba0f6-7e30-4501-8dbb-89a2e0ba4064'
*/

nDPid := NULLIF(parameter ->>'nDPid','')::uuid;

update download."ProcessMaster" set "cStatus" = 'R' where "nDPid" = nDPid;

insert into download."ProcessStatusLogs"("nDPid","cStatus","dLogDt")
values(nDPid,'R',now());

open ref for
select 1 as msg,'Retried job' as value;

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$$;

-- ===== download.et_update_process_status(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION download.et_update_process_status(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$

declare nDPid uuid;cStatus text;nMasterid uuid;dStartDt timestamp;

BEGIN

nDPid := parameter ->> 'nDPid';
cStatus := parameter ->> 'cStatus';

/*

select * from download.et_update_process_status('{}','r');fetch all in "r"
 select * from download.et_update_process_status ('{"nDPid":"4507d890-5ab0-4adf-84f8-25f13f1b8475","cStatus":"C"}','r1');fetch all in "r1";
select * From download."ProcessStatusLogs"

select * From download."ProcessMaster" order by "dCreateDt"

alter table download."ProcessMaster" add column "dStartDt" timestamp

"dStartDt"
"dEndDt"

update "ProcessMaster" set "cStatus" = 'E' where "nCaseid" = 'b33c9fc9-2512-46b7-8770-2e71c685fb15' and "cStatus" = 'C'

*/

nDPid := NULLIF(parameter ->>'nDPid','')::uuid;

update download."ProcessMaster" set "cStatus" = cStatus,"dLastUpdateDt" = now(),
"dStartDt" = case when cStatus = 'C' then now() else "dStartDt" end
where "nDPid" = nDPid
returning "nCreateId","dStartDt" into nMasterid,dStartDt;

if(nDPid is not null)then
	insert into download."ProcessStatusLogs"("nDPid","cStatus","dLogDt")
	values(nDPid,cStatus,now());
end if;

open ref for select 1 as msg,'Status Updated' as value,nMasterid as "nMasterid",dStartDt as "dStartDt"

;

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$$;

-- ===== public.et_admin_bundles_filetypes(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_admin_bundles_filetypes(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$
DECLARE
    nMasterid     uuid := (parameter ->> 'nMasterid')::uuid;
    nCaseid       uuid := (parameter ->> 'nCaseid')::uuid;
    nSectionid    uuid := (parameter ->> 'nSectionid')::uuid;

    cFoldertype   TEXT;
    contentType   TEXT := COALESCE(parameter ->> 'contentType', 'All');
    cSearch       TEXT := parameter ->> 'cSearch';

    jFilter       JSONB := COALESCE((parameter ->> 'jFilter')::jsonb, '[]'::jsonb);
    jFTypes       JSONB := '[]'::jsonb;
    jIssues       JSONB;
    jImpact       JSONB;
    jRelevance    JSONB;
    jMarkup       JSONB;
    nBundleid     uuid;
	cLocation 	  text;
searchName text;
    ts_query      TSQUERY;
start_dt date;end_dt date;

	jFileFilter jsonb default '[]'::jsonb;
	filter_string text;filter_condition text;
	sql_query text;
	nStarttabid uuid;nEndtabid uuid;
BEGIN

    nStarttabid := coalesce((parameter ->>'nStarttabid')::uuid, null);
    nEndtabid := coalesce((parameter ->>'nEndtabid')::uuid, null);
    -- Normalize contentType
    contentType := CASE contentType
        -- WHEN 'cBundletag'  THEN 'cTab'
        WHEN 'cName'       THEN 'cFilename'
        WHEN 'cDescription' THEN 'cDesc'
        ELSE contentType
    END;



 	BEGIN
	 	select t.start_date,t.end_date into start_dt,end_dt from  try_convert_to_dates(cSearch) t;
		end_dt = case when start_dt is not null and end_dt is null then start_dt else end_dt end;
	EXCEPTION WHEN OTHERS THEN
            start_dt := NULL;
            end_dt := NULL;
	END;

    -- Extract filters only if search is applied

    cSearch  := coalesce((jFilter ->> 'cSearch'),'');
	jFileFilter := coalesce((jFilter->>'fileFilter')::jsonb,'[]'::jsonb);
        jFTypes    := COALESCE((jFilter ->> 'jFTypes')::jsonb, '[]'::jsonb);
        jIssues    := COALESCE((jFilter ->> 'jIssues')::jsonb, '[]'::jsonb);
        jImpact    := COALESCE((jFilter ->> 'jImpact')::jsonb, '[]'::jsonb);
        jRelevance := COALESCE((jFilter ->> 'jRelevance')::jsonb, '[]'::jsonb);
        jMarkup    := COALESCE((jFilter ->> 'jMarkup')::jsonb, '[]'::jsonb);
		cLocation := coalesce((jFilter->>'cLocation'),'')::text;
   		 searchName    = coalesce((jFilter->>'cMatchCase'),'')::text;
    IF COALESCE(cSearch, '') != '' THEN
	    nBundleid   := COALESCE((jFilter->>'nBundleid')::uuid, '00000000-0000-0000-0000-000000000000');
	else
		nBundleid := COALESCE((parameter->>'nBundleid')::uuid, '00000000-0000-0000-0000-000000000000');
    END IF
	;

	filter_string := (select filter_whereclause_2(jFileFilter,'FILES'));

	IF jsonb_array_length(jFileFilter::jsonb) > 0 THEN
	    filter_condition := 'incomming_links AS (
						select l."nBundledetailid",f."nUserid" from "FactMaster" f
						join "FMLinks" l on l."nFSid" = f."nFSid"
						where f."nUserid" = ''' || nMasterid || '''::uuid
							union all
						select l."nBundledetailid",d."nUserid" from "DocMaster" d
						join "DMLinks" l on l."nDocid" = d."nDocid"
						where d."nUserid" = ''' || nMasterid || '''::uuid
				),filter AS (
                    select cr."nBundledetailid"
                    from cr
                    left join "FactMaster" f on cr."nBundledetailid" = f."nBundledetailid" and f."nUserid" = ''' || nMasterid || '''::uuid
					left join "FactDetail" d on d."nFSid" = f."nFSid"
					left join "BDTasks" bt on bt."nBundledetailid" = cr."nBundledetailid" and bt."nUserid" = ''' || nMasterid || '''::uuid
					left JOIN "FMContact" fc ON f."nFSid" = fc."nFSid"
                    left join "FMTasks" ft on ft."nFSid" = f."nFSid"
                    left join "TaskDetail" td on td."nTaskid" = ft."nTaskid" or td."nTaskid" =  bt."nTaskid"
                    LEFT join "FMIssue" fi on fi."nFSid" = ft."nFSid" or fi."nFSid" = f."nFSid"
                    LEFT join "RIssueMaster" i on i."nIid" = fi."nIssueid"
                    LEFT JOIN "IssueCategory" im ON im."nICid" = i."nICid"
                    LEFT join "TaskShared" ts on ts."nTaskid" = ft."nTaskid"
					left join "DocMaster" idl on idl."nBundledetailid" = cr."nBundledetailid" and idl."nUserid" = ''' || nMasterid || '''::uuid
					left join "FMLinks" ofl on ofl."nFSid" = f."nFSid"
					left join incomming_links ifs on ifs."nBundledetailid" = cr."nBundledetailid"
					where (' || filter_string || ') and
					(f."nUserid" = ''' || nMasterid || '''::uuid or bt."nUserid" = ''' || nMasterid || '''::uuid  or idl."nUserid" = ''' || nMasterid || '''::uuid or ifs."nBundledetailid" = cr."nBundledetailid" or (' || jsonb_array_length(jFileFilter) || ' = 1  and '''|| (jFileFilter[0]->>'name') || ''' = ''DATE'' ))

                    group by cr."nBundledetailid"
                ), filterdata AS (
	        SELECT cr.*
	          FROM cr1 cr
			  left join "BDContacts" bc on bc."nBundledetailid" = cr."nBundledetailid" and bc."nUserid" = '''|| nMasterid ||'''
	          CROSS JOIN filter
	         WHERE filter."nBundledetailid" = cr."nBundledetailid"
	    )
	    ';
	ELSE
	    filter_condition := 'filterdata AS (
	        SELECT cr.*
	          FROM cr1 cr
	    )
	    ';
	END IF;


	raise notice 'Filter % ,filter_condition %',filter_string,filter_condition;
    -- Get folder type
    SELECT "cFoldertype" INTO cFoldertype
    FROM "SectionMaster"
    WHERE "nSectionid" = nSectionid;

    -- Build full-text ts_query
    SELECT array_to_string(
        ARRAY(
            SELECT LOWER(TRIM(word)) || ':*'
            FROM unnest(string_to_array(regexp_replace(cSearch, '[^a-zA-Z0-9]+', ' ', 'g'), ' ')) AS word
            WHERE LENGTH(TRIM(word)) > 0
        ), ' & '
    ) INTO ts_query;

cSearch := REPLACE(coalesce(cSearch,''), '''', '''''');
    RAISE NOTICE 'cSearch - % searchName - %', cSearch, searchName;
    sql_query := '
	 with tsquery as (select to_tsquery( array_to_string( ARRAY(
	      SELECT lower(trim(word)) || '':*'' FROM unnest( string_to_array(regexp_replace('''|| coalesce(cSearch::text,'') ||''',''[^a-zA-Z0-9]+'','' '',''g''),'' '')) AS word WHERE length(trim(word)) > 0),'' & '')) ts
	),
    cr_bundle AS (
        SELECT DISTINCT b."nBundledetailid", b."cFiletype",b."nBundleid",b.start_date,b.sorted_tab
        FROM "BundleDetail" b
        LEFT JOIN "BDPermission" bp ON bp."nUserid" = ''' || nMasterid ||''' AND bp."nBundledetailid" = b."nBundledetailid"
		 left join "BundleMaster" bm on bm."nBundleid" = b."nBundleid"
        JOIN "SectionMaster" s ON s."nSectionid" =  b."nSectionid"
		cross join tsquery
        WHERE s."nCaseid" = '''|| nCaseid ||'''
          AND b."cStatus" = ''C''
          AND coalesce(bp."nBDPid",null) is not  distinct from null -- IS NULL
          AND (''' || nSectionid ||'''::uuid = ''00000000-0000-0000-0000-000000000000''::uuid OR s."nSectionid" = ''' || nSectionid ||'''::uuid)
		  and case when jsonb_array_length(coalesce('''|| jFTypes ||''',''[]''::jsonb)) > 0 then coalesce('''|| jFTypes ||''',''[]''::jsonb)::jsonb @> to_jsonb("cFiletype") else true end
          AND (
              CASE
                   WHEN '''|| cLocation || ''' = ''T'' and coalesce('''|| nBundleid ||''',''00000000-0000-0000-0000-000000000000''::uuid) != ''00000000-0000-0000-0000-000000000000''::uuid THEN
                      b."nBundleid" = '''|| nBundleid ||'''
                  WHEN '''|| coalesce(cSearch::text,'') ||''' IS NULL OR '''|| coalesce(cSearch::text,'') ||''' = '''' THEN
                     coalesce(b."nBundleid",''00000000-0000-0000-0000-000000000000''::uuid) = COALESCE('''|| nBundleid ||''', ''00000000-0000-0000-0000-000000000000''::uuid)
                  ELSE TRUE
              END
          )
          AND (
              COALESCE('''|| searchName ||''', '''') = '''' OR COALESCE('''|| coalesce(cSearch::text,'') ||''', '''') = '''' OR
              (
                CASE
                    WHEN ''' || contentType ||''' = ''All'' THEN
                       ( CASE '''|| searchName ||'''
                            WHEN ''S'' THEN
                                LOWER(b."cFilename") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
                                LOWER(b."cTab") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
                                LOWER(b."cExhibitno") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
                                LOWER(b."cDesc") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
			 					 LOWER(b."cAuthor")  LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
                                LOWER(b."dIntrestDt") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
                            WHEN ''E'' THEN
                                trim(LOWER(b."cFilename")) = trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text))
							  OR LOWER(b."cTab") =  trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text))
							  OR LOWER(b."cExhibitno") =  trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text))
							  OR LOWER(b."cDesc") =  trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text))
							  OR LOWER(b."cAuthor") =  trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text))
							  OR LOWER(b."dIntrestDt") = trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text))
                            ELSE
                                ((
								(tsv_tab @@ tsquery.ts ) OR (tsv_filename @@ tsquery.ts ) OR (tsv_exhibit @@ tsquery.ts ) OR (tsv_desc @@ tsquery.ts ) OR (tsv_author @@ tsquery.ts )
   )
								or
                LOWER(COALESCE(b."cTab", '''')) || '' '' || LOWER(b."cFilename") || '' '' || LOWER(COALESCE(b."cExhibitno", '''')) || '' '' || LOWER(COALESCE(b."cDesc", '''')) || '' '' ||  LOWER(COALESCE(b."cAuthor", ''''))  ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')

									or  (case when ((''' || contentType ||''' = ''All'' or ''' || contentType ||'''  = ''dIntrestDt'') and '''|| searchName ||''' = ''C'') and  '''|| coalesce(start_dt::text,'') ||'''::text !='''' and COALESCE(b."start_date"::text, ''1001-01-02'') != '''' then
 coalesce(b."start_date",''1001-01-02'')::date >= coalesce('''|| coalesce(start_dt::text,'') ||'''::text,''1001-01-01'')::date and b."end_date"::date <=coalesce('''|| coalesce(end_dt::text,'') ||''',''1001-01-02'')::date else false end )
 )
                        END)
                    ELSE
                        (
CASE ''' || contentType ||'''
    WHEN ''cTab'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cTab") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cTab") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
                tsv_tab @@ tsquery.ts
				or
                LOWER(COALESCE(b."cTab", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cFilename'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cFilename") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cFilename") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE

				tsv_filename @@ tsquery.ts
				or
                LOWER(COALESCE(b."cFilename", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cExhibitno'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cExhibitno") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cExhibitno") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_exhibit @@ tsquery.ts
				or
                LOWER(COALESCE(b."cExhibitno", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cDesc'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cDesc") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cDesc") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_desc @@ tsquery.ts
				or
                LOWER(COALESCE(b."cDesc", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cAuthor'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cAuthor") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cAuthor") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_author @@ tsquery.ts
				or
                LOWER(COALESCE(b."cAuthor", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
		when ''cBundletag'' then
			 CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bm."cBundletag") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bm."cBundletag") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_bundletag @@ tsquery.ts
				or
                LOWER(COALESCE(bm."cBundletag", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    ELSE TRUE -- fallback
END
						)
                END
              )
          )
    ), cr_assign as(
        SELECT DISTINCT b."nBundledetailid", b."cFiletype",ba."nBundleid",b.start_date,b.sorted_tab
        FROM "BundleDetail" b
        LEFT JOIN "BDPermission" bp ON bp."nUserid" = ''' || nMasterid ||''' AND bp."nBundledetailid" = b."nBundledetailid"
        LEFT JOIN "BDAssignment" ba ON ba."nBundledetailid" = b."nBundledetailid"
		 left join "BundleMaster" bm on bm."nBundleid" = b."nBundleid"
        JOIN "SectionMaster" s ON s."nSectionid" = ba."nSectionid"
		cross join tsquery
        WHERE s."nCaseid" = '''|| nCaseid ||'''
          AND b."cStatus" = ''C''
          AND coalesce(bp."nBDPid",null) is not  distinct from null -- IS NULL
          AND (coalesce(''' || nSectionid ||''',''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid OR s."nSectionid" = ''' || nSectionid ||''')
		  and case when jsonb_array_length(coalesce('''|| jFTypes ||''',''[]''::jsonb)) > 0 then coalesce('''|| jFTypes ||''',''[]''::jsonb)::jsonb @> to_jsonb("cFiletype") else true end
          AND (
              CASE
                   WHEN '''|| cLocation || ''' = ''T'' and coalesce('''|| nBundleid ||''',''00000000-0000-0000-0000-000000000000''::uuid) != ''00000000-0000-0000-0000-000000000000''::uuid THEN
                      ba."nBundleid" = '''|| nBundleid ||'''
                  WHEN '''|| coalesce(cSearch::text,'') ||''' IS NULL OR '''|| coalesce(cSearch::text,'') ||''' = '''' THEN
                    COALESCE(ba."nBundleid", ''00000000-0000-0000-0000-000000000000''::uuid) = COALESCE('''|| nBundleid ||''', ''00000000-0000-0000-0000-000000000000''::uuid)::uuid
                  ELSE TRUE
              END
          )
          AND (
              COALESCE('''|| searchName ||''', '''') = '''' OR COALESCE('''|| coalesce(cSearch::text,'') ||''', '''') = '''' OR
              (
                CASE
                    WHEN ''' || contentType ||''' = ''All'' THEN
                       ( CASE '''|| searchName ||'''
                            WHEN ''S'' THEN
                                LOWER(b."cFilename") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
                                LOWER(b."cTab") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
                                LOWER(b."cExhibitno") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
                                LOWER(b."cDesc") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
			 					 LOWER(b."cAuthor")  LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%'' OR
                                LOWER(b."dIntrestDt") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
                            WHEN ''E'' THEN
                                trim(LOWER(b."cFilename")) = trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text))
							  OR LOWER(b."cTab") =  trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text))
							  OR LOWER(b."cExhibitno") =  trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text))
							  OR LOWER(b."cDesc") =  trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text))
							  OR LOWER(b."cAuthor") =  trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text))
							  OR LOWER(b."dIntrestDt") = trim(LOWER('''|| coalesce(cSearch::text,'') ||'''::text))
                            ELSE
                                ((
								(tsv_tab @@ tsquery.ts ) OR (tsv_filename @@ tsquery.ts ) OR (tsv_exhibit @@ tsquery.ts ) OR (tsv_desc @@ tsquery.ts ) OR (tsv_author @@ tsquery.ts )
   )
								or
                LOWER(COALESCE(b."cTab", '''')) || '' '' || LOWER(b."cFilename") || '' '' || LOWER(COALESCE(b."cExhibitno", '''')) || '' '' || LOWER(COALESCE(b."cDesc", '''')) || '' '' ||  LOWER(COALESCE(b."cAuthor", ''''))  ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')

									or  (case when ((''' || contentType ||''' = ''All'' or ''' || contentType ||'''  = ''dIntrestDt'') and '''|| searchName ||''' = ''C'') and  '''|| coalesce(start_dt::text,'') ||'''::text !='''' and COALESCE(b."start_date"::text, ''1001-01-02'') != '''' then
 coalesce(b."start_date",''1001-01-02'')::date >= coalesce('''|| coalesce(start_dt::text,'') ||'''::text,''1001-01-01'')::date and b."end_date"::date <=coalesce('''|| coalesce(end_dt::text,'') ||''',''1001-01-02'')::date else false end )
 )
                        END)
                    ELSE
                        (
CASE ''' || contentType ||'''
    WHEN ''cTab'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cTab") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cTab") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
                tsv_tab @@ tsquery.ts
				or
                LOWER(COALESCE(b."cTab", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cFilename'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cFilename") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cFilename") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE

				tsv_filename @@ tsquery.ts
				or
                LOWER(COALESCE(b."cFilename", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cExhibitno'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cExhibitno") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cExhibitno") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_exhibit @@ tsquery.ts
				or
                LOWER(COALESCE(b."cExhibitno", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cDesc'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cDesc") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cDesc") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_desc @@ tsquery.ts
				or
                LOWER(COALESCE(b."cDesc", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cAuthor'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(b."cAuthor") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(b."cAuthor") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_author @@ tsquery.ts
				or
                LOWER(COALESCE(b."cAuthor", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
		when ''cBundletag'' then
			 CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bm."cBundletag") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bm."cBundletag") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_bundletag @@ tsquery.ts
				or
                LOWER(COALESCE(bm."cBundletag", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    ELSE TRUE -- fallback
END
						)
                END
              )
          )
    ),childOrder as (
		select * from cr_bundle
		union all
		select * from cr_assign
	), cr AS (
			SELECT ROW_NUMBER() OVER (ORDER BY b.sorted_tab) AS serial, b.*
			FROM childOrder b
	),ranges AS (
        SELECT
            MAX(CASE WHEN ' ||
            CASE WHEN nStarttabid IS NULL THEN 'false'
                ELSE '"nBundledetailid" = ''' || nStarttabid || '''::uuid'
            END || ' THEN serial END) AS s_serial,
            MAX(CASE WHEN ' ||
            CASE WHEN nEndtabid IS NULL THEN 'false'
                ELSE '"nBundledetailid" = ''' || nEndtabid || '''::uuid'
            END || ' THEN serial END) AS e_serial
        FROM cr
    ),

    fct AS (
        SELECT f."nFSid", f."nBundledetailid", i."nIssueid", i."nImpactid", i."nRelevanceid", f."cFType"
        FROM "FactMaster" f
        JOIN "FMIssue" i ON i."nFSid" = f."nFSid"
        JOIN cr ON cr."nBundledetailid" = f."nBundledetailid"
        WHERE f."nUserid" = ''' || nMasterid ||'''
          AND (
			(case when jsonb_array_length(coalesce('''|| jIssues ||''',''[]''::jsonb)) > 0 then
            coalesce('''|| jIssues ||''',''[]''::jsonb) @> to_jsonb(i."nIssueid") else true end)
			and
			(case when jsonb_array_length(coalesce('''|| jMarkup ||''',''[]''::jsonb)) > 0 then
            coalesce('''|| jMarkup ||''',''[]''::jsonb) @> to_jsonb(ARRAY[f."cFType"]) else true end) and
			case when  (jsonb_array_length(coalesce('''|| jMarkup ||''',''[]''::jsonb)) >0) then  coalesce('''|| jMarkup ||''',''[]''::jsonb)  @> to_jsonb(ARRAY[f."cFType"]) else true end
and case when ( jsonb_array_length(coalesce('''|| jImpact ||''',''[]''::jsonb))  >0) then coalesce('''|| jImpact ||''',''[]''::jsonb) @> to_jsonb(i."nImpactid") else true end and case when (jsonb_array_length(coalesce(''' || jRelevance ||''',''[]''::jsonb)) > 0) then coalesce(''' || jRelevance ||''',''[]''::jsonb) @> to_jsonb(i."nRelevanceid") else true end

          )
    ),

    doc AS (
        SELECT d."nDocid", d."nBundledetailid"
        FROM "DocMaster" d
        JOIN cr ON cr."nBundledetailid" = d."nBundledetailid"
        WHERE d."nUserid" = ''' || nMasterid ||''' AND coalesce('''|| jMarkup ||''',''[]''::jsonb) @> to_jsonb(ARRAY[''D''])
    ),

    web AS (
        SELECT w."nWebid", w."nBundledetailid"
        FROM "WebMaster" w
        JOIN cr ON cr."nBundledetailid" = w."nBundledetailid"
        WHERE w."nUserid" = ''' || nMasterid ||''' AND coalesce('''|| jMarkup ||''',''[]''::jsonb) @> to_jsonb(ARRAY[''W''])
    ),

   cr1 AS (
    SELECT DISTINCT cr.*
    FROM cr
    WHERE case when (
        jsonb_array_length(coalesce('''|| jIssues ||''',''[]''::jsonb)) > 0 OR
        jsonb_array_length(coalesce('''|| jImpact ||''',''[]''::jsonb)) > 0 OR
        jsonb_array_length(coalesce(''' || jRelevance ||''',''[]''::jsonb)) > 0 OR
        jsonb_array_length(coalesce('''|| jMarkup ||''',''[]''::jsonb)) > 0
    )
	    then (
	        EXISTS (
	            SELECT 1 FROM fct f WHERE f."nBundledetailid" = cr."nBundledetailid"
	        ) OR
	        EXISTS (
	            SELECT 1 FROM doc d WHERE d."nBundledetailid" = cr."nBundledetailid"
	        ) OR
	        EXISTS (
	            SELECT 1 FROM web w WHERE w."nBundledetailid" = cr."nBundledetailid"
	        )
	    ) else true end
	),' || filter_condition ||' ,

    cr2 AS (
        SELECT COUNT(DISTINCT b."nBundledetailid") AS "nTotal",
               COALESCE(b."cFiletype", ''Other'') AS "cFiletype" --,string_agg(distinct "nBundleid"::text,'','') bundles
        FROM filterdata  b
		CROSS JOIN ranges
		WHERE (ranges.s_serial IS NULL OR (case when (ranges.e_serial IS NULL OR ranges.s_serial < ranges.e_serial) then b.serial >= ranges.s_serial else b.serial >= ranges.e_serial end)) AND (ranges.e_serial IS NULL OR (case when (ranges.s_serial IS NULL OR ranges.s_serial < ranges.e_serial) then b.serial <= ranges.e_serial else b.serial <= ranges.s_serial end) )
        GROUP BY "cFiletype"
    )

    SELECT SUM("nTotal") AS "nTotal", ''ALL'' AS "cFiletype" --,(''[''||string_agg(distinct bundles,'','')||'']'')::text "jBundles"
    FROM cr2
    HAVING COUNT(*) > 1
	 UNION ALL
	 SELECT "nTotal","cFiletype" --,(''['' || string_agg(bundles,'','') || '']'')::text "jBundles"
	 FROM cr2 group by "nTotal","cFiletype"
';

    --
	RAISE notice 'sql_query: %', sql_query;
	OPEN ref FOR execute sql_query;

    RETURN ref;
END;
$$;

-- ===== public.et_admin_case_getdetail(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_admin_case_getdetail(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$

declare nUserid uuid;nCaseid uuid;
isPresent boolean = false;
nPresentid uuid;
nSesid text;

BEGIN

nUserid := NULLIF(parameter->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter->>'nCaseid','')::uuid;

 select "nSesid"::text into nSesid From "RSessionMaster" where "nCaseid" = nCaseid and "dCreatedt"::date=now()::date and  "cStatus" ='R' order by "dCreatedt" desc limit  1;

if exists(select 1 from present."PresentationMaster" p join present."PMUser" pm on pm."nPresentid" = p."nPresentid"
 where "nCaseid" = nCaseid and p."cStatus" = 'L' and "nUserid" = nUserid and pm."cStatus" = 'A') then
    isPresent = true;

    select p."nPresentid" into nPresentid from present."PresentationMaster" p join present."PMUser" pm on pm."nPresentid" = p."nPresentid"
 where "nCaseid" = nCaseid and p."cStatus" = 'L' and "nUserid" = nUserid and pm."cStatus" = 'A';
 end if;

open ref for
select 1 as msg,"nCaseid","cCasename","cCaseno","cClaimant","cRespondent","cTClaimant","cTRespondent","cIndexheader","cDesc","cTranscriptMode","bHideBundleColumn",isPresent "isPresent",nPresentid "nPresentid",nSesid "nSesid"
from "CaseMaster" where "nCaseid" = nCaseid;

 RETURN ref;
    END;
$$;

-- ===== public.et_admin_insertupdate_case(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_admin_insertupdate_case(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$
DECLARE
    nUserid       uuid;
    nCaseid       uuid;
    cCasename     text;
    cDesc         text;
    permission    text;
    cCaseno       text;
    cClaimant     text;
    cRespondent   text;
    cTClaimant    text;
    cTRespondent  text;
    cIndexheader  text;
    nICid         uuid;
BEGIN
    nUserid      := NULLIF(parameter ->> 'nMasterid','')::uuid;
    nCaseid      := NULLIF(parameter ->> 'nCaseid','')::uuid;
    cCasename    :=  parameter ->> 'cCasename';
    cDesc        :=  parameter ->> 'cDesc';
    permission   :=  parameter ->> 'permission';
    cCaseno      :=  parameter ->> 'cCaseno';
    cClaimant    :=  parameter ->> 'cClaimant';
    cRespondent  :=  parameter ->> 'cRespondent';
    cTClaimant   :=  parameter ->> 'cTClaimant';
    cTRespondent :=  parameter ->> 'cTRespondent';
    cIndexheader :=  parameter ->> 'cIndexheader';

    IF permission = 'N' THEN
        IF NOT EXISTS (
            SELECT *
              FROM "UserMaster"
             WHERE "nUserid" = nUserid
               AND "isAdmin" = true
        ) THEN
            OPEN ref FOR
                SELECT -1 as msg, 'Admin rights required' as value;
        ELSE
            IF NOT EXISTS (
                SELECT 1
                  FROM "CaseMaster"
                 WHERE upper("cCasename") = upper(cCasename)
                    OR upper("cCaseno")   = upper(cCaseno)
            ) THEN
                INSERT INTO "CaseMaster"(
                    "cCasename","dCreateDt","nCreateId","cDesc","cCaseno",
                    "cClaimant","cRespondent","cTClaimant","cTRespondent","cIndexheader",
                    "cTranscriptMode"
                )
                VALUES(
                    cCasename, now(), nUserid, cDesc, cCaseno,
                    cClaimant, cRespondent, cTClaimant, cTRespondent, cIndexheader,
                    'HTML'
                )
                RETURNING "nCaseid" INTO nCaseid;

                INSERT INTO "TeamMaster"(
                    "cTeamname","dCreateDt","nCreateId","nCaseid","cFlag","cClr"
                )
                SELECT
                    "cCodename", now(), nUserid, nCaseid,
                    COALESCE(("jOther"->>'flag')::text, ''),
                    ("jOther"->>'cClr')::text
                  FROM "Codemaster"
                 WHERE "nCategoryid" = 11
              ORDER BY "nSerialno";

                INSERT INTO "SectionMaster"(
                    "cFolder","cIcon","nCaseid","nUserid","cFoldertype","cMsg"
                )
                SELECT
                    "cCodename", "jOther"->>'icon', nCaseid, NULL,
                    "jOther"->>'cFlag', ("jOther"->>'cMsg')::text
                  FROM "Codemaster"
                 WHERE "nCategoryid" = 13
                   AND ("jOther"->>'cFlag')::text IN ('MB','TS')
              ORDER BY "nSerialno";

                INSERT INTO "IssueCategory"(
                    "nCaseid","cCategory","nUserid","dCreateDt","cICtype"
                )
                VALUES(
                    nCaseid, 'Unassigned',
                    null,
                    now(), 'U'
                )
                RETURNING "nICid" INTO nICid;

                INSERT INTO "RIssueMaster"(
                    "cIName","cColor","nICid","nUserid","dCreatedt","nCaseid"
                )
                VALUES(
                    'Unassigned', 'FFA94D',
                    nICid,
                    null,
                    now(), nCaseid
                );

                insert into "RolePermission" ("nPMid","cType","nCaseid","nRoleid","dModifydt")
                select "nPMid",'R',nCaseid,r."nRoleid",now() from "RoleMaster" r
                join "PermissionDefault" pd on pd."nRoleid" = r."nRoleid" where "bStatus" = false ;

                OPEN ref FOR
                    SELECT 1 as msg, 'Case Created' as value, "nCaseid"
                      FROM "CaseMaster"
                     WHERE "nCaseid" = nCaseid;

                INSERT INTO public."LogCaseMaster"(
                    "nLCatid","nCaseid","cCasename","cCaseno","nMasterid"
                )
                SELECT
                    7, "nCaseid", "cCasename", "cCaseno", nUserid
                  FROM "CaseMaster"
                 WHERE "nCaseid" = nCaseid;
            ELSE
                OPEN ref FOR
                    SELECT -1 as msg, 'Case already exists' as value;
            END IF;
        END IF;
    END IF;

    IF permission = 'E' THEN
        IF EXISTS (
            SELECT 1
              FROM "TeamRelation" t
             WHERE t."nCaseid" = nCaseid
               AND t."nUserid" = nUserid
               AND t."nRoleid" = '8632ee5c-e854-411c-b83d-c21656ad39ac'::uuid
            UNION
            SELECT 1
              FROM "UserMaster"
             WHERE "nUserid" = nUserid
               AND "isAdmin" = true
        ) THEN
            IF NOT EXISTS (
                SELECT 1
                  FROM "CaseMaster"
                 WHERE (
                       upper("cCasename") = upper(cCasename)
                    OR upper("cCaseno")   = upper(cCaseno)
                   )
                   AND "nCaseid" <> nCaseid
            ) THEN
                UPDATE "CaseMaster"
                   SET "cCasename"  = cCasename,
                       "cCaseno"    = cCaseno,
                       "cDesc"      = cDesc,
                       "cClaimant"  = cClaimant,
                       "cRespondent"= cRespondent,
                       "cTClaimant" = cTClaimant,
                       "cTRespondent"= cTRespondent,
                       "cIndexheader"= cIndexheader,
                       "dUpdateDt"  = now(),
                       "nUpdateId"  = nUserid
                 WHERE "nCaseid"   = nCaseid;

                OPEN ref FOR
                    SELECT 1 as msg, 'Case updated' as value, "nCaseid"
                      FROM "CaseMaster"
                     WHERE "nCaseid" = nCaseid;
            ELSE
                OPEN ref FOR
                    SELECT -1 as msg, 'Case already exists' as value;
            END IF;

            INSERT INTO public."LogCaseMaster"(
                "nLCatid","nCaseid","cCasename","cCaseno","nMasterid"
            )
            SELECT
                8, "nCaseid", "cCasename", "cCaseno", nUserid
              FROM "CaseMaster"
             WHERE "nCaseid" = nCaseid;
        ELSE
            OPEN ref FOR
                SELECT -1 as msg, 'Admin rights required' as value;
        END IF;
    END IF;

    RETURN ref;
END;
$$;

-- ===== public.et_admin_sections(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_admin_sections(parameter json, ref1 refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$
declare nMasterid UUID; nCaseid UUID;
BEGIN

nMasterid := (parameter ->>'nMasterid')::UUID;
nCaseid := (parameter ->>'nCaseid')::UUID;
/*
 select * from et_admin_sections('{"nMasterid":59,"nCaseid":22}','r1');FETCH All in "r1";
 -- select * From "SectionMaster"
 */
    -- select * from "SectionMaster"
OPEN ref1 FOR
select "nSectionid","cFolder","cFoldertype"
from "SectionMaster" where "nCaseid" = nCaseid and "nUserid" IS NULL
order by "nSectionid";

RETURN NEXT ref1;




END;
$$;

-- ===== public.et_admindashboard(json, refcursor, refcursor, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_admindashboard(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$
declare nMasterid UUID; pageNumber int; offsetCount int; perPage int default 10; jCases jsonb;
allcases UUID[];
cSearch text;
BEGIN

nMasterid := (parameter ->>'nMasterid')::UUID;
cSearch := parameter ->>'cSearch';
pageNumber := coalesce((parameter ->>'pageNumber')::int, 1);
offsetCount := (pageNumber - 1) * perPage;

/*
 select * from et_admindashboard('{"nMasterid":10,"pageNumber":1,"cSearch":"text"}','r1','r2','r3');FETCH All in "r1";
 FETCH All in "r2";
 FETCH All in "r3";
 select * from "TicketMaster"
*/

allcases = (array (
     select "nCaseid" from "CaseMaster"
    where "isArchived" = false
    and upper("cCasename" || "cCaseno") like ('%' || upper(cSearch) || '%')
    order by coalesce("dUpdateDt","dCreateDt") desc --select distinct "nCaseid" From "TeamRelation" --where "nUserid" = nMasterid
        LIMIT perPage
        OFFSET offsetCount
));


    OPEN ref1 FOR
    select c."nCaseid",c."cCasename",c."cCaseno",c."dUpdateDt",count(t."nTicketid")::int as "nTotaltickets"
    FROM "CaseMaster" c
    left join "TicketMaster" t on t."nCaseid" = c."nCaseid" and t."isCleared" = false
    where c."nCaseid" = ANY(allcases)
    group by c."nCaseid",c."cCasename",c."cCaseno",c."dUpdateDt"
    order by c."dUpdateDt" desc
    ;

    RETURN NEXT ref1;




    OPEN ref2 FOR
    SELECT t."nTeamid", t."cTeamname", t."nCaseid"
    FROM "TeamMaster" t
    -- JOIN "TeamRelation" tr ON tr."nTeamid" = t."nTeamid"
    where t."nCaseid" = ANY(allcases)
    GROUP BY t."nTeamid", t."cTeamname", t."nCaseid";

    RETURN NEXT ref2;




    OPEN ref3 FOR



     SELECT jsonb_agg(DISTINCT t."nTeamid") AS "teams", u."cFname", u."cLname", u."cProfile",t."nRoleid"
    FROM "TeamRelation" t
    JOIN "UserMaster" u ON u."nUserid" = t."nUserid"
    where t."nCaseid" = ANY(allcases)
    GROUP BY u."cFname", u."cLname", u."cProfile",t."nRoleid";

     RETURN NEXT ref3;

END;
$$;

-- ===== public.et_bundledetail(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_bundledetail(parameter json, ref1 refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$
declare
    nMasterid uuid;
    pageNumber int;
    offsetCount int;
    perPage int default 30;
    nSectionid uuid;
    nBundleid uuid;
    explicit_null boolean := false;
    last_nBundledetailid uuid;
    cFiletype text;
    cSortby text;
    cSorttype text;
    sql_query text;
    isAdmin boolean default false;
    cFoldertype text;
	nStarttabid uuid;nEndtabid uuid;
	jFilter jsonb default '[]'::jsonb;
	filter_string text := '';
	filter_condition text := '';
	jFTypes jsonb default '[]'::jsonb;
BEGIN
-- select * from public.et_bundledetail_test ('{"nSectionid":"e38b6eff-b7dc-43cb-a4f5-8253e696dec6","nBundleid":"b111023e-078c-47f4-bbf8-3a07ae037e10","pageNumber":1,"cSearch":"","cFiletype":"ALL","cSortby":"cTab","cSorttype":"ASC","nStarttabid":null,"nEndtabid":null,"jFilter":"[{\"name\":\"LINK\",\"type\":\"V\",\"value\":[\"I\"]}]","nMasterid":"ba561c55-81f5-4180-8934-2ce6dcaa096c"}','r1');fetch all in "r1";

    nMasterid := (parameter ->>'nMasterid')::uuid;
    pageNumber := coalesce((parameter ->>'pageNumber')::int, 1);
    offsetCount := (pageNumber - 1) * perPage;

    IF parameter::jsonb ? 'nBundleid' AND parameter->>'nBundleid' IS NULL THEN
        explicit_null := true;
        nBundleid := NULL;
    ELSE
        nBundleid := (parameter ->>'nBundleid')::uuid;
    END IF;

    nSectionid := (parameter ->>'nSectionid')::uuid;
    last_nBundledetailid := (parameter ->>'last_nBundledetailid')::uuid;
    cFiletype := parameter ->>'cFiletype';
    cSortby := coalesce((parameter ->>'cSortby'), 'cTab');
    cSorttype := coalesce((parameter ->>'cSorttype'), 'ASC');
    nStarttabid := coalesce((parameter ->>'nStarttabid')::uuid, null);
    nEndtabid := coalesce((parameter ->>'nEndtabid')::uuid, null);
	jFilter := coalesce((parameter->>'jFilter')::jsonb,'[]'::jsonb);
	jFTypes := coalesce((parameter->>'jFTypes')::jsonb,'[]'::jsonb);

    cSortby := case when cSortby = 'cBundletag' then 'cTab' else cSortby end;

    filter_condition := 'filterdata AS (
        SELECT cr.*
        FROM cr
    )';

	RAISE NOTICE 'jFilter - %',jFilter;



    IF jsonb_array_length(jFilter) > 0 THEN
        BEGIN
            filter_string := (select filter_whereclause_2(jFilter,'FILES'));

            IF filter_string IS NOT NULL AND filter_string != '' THEN
                filter_condition := 'incomming_links AS (
						select l."nBundledetailid",f."nUserid" from "FactMaster" f
						join "FMLinks" l on l."nFSid" = f."nFSid"
						where f."nUserid" = ''' || nMasterid || '''::uuid
							union all
						select l."nBundledetailid",d."nUserid" from "DocMaster" d
						join "DMLinks" l on l."nDocid" = d."nDocid"
						where d."nUserid" = ''' || nMasterid || '''::uuid
				),filter AS (
                    select cr."nBundledetailid"
                    from cr
                    left join "FactMaster" f on cr."nBundledetailid" = f."nBundledetailid" and f."nUserid" = ''' || nMasterid || '''::uuid
					left join "FactDetail" d on d."nFSid" = f."nFSid"
					left join "BDTasks" bt on bt."nBundledetailid" = cr."nBundledetailid" and bt."nUserid" = ''' || nMasterid || '''::uuid
					left JOIN "FMContact" fc ON f."nFSid" = fc."nFSid"
                    left join "FMTasks" ft on ft."nFSid" = f."nFSid"
                    left join "TaskDetail" td on td."nTaskid" = ft."nTaskid" or td."nTaskid" =  bt."nTaskid"
                    LEFT join "FMIssue" fi on fi."nFSid" = ft."nFSid" or fi."nFSid" = f."nFSid"
                    LEFT join "RIssueMaster" i on i."nIid" = fi."nIssueid"
                    LEFT JOIN "IssueCategory" im ON im."nICid" = i."nICid"
                    LEFT join "TaskShared" ts on ts."nTaskid" = ft."nTaskid"
					left join "DocMaster" idl on idl."nBundledetailid" = cr."nBundledetailid" and idl."nUserid" = ''' || nMasterid || '''::uuid
					left join "FMLinks" ofl on ofl."nFSid" = f."nFSid"
					left join incomming_links ifs on ifs."nBundledetailid" = cr."nBundledetailid"
					where (' || filter_string || ') and
					(f."nUserid" = ''' || nMasterid || '''::uuid or bt."nUserid" = ''' || nMasterid || '''::uuid  or idl."nUserid" = ''' || nMasterid || '''::uuid or ifs."nBundledetailid" = cr."nBundledetailid" or (' || jsonb_array_length(jFilter) || ' = 1  and '''|| (jFilter[0]->>'name') || ''' = ''DATE'' ))

                    group by cr."nBundledetailid"
                ),
                filterdata AS (
                    SELECT cr.*
                    FROM cr
                    JOIN filter ON filter."nBundledetailid" = cr."nBundledetailid"
                )';
            END IF;
        EXCEPTION WHEN OTHERS THEN
        END;
    END IF;

    raise notice 'Filter % ,filter_condition %, explicit_null: %, nBundleid: %',
                 filter_string, filter_condition, explicit_null, nBundleid;
    select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nMasterid;

    sql_query := '
    WITH ar AS (
        SELECT bd."nBundledetailid", bd."nBundleid", bd."cFilename" AS "cName", bd."cTab", bd."cExhibitno",bm."cBundletag",sorted_tab,bd.sorted_name,sorted_page,sorted_exhibitno,start_date, sorted_intrestdt,sorted_description,sorted_author,
               bd."cPage", bd."cRefpage", bd."cFilesize", bd."cFiletype", bd."dIntrestDt", bd."cDesc" AS "cDescription", bd."cIsindex",bd."cAuthor",bd."cPage" "cPageRange"
        FROM "BundleDetail" bd
        LEFT JOIN "BDPermission" bp ON bp."nUserid" = ''' || nMasterid || '''::uuid AND bp."nBundledetailid" = bd."nBundledetailid"
		left join "BundleMaster" bm on bd."nBundleid" = bm."nBundleid"
        WHERE bd."nSectionid" = ''' || nSectionid || '''::uuid
          AND ' || CASE WHEN explicit_null THEN '
		  coalesce(bd."nBundleid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid
		  '
                    WHEN nBundleid IS NULL THEN '1=1'
                    ELSE 'bd."nBundleid" = ''' || nBundleid || '''::uuid'
               END || '
          AND (CASE
                  WHEN COALESCE(''' || cFiletype || ''', ''ALL'') = ''ALL'' THEN TRUE
                  WHEN COALESCE(''' || cFiletype || ''', ''ALL'') = ''Other'' THEN COALESCE(bd."cFiletype", '''') = ''''
                  ELSE bd."cFiletype" = ''' || cFiletype || '''
               END)
          AND bd."cStatus" = ''C'' and
		  coalesce("nBDPid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid

    ), assign AS (
        SELECT distinct bd."nBundledetailid", ba."nBundleid", bd."cFilename" AS "cName", bd."cTab", bd."cExhibitno",bmd."cBundletag",
		sorted_tab,bd.sorted_name,sorted_page,sorted_exhibitno,start_date,sorted_intrestdt,sorted_description,sorted_author,
               bd."cPage", bd."cRefpage", bd."cFilesize", bd."cFiletype", bd."dIntrestDt", bd."cDesc" AS "cDescription", bd."cIsindex",bd."cAuthor",
			   coalesce(ba."cPage",bd."cPage") "cPageRange"
        FROM "BundleDetail" bd
        JOIN "BDAssignment" ba ON ba."nBundledetailid" = bd."nBundledetailid" AND "nUserid" = ''' || nMasterid || '''::uuid
        LEFT JOIN "BDPermission" bp ON bp."nUserid" = ''' || nMasterid || '''::uuid AND bp."nBundledetailid" = bd."nBundledetailid"
		left join "BundleMaster" bm on ba."nBundleid" = bm."nBundleid"
        left join "BundleMaster" bmd on bmd."nBundleid" = bd."nBundleid"
        WHERE coalesce(bp."nBDPid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid
		AND
            ba."nSectionid" = ''' || nSectionid || '''::uuid AND ' ||
            CASE WHEN explicit_null THEN 'ba."nBundleid" is null'
                 WHEN nBundleid IS NULL THEN '1=1'
                 ELSE 'ba."nBundleid" = ''' || nBundleid || '''::uuid'
            END || '
            AND (CASE
                    WHEN COALESCE(''' || cFiletype || ''', ''ALL'') = ''ALL'' THEN TRUE
                    WHEN COALESCE(''' || cFiletype || ''', ''ALL'') = ''Other'' THEN COALESCE(bd."cFiletype", '''') = ''''
                    ELSE bd."cFiletype" = ''' || cFiletype || '''
                END)
            AND bd."cStatus" = ''C''
            AND case when ' || isAdmin ||' then true else
			coalesce("nBDPid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid
			end
    ), shared AS (
        SELECT bd."nBundledetailid", ba."nBundleid", bd."cFilename" AS "cName", bd."cTab", bd."cExhibitno",bm."cBundletag",
		sorted_tab,bd.sorted_name,sorted_page,sorted_exhibitno,start_date,sorted_intrestdt,sorted_description,sorted_author,
               bd."cPage", bd."cRefpage", bd."cFilesize", bd."cFiletype", bd."dIntrestDt", bd."cDesc" AS "cDescription", bd."cIsindex",bd."cAuthor",
			   coalesce(ba."cPage",bd."cPage") "cPageRange"

        FROM "BundleDetail" bd
        LEFT JOIN "BDAssignment" ba ON ba."nBundledetailid" = bd."nBundledetailid" AND ba."nSectionid" = ''' || nSectionid || '''::uuid
            AND ' ||
            CASE WHEN explicit_null THEN 'coalesce(ba."nBundleid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid'
                 WHEN nBundleid IS NULL THEN '1=1'
                 ELSE 'ba."nBundleid" = ''' || nBundleid || '''::uuid'
            END || ' AND "nUserid" != ''' || nMasterid || '''::uuid
        LEFT JOIN "BDShare" bs ON bs."nBundledetailid" = bd."nBundledetailid" AND bs."nUserid" = ''' || nMasterid || '''::uuid
            AND bs."nSectionid" = ''' || nSectionid || '''::uuid
		left join "BundleMaster" bm on ba."nBundleid" = bm."nBundleid"
        WHERE CASE WHEN exists (
            select 1 from "BDShare" bds
            where bds."nSectionid" = ''' || nSectionid || '''::uuid
            and bds."nUserid" = ''' || nMasterid || '''::uuid
            and coalesce(bds."nBundledetailid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid
            and coalesce(bds."nBundleid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid
            )
            then ba."nBundledetailid" = bd."nBundledetailid"
            WHEN ' || CASE WHEN explicit_null THEN 'true' ELSE 'false' END || '
            THEN bs."nBundledetailid" = bd."nBundledetailid"
            ELSE ' || CASE WHEN nBundleid IS NULL THEN ' ba."nBundleid" IS NULL '  ELSE ' ba."nBundleid" = ''' || nBundleid || '''::uuid ' END || '
            END
    ),

	 br AS (
        SELECT null::uuid AS "nBundledetailid", b."nBundleid", b."cBundlename" AS "cName", b."cBundletag" AS "cTab", '''' AS "cExhibitno",b."cBundletag",
		sorted_bundletag sorted_tab,b.sorted_name,null::text[] sorted_page,null::text[] sorted_exhibitno,''1901-01-01''::date start_date,null::text[] sorted_intrestdt,null::text[] sorted_description,null::text[] sorted_author
        FROM "BundleMaster" b
        LEFT JOIN "BDShare" bs ON coalesce(bs."nBundledetailid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid and bs."nBundleid" = b."nBundleid" AND bs."nUserid" = ''' || nMasterid || '''::uuid
            AND bs."nSectionid" = ''' || nSectionid || '''::uuid
        LEFT JOIN "BMPermission" p ON p."nUserid" = ''' || nMasterid || ''' AND p."nBundleid" = b."nBundleid"
        WHERE b."nSectionid" = ''' || nSectionid || ''' AND '|| case when nBundleid is null then  '
		coalesce(b."nParentBundleid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid'  else (' b."nParentBundleid" = ''' || nBundleid || '''' ) end   || ' AND CASE WHEN exists (
	            select 1 from "BDShare" bds
	            where bds."nSectionid" = ''' || nSectionid || '''::uuid
	            and bds."nUserid" = ''' || nMasterid || '''::uuid
	            and coalesce(bds."nBundledetailid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid
          		 and coalesce(bds."nBundleid",''00000000-0000-0000-0000-000000000000''::uuid) = ''00000000-0000-0000-0000-000000000000''::uuid
            ) then bs."nBundleid" = b."nBundleid"  else  b."nParentBundleid" is not null end
          AND CASE WHEN COALESCE(''' || cFiletype || ''', ''ALL'') = ''ALL'' THEN TRUE ELSE FALSE END
        AND CASE WHEN ' || isAdmin ||' THEN TRUE ELSE
		"nBMPid" IS NULL END
    ),

	cr AS (
        SELECT * FROM ar
        UNION ALL
        SELECT *, NULL AS "cPage", NULL AS "cRefpage", NULL AS "cFilesize", NULL AS "cFiletype",
               NULL AS "dIntrestDt", NULL AS "cDescription", FALSE AS "cIsindex",'''' "cAuthor",'''' "cPageRange"
        FROM br
        UNION ALL
        SELECT * FROM assign
        UNION ALL
        SELECT * FROM shared
    ), ' || filter_condition || ',
    childOrder AS (
        SELECT ROW_NUMBER() OVER (ORDER BY
           CASE ''' || cSortby || '''  WHEN ''dIntrestDt'' THEN start_date else null end ' || cSorttype || ',
        CASE ''' || cSortby || '''
            WHEN ''cTab'' THEN sorted_tab
            WHEN ''cName'' THEN cr.sorted_name
            WHEN ''cPage'' THEN sorted_page
            WHEN ''cExhibitno'' THEN sorted_exhibitno
            WHEN ''cDesc'' THEN sorted_description
            WHEN ''cAuthor'' THEN sorted_author
            WHEN ''cFiletype'' THEN ARRAY["cFiletype"]::TEXT[]
            ELSE sorted_tab
        END ' || cSorttype || ',cr.sorted_name) AS serial, cr.*
        FROM filterdata cr
    ),
    ranges AS (
        SELECT
            MAX(CASE WHEN ' ||
            CASE WHEN nStarttabid IS NULL THEN 'false'
                ELSE '"nBundledetailid" = ''' || nStarttabid || '''::uuid'
            END || ' THEN serial END) AS s_serial,
            MAX(CASE WHEN ' ||
            CASE WHEN nEndtabid IS NULL THEN 'false'
                ELSE '"nBundledetailid" = ''' || nEndtabid || '''::uuid'
            END || ' THEN serial END) AS e_serial
        FROM childOrder
    )
    SELECT ranges.s_serial,ranges.e_serial,"nBundledetailid","nBundleid","cName","cTab","cExhibitno","cBundletag",
           "cPage","cRefpage","cFilesize", "cFiletype","dIntrestDt","cDescription", "cIsindex","cAuthor","cPageRange"
    FROM childOrder CROSS JOIN ranges
    WHERE (ranges.s_serial IS NULL OR (case when (ranges.e_serial IS NULL OR ranges.s_serial < ranges.e_serial) then childOrder.serial >= ranges.s_serial else childOrder.serial >= ranges.e_serial end)) AND (ranges.e_serial IS NULL OR (case when (ranges.s_serial IS NULL OR ranges.s_serial < ranges.e_serial) then childOrder.serial <= ranges.e_serial else childOrder.serial <= ranges.s_serial end) )
    ORDER BY serial
    LIMIT ' || perPage || ' OFFSET ' || offsetCount || '
    ';

    raise notice 'sql_query length %', sql_query;

    IF sql_query IS NULL THEN
        RAISE EXCEPTION 'SQL query is NULL';
    END IF;

    OPEN ref1 FOR EXECUTE sql_query;
    RETURN NEXT ref1;

END;
$$;

-- ===== public.et_bundledetail_search(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_bundledetail_search(parameter json, ref1 refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$
declare nMasterid uuid;pageNumber  int;offsetCount  int;perPage int default 30;nSectionid uuid;nBundleid uuid;last_nBundledetailid uuid;cFiletype text;
cSortby text;cSorttype text;
    sql_query text;cSearch text;
contentType text;searchName text;
start_date date;end_date date;

jFTypes jsonb default '[]'::jsonb;
jFilter jsonb default '[]'::jsonb;
jIssues jsonb;jImpact jsonb;jRelevance jsonb;jMarkup jsonb;
cLocation text;

	jFileFilter jsonb default '[]'::jsonb;
	filter_string text;filter_condition text;
searchedBundles jsonb;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','00000000-0000-0000-0000-000000000000')::uuid;
pageNumber := coalesce( (parameter ->>'pageNumber')::int ,1);
offsetCount := (pageNumber - 1) * perPage;
nBundleid := NULLIF(parameter ->>'nBundleid','00000000-0000-0000-0000-000000000000')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','00000000-0000-0000-0000-000000000000')::uuid;
last_nBundledetailid := NULLIF(parameter ->>'last_nBundledetailid','')::uuid;
cFiletype :=parameter ->>'cFiletype';
cSortby :=(parameter ->>'cSortby');
cSorttype :=coalesce((parameter ->>'cSorttype'),'ASC');

-- cSortby := case cSortby when 'cBundletag'  then 'cTab' when  'cTab' then 'similarity' else cSortby end;
cSearch := trim(parameter ->>'cSearch');

searchName:= parameter ->>'searchName';
contentType:= coalesce(parameter ->>'contentType','All');
cSorttype = case cSortby when 'similarity' then 'DESC' else cSorttype end;
jFilter := coalesce((parameter->>'jFilter')::jsonb,'[]'::jsonb);

	jFTypes := coalesce((jFilter->>'jFTypes')::jsonb,'[]'::jsonb);
	jIssues := coalesce((jFilter->>'jIssues')::jsonb,'[]'::jsonb);
	jImpact := coalesce((jFilter->>'jImpact')::jsonb,'[]'::jsonb);
	jRelevance := coalesce((jFilter->>'jRelevance')::jsonb,'[]'::jsonb);
	jMarkup := coalesce((jFilter->>'jMarkup')::jsonb,'[]'::jsonb);
	cLocation:= coalesce((jFilter->>'cLocation'),'')::text;

	jFileFilter := coalesce((jFilter->>'fileFilter')::jsonb,'[]'::jsonb);

	nBundleid := coalesce((jFilter->>'nBundleid')::uuid,'00000000-0000-0000-0000-000000000000')::uuid;
	searchedBundles := coalesce((jFilter->>'searchedBundles')::jsonb,'[]'::jsonb);
	if(cLocation = 'T' and coalesce(nBundleid,'00000000-0000-0000-0000-000000000000')::uuid = '00000000-0000-0000-0000-000000000000'::UUID) then
		cLocation = 'A';
	end if;
	if(jsonb_array_length(searchedBundles) > 0 ) then
		 select t into searchedBundles from public.et_bundles_ids(parameter,searchedBundles::json) t;
	end if;

	searchedBundles := coalesce(searchedBundles::jsonb,'[]'::jsonb);
	raise notice 'searchedBundles %',searchedBundles;

--/*
 -- if(cFiletype !='ALL') then
cSearch := REPLACE(cSearch, '''', '''''');
contentType:=  case contentType when 'undefined'  then 'All' else contentType end;
-- contentType:=  case contentType when 'cBundletag'  then 'cTab' else contentType end;
contentType:= case contentType when 'cName' then 'cFilename' when 'cDescription' then 'cDesc' else contentType end;

 	BEGIN
	 	select t.start_date,t.end_date into start_date,end_date from  try_convert_to_dates(cSearch) t;
		end_date = case when start_date is not null and end_date is null then start_date else end_date end;
	EXCEPTION WHEN OTHERS THEN
            start_date := NULL;
            end_date := NULL;
	END;



 -- end if;


	filter_string := (select filter_whereclause_2(jFileFilter,'FILES'));

	IF jsonb_array_length(jFileFilter::jsonb) > 0 THEN
	    filter_condition := ' incomming_links AS (
						select l."nBundledetailid",f."nUserid" from "FactMaster" f
						join "FMLinks" l on l."nFSid" = f."nFSid"
						where f."nUserid" = ''' || nMasterid || '''::uuid
							union all
						select l."nBundledetailid",d."nUserid" from "DocMaster" d
						join "DMLinks" l on l."nDocid" = d."nDocid"
						where d."nUserid" = ''' || nMasterid || '''::uuid
				),filter AS (
                    select cr."nBundledetailid"
                    from cr
                    left join "FactMaster" f on cr."nBundledetailid" = f."nBundledetailid" and f."nUserid" = ''' || nMasterid || '''::uuid
					left join "BDTasks" bt on bt."nBundledetailid" = cr."nBundledetailid" and bt."nUserid" = ''' || nMasterid || '''::uuid
					left JOIN "FMContact" fc ON f."nFSid" = fc."nFSid"
                    left join "FMTasks" ft on ft."nFSid" = f."nFSid"
                    left join "TaskDetail" td on td."nTaskid" = ft."nTaskid" or td."nTaskid" =  bt."nTaskid"
                    LEFT join "FMIssue" fi on fi."nFSid" = ft."nFSid" or fi."nFSid" = f."nFSid"
                    LEFT join "RIssueMaster" i on i."nIid" = fi."nIssueid"
                    LEFT JOIN "IssueCategory" im ON im."nICid" = i."nICid"
                    LEFT join "TaskShared" ts on ts."nTaskid" = ft."nTaskid"
					left join "DocMaster" idl on idl."nBundledetailid" = cr."nBundledetailid" and idl."nUserid" = ''' || nMasterid || '''::uuid
					left join "FMLinks" ofl on ofl."nFSid" = f."nFSid"
					left join incomming_links ifs on ifs."nBundledetailid" = cr."nBundledetailid"
					where (' || filter_string || ') and
					(f."nUserid" = ''' || nMasterid || '''::uuid or bt."nUserid" = ''' || nMasterid || '''::uuid  or idl."nUserid" = ''' || nMasterid || '''::uuid or ifs."nBundledetailid" = cr."nBundledetailid" or (' || jsonb_array_length(jFileFilter) || ' = 1  and '''|| (jFileFilter[0]->>'name') || ''' = ''DATE'' ))

                    group by cr."nBundledetailid"
                ), filterdata AS (
	        SELECT cr.*
	          FROM cr1 cr
			  left join "BDContacts" bc on bc."nBundledetailid" = cr."nBundledetailid" and bc."nUserid" = '''|| nMasterid ||'''
	          CROSS JOIN filter
	         WHERE filter."nBundledetailid" = cr."nBundledetailid"
	    )
	    ';
	ELSE
	    filter_condition := 'filterdata AS (
	        SELECT cr.*
	          FROM cr1 cr
	    )
	    ';
	END IF;


-- select * from "BundleDetail" limit 20
	raise notice 'Filter % ,filter_condition %',filter_string,filter_condition;

 raise notice 'Start date % - end date %',start_date,end_date;

 sql_query := '

    with tsquery as (select to_tsquery( array_to_string( ARRAY(
      SELECT lower(trim(word)) || '':*'' FROM unnest( string_to_array(regexp_replace('''|| cSearch::text ||''',''[^a-zA-Z0-9]+'','' '',''g''),'' '')) AS word WHERE length(trim(word)) > 0),'' & '')) ts
),  ar AS (
        SELECT bd."nBundledetailid", bd."nBundleid", bd."cFilename" AS "cName", bd."cTab", bd."cExhibitno"
		,bm."cBundletag",sorted_tab,bd.sorted_name,sorted_page,sorted_exhibitno,sorted_intrestdt,sorted_description,sorted_author,bd.start_date
		,(case when
		(LOWER(COALESCE(bd."cTab", ''''))  ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'') or LOWER(bd."cFilename")   ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'') or LOWER(COALESCE(bd."cExhibitno", ''''))   ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'') or LOWER(COALESCE(bd."cDesc", ''''))   ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'') or LOWER(COALESCE(bd."cAuthor", ''''))  ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%''))
		then 0 when
		tsv_filename @@ tsquery.ts or tsv_tab @@ tsquery.ts or tsv_exhibit @@ tsquery.ts or tsv_desc @@ tsquery.ts or tsv_author @@ tsquery.ts
		then 0.01 else 0.1 end) similarity,
               bd."cPage", bd."cRefpage", bd."cFilesize", bd."cFiletype", bd."dIntrestDt", bd."cDesc" AS "cDescription",bd."cAuthor",bd."cPage" "cPageRange"

        FROM "BundleDetail" bd
        LEFT JOIN "BDPermission" bp ON bp."nUserid" = ''' || nMasterid || ''' AND bp."nBundledetailid" = bd."nBundledetailid"
		left join "BundleMaster" bm on bd."nBundleid" = bm."nBundleid"
		cross join tsquery
        WHERE bd."nSectionid" = ''' || nSectionid || ''' AND case when ''' || cLocation || ''' =  ''T''  then bd."nBundleid" = ''' || nBundleid || ''' else true end
		and case when jsonb_array_length(''' || jFTypes || '''::jsonb) > 0 then ''' || jFTypes || '''::jsonb @> to_jsonb("cFiletype") else true end
          AND (CASE
                  WHEN COALESCE(''' || cFiletype || ''', ''ALL'') = ''ALL'' THEN TRUE
                  WHEN COALESCE(''' || cFiletype || ''', ''ALL'') = ''Other'' THEN COALESCE(bd."cFiletype", '''') = ''''
                  ELSE bd."cFiletype" = ''' || cFiletype || '''
               END)
          AND bd."cStatus" = ''C''

		 AND (  case when ''' || contentType || ''' = ''All'' then (case '''|| searchName::text ||''' when ''S'' then
             LOWER(bd."cFilename") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''
			  OR LOWER(bd."cTab") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''
			  OR LOWER(bd."cExhibitno") ILIKE LOWER(''' || cSearch::text || ''') || ''%''
			  OR LOWER(bd."cDesc") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''
			  OR LOWER(bd."cAuthor") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''
			  OR LOWER(bd."dIntrestDt") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''
		   when ''E'' then
		     trim(LOWER(bd."cFilename")) = trim(LOWER(''' || cSearch::text || '''))
			  OR LOWER(bd."cTab") = trim(LOWER(''' || cSearch::text || '''))
			  OR LOWER(bd."cExhibitno") = trim(LOWER(''' || cSearch::text || '''))
			  OR LOWER(bd."cDesc") = trim(LOWER(''' || cSearch::text || '''))
			  OR LOWER(bd."cAuthor") = trim(LOWER(''' || cSearch::text || '''))
			  OR LOWER(bd."dIntrestDt") = trim(LOWER(''' || cSearch::text || '''))
			   else
					 (
   ((tsv_tab @@ tsquery.ts ) OR (tsv_filename @@ tsquery.ts ) OR (tsv_exhibit @@ tsquery.ts ) OR (tsv_desc @@ tsquery.ts ) OR (tsv_author @@ tsquery.ts ))

   or                 LOWER(COALESCE(bd."cTab", '''')) || '' '' || LOWER(bd."cFilename") || '' '' || LOWER(COALESCE(bd."cExhibitno", '''')) || '' '' || LOWER(COALESCE(bd."cDesc", '''')) || '' '' || LOWER(COALESCE(bd."cAuthor", ''''))  ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'')
	 )


		   end )

else
		  ( case '''|| searchName::text ||''' when ''S'' then
		   ( case when  ''' || contentType || ''' != ''cBundletag'' then
             LOWER(bd."'|| (case when contentType ='All' or contentType = 'cBundletag' then 'cFilename'  else contentType end) ||'") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''
			 else
			   LOWER(bm."cBundletag") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''
			 end)
		   when ''E''  then
		    ( case when  ''' || contentType || ''' != ''cBundletag'' then
		     trim(LOWER(bd."'|| (case when contentType ='All' or contentType = 'cBundletag' then 'cFilename' else contentType end) ||'")) = trim(LOWER(''' || cSearch::text || '''))
else
 trim(LOWER(bm."cBundletag")) = trim(LOWER(''' || cSearch::text || '''))
end)

			   else
			  (
CASE ''' || contentType ||'''
    WHEN ''cTab'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bd."cTab") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bd."cTab") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
                tsv_tab @@ tsquery.ts
				or
                LOWER(COALESCE(bd."cTab", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cFilename'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bd."cFilename") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bd."cFilename") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE

				tsv_filename @@ tsquery.ts
				or
                LOWER(COALESCE(bd."cFilename", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cExhibitno'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bd."cExhibitno") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bd."cExhibitno") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_exhibit @@ tsquery.ts
				or
                LOWER(COALESCE(bd."cExhibitno", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cDesc'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bd."cDesc") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bd."cDesc") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_desc @@ tsquery.ts
				or
                LOWER(COALESCE(bd."cDesc", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cAuthor'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bd."cAuthor") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bd."cAuthor") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_author @@ tsquery.ts
				or
                LOWER(COALESCE(bd."cAuthor", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
		when ''cBundletag'' then
			 CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bm."cBundletag") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bm."cBundletag") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_bundletag @@ tsquery.ts
				or
                LOWER(COALESCE(bm."cBundletag", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    ELSE TRUE -- fallback
END
						)
		   end)


end


  or
  (case when  (('''|| contentType ||''' = ''All'' or '''|| contentType ||''' = ''dIntrestDt'') and '''|| searchName::text ||'''  = ''C''  ) and ''' || coalesce(start_date::text,'') || ''' !='''' and COALESCE(bd."start_date"::text, '''') != '''' then
 coalesce(bd."start_date",''1001-01-02'')::date >= '''|| coalesce(start_date::text,'1001-01-01') ||'''::date and bd."end_date"::date <=coalesce('''|| coalesce(end_date,'1001-01-02') ||''',''1001-01-01'')::date else false end
              )
              )
    ),assign as(
select bd."nBundledetailid", ba."nBundleid", bd."cFilename" AS "cName", bd."cTab", bd."cExhibitno"
,bmd."cBundletag",sorted_tab,bd.sorted_name,sorted_page,sorted_exhibitno,sorted_intrestdt,sorted_description,sorted_author,bd.start_date,
(case when
		(LOWER(COALESCE(bd."cTab", ''''))  ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'') or LOWER(bd."cFilename")   ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'') or LOWER(COALESCE(bd."cExhibitno", ''''))   ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'') or LOWER(COALESCE(bd."cDesc", ''''))   ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'') or LOWER(COALESCE(bd."cAuthor", ''''))  ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%''))
		then 0 when
		tsv_filename @@ tsquery.ts or tsv_tab @@ tsquery.ts or tsv_exhibit @@ tsquery.ts or tsv_desc @@ tsquery.ts or tsv_author @@ tsquery.ts
		then 0.01 else 0.1 end) similarity,
               bd."cPage", bd."cRefpage", bd."cFilesize", bd."cFiletype", bd."dIntrestDt", bd."cDesc" AS "cDescription" ,bd."cAuthor",coalesce(ba."cPage",bd."cPage") "cPageRange"
from "BundleDetail" bd
join "BDAssignment" ba on ba."nBundledetailid" = bd."nBundledetailid"
left join "BDPermission" bp on bp."nUserid" = ''' || nMasterid || ''' and bp."nBundledetailid"  = bd."nBundledetailid"
left join "BundleMaster" bm on bd."nBundleid" = ba."nBundleid"
left join "BundleMaster" bmd on bmd."nBundleid" = bd."nBundleid"
cross join tsquery
where bp."nBDPid" is null and
	ba."nSectionid" = ''' || nSectionid || ''' and  case when ''' || cLocation || ''' =  ''T'' then coalesce(ba."nBundleid",''00000000-0000-0000-0000-000000000000'') = ''' || nBundleid || ''' else true end  AND (CASE
                  WHEN COALESCE(''' || cFiletype || ''', ''ALL'') = ''ALL'' THEN TRUE
                  WHEN COALESCE(''' || cFiletype || ''', ''ALL'') = ''Other'' THEN COALESCE(bd."cFiletype", '''') = ''''
                  ELSE bd."cFiletype" = ''' || cFiletype || '''
               END)
          AND bd."cStatus" = ''C''
	   AND ( case when ''' || contentType || ''' = ''All'' then (case '''|| searchName::text ||''' when ''S'' then
             LOWER(bd."cFilename") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''
			  OR LOWER(bd."cTab") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''
			  OR LOWER(bd."cExhibitno") ILIKE LOWER(''' || cSearch::text || ''') || ''%''
			  OR LOWER(bd."cDesc") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''
			  OR LOWER(bd."cAuthor") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''
			  OR LOWER(bd."dIntrestDt") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''
		   when ''E'' then
		     trim(LOWER(bd."cFilename")) = trim(LOWER(''' || cSearch::text || '''))
			  OR LOWER(bd."cTab") = trim(LOWER(''' || cSearch::text || '''))
			  OR LOWER(bd."cExhibitno") = trim(LOWER(''' || cSearch::text || '''))
			  OR LOWER(bd."cDesc") = trim(LOWER(''' || cSearch::text || '''))
			  OR LOWER(bd."cAuthor") = trim(LOWER(''' || cSearch::text || '''))
			  OR LOWER(bd."dIntrestDt") = trim(LOWER(''' || cSearch::text || '''))
			   else
					 (
   ((tsv_tab @@ tsquery.ts ) OR (tsv_filename @@ tsquery.ts ) OR (tsv_exhibit @@ tsquery.ts ) OR (tsv_desc @@ tsquery.ts ) OR (tsv_author @@ tsquery.ts ))

   or                 LOWER(COALESCE(bd."cTab", '''')) || '' '' || LOWER(bd."cFilename") || '' '' || LOWER(COALESCE(bd."cExhibitno", '''')) || '' '' || LOWER(COALESCE(bd."cDesc", '''')) || '' '' || LOWER(COALESCE(bd."cAuthor", ''''))  ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'')
	 )


		   end )

else
		  ( case '''|| searchName::text ||''' when ''S'' then
		   ( case when  ''' || contentType || ''' != ''cBundletag'' then
             LOWER(bd."'|| (case when contentType ='All' or contentType = 'cBundletag' then 'cFilename'  else contentType end) ||'") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''
			 else
			   LOWER(bm."cBundletag") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''
			 end)
		   when ''E''  then
		    ( case when  ''' || contentType || ''' != ''cBundletag'' then
		     trim(LOWER(bd."'|| (case when contentType ='All' or contentType = 'cBundletag' then 'cFilename' else contentType end) ||'")) = trim(LOWER(''' || cSearch::text || '''))
else
 trim(LOWER(bm."cBundletag")) = trim(LOWER(''' || cSearch::text || '''))
end)

			   else
			  (
CASE ''' || contentType ||'''
    WHEN ''cTab'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bd."cTab") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bd."cTab") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
                tsv_tab @@ tsquery.ts
				or
                LOWER(COALESCE(bd."cTab", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cFilename'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bd."cFilename") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bd."cFilename") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE

				tsv_filename @@ tsquery.ts
				or
                LOWER(COALESCE(bd."cFilename", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cExhibitno'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bd."cExhibitno") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bd."cExhibitno") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_exhibit @@ tsquery.ts
				or
                LOWER(COALESCE(bd."cExhibitno", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cDesc'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bd."cDesc") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bd."cDesc") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_desc @@ tsquery.ts
				or
                LOWER(COALESCE(bd."cDesc", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    WHEN ''cAuthor'' THEN
        CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bd."cAuthor") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bd."cAuthor") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			tsv_author @@ tsquery.ts
				or
                LOWER(COALESCE(bd."cAuthor", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
		when ''cBundletag'' then
			 CASE '''|| searchName ||'''
            WHEN ''S'' THEN LOWER(bm."cBundletag") LIKE LOWER('''|| coalesce(cSearch::text,'') ||''') || ''%''
            WHEN ''E'' THEN LOWER(bm."cBundletag") = TRIM(LOWER('''|| coalesce(cSearch::text,'') ||'''))
            ELSE
			bm.tsv_bundletag @@ tsquery.ts
				or
                LOWER(COALESCE(bm."cBundletag", ''''))   ILIKE (''%'' ||  TRIM(LOWER('''|| coalesce(cSearch::text,'') ||''')) || ''%'')
        END
    ELSE TRUE -- fallback
END
						)
		   end)


end


  or
  (case when  (('''|| contentType ||''' = ''All'' or '''|| contentType ||''' = ''dIntrestDt'') and '''|| searchName::text ||'''  = ''C''  ) and ''' || coalesce(start_date::text,'') || ''' !='''' and COALESCE(bd."start_date"::text, '''') != '''' then
 coalesce(bd."start_date",''1001-01-02'')::date >= '''|| coalesce(start_date::text,'1001-01-01') ||'''::date and bd."end_date"::date <=coalesce('''|| coalesce(end_date,'1001-01-02') ||''',''1001-01-01'')::date else false end
              )
              )
),
    br AS (
        SELECT NULL::UUID AS "nBundledetailid", b."nBundleid", b."cBundlename" AS "cName", b."cBundlename" AS "cTab", '''' AS "cExhibitno",b."cBundletag",
		sorted_bundletag sorted_tab,b.sorted_name,null::text[] sorted_page,null::text[] sorted_exhibitno,null::text[] sorted_intrestdt,null::text[] sorted_description,null::text[] sorted_author,null::date start_date,
		case when (LOWER(COALESCE("cBundlename", ''''))  ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'') ) then 0 when
		tsv_bundlename @@ tsquery.ts then 0.01 else similarity("cBundlename", ''' || cSearch::text || ''') end similarity
        FROM "BundleMaster" b
        LEFT JOIN "BMPermission" p ON p."nUserid" = ''' || nMasterid || ''' AND p."nBundleid" = b."nBundleid"
	cross join tsquery
        WHERE  b."nSectionid" = ''' || nSectionid || ''' AND  coalesce(b."nParentBundleid",''00000000-0000-0000-0000-000000000000''::uuid) != ''00000000-0000-0000-0000-000000000000''::uuid  AND
		(case when ''' || cLocation || ''' =  ''T'' then coalesce(b."nParentBundleid",''00000000-0000-0000-0000-000000000000''::uuid) = ''' || nBundleid || ''' else true end
		)
          AND CASE WHEN COALESCE(''' || cFiletype || ''', ''ALL'') = ''ALL'' THEN TRUE ELSE FALSE END
		 and case when jsonb_array_length(''' || jFTypes || '''::jsonb) > 0 then ''' || jFTypes || '''::jsonb @> to_jsonb(''FOLDER''::text) else true end
		    AND
		   ((case '''|| searchName::text ||''' when ''S'' then
             LOWER("cBundlename") ILIKE  LOWER(''' || cSearch::text || ''') || ''%''
		   when ''E'' then
		     trim(LOWER("cBundlename")) = trim(LOWER(''' || cSearch::text || '''))
		   else
			(case when ''' || contentType || ''' = ''All'' OR ''' || contentType || ''' = ''cFilename'' then
				(tsv_bundlename @@ tsquery.ts
				  or LOWER(COALESCE("cBundlename", ''''))  ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'')
				 )
				 when ''' || contentType || ''' = ''cBundletag'' then
					 	(tsv_bundletag @@ tsquery.ts
					  or
	       			  LOWER(COALESCE("cBundletag", ''''))  ILIKE (''%'' ||  LOWER(''' || cSearch::text || ''') || ''%'')
		 				)
				else false end)
		   end)

		   or  (case when jsonb_array_length(''' || searchedBundles || '''::jsonb) > 0 then ''' || searchedBundles || '''::jsonb @> to_jsonb(b."nBundleid") else false end)
		   )

    ),
    cr AS (
        SELECT * FROM ar
        UNION ALL
		select *,null as "cPage",null as "cRefpage",null as "cFilesize",null as  "cFiletype",null "dIntrestDt",null "cDescription",'''' "cAuthor",'''' "cPageRange"
        FROM br
	 UNION ALL
		select *
        FROM assign
    ), fct as (
        SELECT f."nFSid", f."nBundledetailid", i."nIssueid", i."nImpactid", i."nRelevanceid", f."cFType"
        FROM "FactMaster" f
        JOIN "FMIssue" i ON i."nFSid" = f."nFSid"
        JOIN cr ON cr."nBundledetailid" = f."nBundledetailid"
        WHERE f."nUserid" = ''' || nMasterid ||'''
          AND (
			(case when jsonb_array_length(coalesce('''|| jIssues ||''',''[]''::jsonb)) > 0 then
            coalesce('''|| jIssues ||''',''[]''::jsonb) @> to_jsonb(i."nIssueid") else true end)
			and
			(case when jsonb_array_length(coalesce('''|| jMarkup ||''',''[]''::jsonb)) > 0 then
            coalesce('''|| jMarkup ||''',''[]''::jsonb) @> to_jsonb(ARRAY[f."cFType"]) else true end) and
			case when  (jsonb_array_length(coalesce('''|| jMarkup ||''',''[]''::jsonb)) >0) then  coalesce('''|| jMarkup ||''',''[]''::jsonb)  @> to_jsonb(ARRAY[f."cFType"]) else true end
and case when ( jsonb_array_length(coalesce('''|| jImpact ||''',''[]''::jsonb))  >0) then coalesce('''|| jImpact ||''',''[]''::jsonb) @> to_jsonb(i."nImpactid") else true end and case when (jsonb_array_length(coalesce(''' || jRelevance ||''',''[]''::jsonb)) > 0) then coalesce(''' || jRelevance ||''',''[]''::jsonb) @> to_jsonb(i."nRelevanceid") else true end

          )
    ),doc as (
		select d."nDocid",d."nBundledetailid"
		From "DocMaster" d
		join cr on cr."nBundledetailid" = d."nBundledetailid"
		where "nUserid" = '''|| nMasterid ||'''  and coalesce('''|| jMarkup ||''',''[]''::jsonb) @> to_jsonb(ARRAY[''D''])
	),web as (
		select w."nWebid",w."nBundledetailid"
		From "WebMaster" w
		join cr on cr."nBundledetailid" = w."nBundledetailid"
		where "nUserid" = '''|| nMasterid ||'''  and coalesce('''|| jMarkup ||''',''[]''::jsonb) @> to_jsonb(ARRAY[''W''])
	),cr1 AS (
        SELECT distinct cr.*
		,case when total_flink > 0 then true else false end flink
		,case when total_web > 0 then true else false end web
		,case when total_doc > 0 then true else false end doc
		,case when total_fact > 0 then true else false end fact FROM cr

		left join fct f on f."nBundledetailid" = cr."nBundledetailid"
		left join doc d on d."nBundledetailid" = cr."nBundledetailid"
		left join web w on w."nBundledetailid" = cr."nBundledetailid"
		left join file_links fl on fl."nBundledetailid" = cr."nBundledetailid" and fl."nUserid" = '''|| nMasterid ||'''

			  where (case when (('|| jsonb_array_length(jIssues) ||' > 0 or '|| jsonb_array_length(coalesce(jImpact,'[]'::jsonb)) ||' >0 or '|| jsonb_array_length(coalesce(jRelevance,'[]'::jsonb)) ||' > 0 or (' || jsonb_array_length(coalesce(jMarkup,'[]'::jsonb)) ||' > 0 and coalesce('''|| jMarkup ||''',''[]''::jsonb) @> to_jsonb(ARRAY[''F'',''QF'']) ))) or  ((' || jsonb_array_length(coalesce(jMarkup,'[]'::jsonb)) ||' > 0 and coalesce('''|| jMarkup ||''',''[]''::jsonb) @> to_jsonb(ARRAY[''D'']) )) or ( (' || jsonb_array_length(coalesce(jMarkup,'[]'::jsonb)) ||' > 0 and coalesce(''' || jMarkup ||''',''[]''::jsonb) @> to_jsonb(ARRAY[''W'']) ))  then coalesce(f."nBundledetailid",''00000000-0000-0000-0000-000000000000''::uuid) != ''00000000-0000-0000-0000-000000000000''::uuid or coalesce(d."nBundledetailid",''00000000-0000-0000-0000-000000000000''::uuid) !=  ''00000000-0000-0000-0000-000000000000''::uuid or coalesce(w."nBundledetailid",''00000000-0000-0000-0000-000000000000''::uuid) !=  ''00000000-0000-0000-0000-000000000000''::uuid else true end)

	),' || filter_condition ||' ,
    childOrder AS (
        SELECT ROW_NUMBER() OVER (ORDER BY
        case when similarity = 0 then similarity else 1 end ,CASE ''' || cSortby || '''
            WHEN ''cTab'' THEN sorted_tab
            WHEN ''cName'' THEN cr.sorted_name
            WHEN ''cPage'' THEN sorted_page
            WHEN ''cExhibitno'' THEN sorted_exhibitno
            WHEN ''dIntrestDt'' THEN sorted_intrestdt
            WHEN ''cDescription'' THEN sorted_description
            WHEN ''cAuthor'' THEN sorted_author
            WHEN ''cFiletype'' THEN ARRAY["cFiletype"]::TEXT[]
            ELSE sorted_tab
        END ' || cSorttype || ',sorted_tab ' || cSorttype || ',cr.sorted_name,"' || (case when contentType = 'All' then  'cTab' when  contentType = 'cFilename' then 'cName' when contentType = 'cDesc' then 'cDescription' else  contentType end) || '") AS serial, cr.*
        FROM filterdata cr
    )
        SELECT serial, "nBundledetailid","nBundleid","cName","cTab","cExhibitno","cBundletag",
               "cPage","cRefpage","cFilesize", "cFiletype","dIntrestDt","cDescription",flink,web,doc,fact,"cAuthor","cPageRange"
        FROM childOrder
        ORDER BY serial
        LIMIT ' || perPage || ' OFFSET ' || offsetCount || '


    ';
 	RAISE notice 'sql_query: %', sql_query;
    -- OPEN ref1 FOR EXECUTE sql_query;
	BEGIN
		OPEN ref1 FOR EXECUTE sql_query;

	EXCEPTION WHEN OTHERS THEN
	    RAISE EXCEPTION 'Failed executing search query: %', SQLERRM;
	END;

RETURN NEXT ref1;


END;
$$;

-- ===== public.et_bundledetail_with_filter(jsonb, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_bundledetail_with_filter(parameter jsonb, ref1 refcursor DEFAULT NULL::refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$
DECLARE
	nID uuid;

    nMasterid uuid;
    nSesid uuid;
    nBundledetailid uuid;
	cSortby text;
	perPage int := 10;
	pageNumber int;
    offsetCount int;
	jFilter jsonb;
	sql_query TEXT;
	sql_query_doc_links TEXT;
	sql_query_qm TEXT;
	filter_string text default null;
    filter_string_doc_links text default null;
	filter_string_q_mark text default null;
	factids jsonb;
    docids jsonb;
	bIsTranscipt boolean default false;
	historyEnabled boolean;

	isAdmin boolean default false;
	nRoleid uuid;nTeamid uuid;nCaseid uuid;
	-- fga_factids jsonb;



BEGIN
    -- Extract parameters
    nSesid := NULLIF(parameter->>'nSesid','')::uuid;
    nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
    nMasterid := NULLIF(parameter->>'nUserid','')::uuid;
    cSortby := parameter->>'cSortby';
    pageNumber := COALESCE((parameter->>'nPageNumber')::int, 1);
    offsetCount := (pageNumber - 1) * perPage;
	jFilter := parameter ->>'jFilter';
	-- jFilter := parameter -> 'jFilter';  -- returns jsonb directly
	bIsTranscipt := COALESCE(parameter ->> 'bIsTranscipt','false')::boolean;
	-- fga_factids := parameter->>'jFactids';

	nID := (case when nSesid  is not distinct from null then nBundledetailid else nSesid end);

	historyEnabled := COALESCE(parameter ->> 'historyEnabled','false')::boolean;
	-- create a temp table to dump data from history_marknav

isAdmin := case when exists (select * from "UserMaster" where "nUserid" = nMasterid and "isAdmin" = true )  then true  else false  end;

 if(nBundledetailid is not null) then
 	select "nCaseid" into nCaseid from bundlesource where  "nBundledetailid" =  nBundledetailid;
 else
 -- select * from "RSessionMaster" where "nSesid" = '3695e05a-b8bf-4b13-9e80-f38b10bf7cf1';
	select "nCaseid" into nCaseid from "RSessionMaster" where "nSesid" = nSesid;
 end if;

select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nMasterid and "nCaseid" = nCaseid limit 1;
-- raise notice 'nSesid ,nCaseid , nRoleid %,%,%',nSesid,nCaseid,nRoleid ;
if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then
	isAdmin := true;
end if;


	DROP TABLE IF EXISTS temp_history_marknav;
  IF historyEnabled THEN

	CREATE TEMP TABLE temp_history_marknav ON COMMIT DROP AS
	SELECT *
	FROM realtime.history_marknav(
	nSesid,
	nBundledetailid,
	nMasterid,
	'ALL',
	1
	);

  END IF;


	sql_query := '
	 SELECT jsonb_agg(distinct f."nFSid")
    FROM "FactMaster" f
    JOIN "FactDetail" d ON d."nFSid" = f."nFSid"
	left join "TeamRelation" tr ON tr."nTeamid" = '''|| nTeamid ||'''
    LEFT JOIN "FMTasks" t ON t."nFSid" = f."nFSid"
	LEFT JOIN "TaskDetail" td ON td."nTaskid" = t."nTaskid"
	LEFT JOIN "FMIssue" i ON i."nFSid" = f."nFSid"
	LEFT JOIN "RIssueMaster" im ON im."nIid" = i."nIssueid"
    LEFT JOIN "FMShared" s ON s."nFSid" = f."nFSid"
    LEFT JOIN "FMContact" c ON c."nFSid" = f."nFSid"
    LEFT JOIN "FMLinks" l ON l."nFSid" = f."nFSid"
	 '|| (case when historyEnabled = true then
	'join temp_history_marknav his on his."id" = f."nFSid" '
	else '' end
	) ||'
	WHERE (f."nSesid" = ' || quote_nullable(nSesid) || '
		OR f."nBundledetailid" = ' || quote_nullable(nBundledetailid) || ')
	AND (f."nUserid" = ' || quote_nullable(nMasterid) || '
	OR s."nUserid" = ' || quote_nullable(nMasterid) || '
	or (case when ''' || isAdmin || '''::boolean = true then  f."nUserid" = tr."nUserid" else false end))';

	--or ('''|| coalesce(fga_factids,'[]')::text || ''')::jsonb @> to_jsonb(f."nFSid")
	-- IF jFilter IS NOT NULL AND jsonb_array_length(jFilter) > 0 THEN
	IF jFilter IS NOT NULL AND jFilter <> '{}'::jsonb THEN

    sql_query := sql_query || '
      AND EXISTS (
          SELECT *
          FROM realtime.filter_marknav(''' || jFilter::text || '''::jsonb,
                                        ' || quote_nullable(nID) || ',
                                        ' || quote_nullable(nMasterid) || ',
                                        ''ALL'',' || quote_nullable(nTeamid) || ','|| isAdmin ||') t
          WHERE t."id" = f."nFSid"
      )';
END IF;

RAISE NOTICE 'Fact SQL: %', sql_query;
EXECUTE sql_query INTO factids;

RAISE NOTICE 'Fact SQL Result: %', factids;

IF factids IS NULL THEN
    factids := '[]'::jsonb;
END IF;
/*IF (coalesce(historyEnabled,false) = false) THEN
factids := coalesce(fga_factids, '[]'::jsonb) || coalesce(factids, '[]'::jsonb);
END IF;*/

-- SELECT jsonb_agg(distinct m."nDocid") into docids
-- 	From "DocMaster" m
-- 	join "DocDetail" d on d."nDocid" = m."nDocid"
-- 	left join "DMLinks" l on l."nDocid" = m."nDocid"
-- 	left join "DMShared" ds on ds."nDocid" = m."nDocid"
-- 	where
-- 	(m."nUserid" =  nMasterid or ds."nUserid" = nMasterid)
-- 	and
-- 	(m."nSesid" is not distinct from nSesid OR m."nBundledetailid" is not distinct from nBundledetailid)
-- 	and d."cType" != 'M'
-- 	and case when jFilter is not null then
-- 		 exists (
-- 			select * from realtime.filter_marknav(jFilter,nID,nMasterid,'ALL') t
-- 		where t."id" = m."nDocid"
-- 		 )
-- 	else true end
-- 	;

sql_query_doc_links := '
				SELECT jsonb_agg(DISTINCT m."nDocid")
				FROM "DocMaster"  m
				JOIN "DocDetail"  d  ON d."nDocid" = m."nDocid"
				left join "TeamRelation" tr ON tr."nTeamid" = '''|| nTeamid ||'''
				LEFT JOIN "DMLinks"  l  ON l."nDocid" = m."nDocid"
				LEFT JOIN "DMShared" ds ON ds."nDocid" = m."nDocid"
				'|| (case when historyEnabled = true then
				'join temp_history_marknav his on his."id" = m."nDocid" '
				else '' end
				) ||'
				WHERE
						(m."nUserid" = ' || quote_nullable(nMasterid) || '
					OR  ds."nUserid" = ' || quote_nullable(nMasterid) || '
	or (case when ''' || isAdmin || '''::boolean = true then  m."nUserid" = tr."nUserid" else false end))
					AND (m."nSesid" IS NOT DISTINCT FROM ' || quote_nullable(nSesid) || '
					OR  m."nBundledetailid" IS NOT DISTINCT FROM ' || quote_nullable(nBundledetailid) || ')
					';

				-- Append filter only if jFilter is a non-empty object
				IF jFilter IS NOT NULL AND jFilter <> '{}'::jsonb THEN
				sql_query_doc_links := sql_query_doc_links || '
					AND EXISTS (
					SELECT 1
					FROM realtime.filter_marknav(''' || jFilter::text || '''::jsonb,
													' || quote_nullable(nID) || ',
													' || quote_nullable(nMasterid) || ',
													''ALL'',' || quote_nullable(nTeamid) || ','|| isAdmin ||') t
					WHERE t."id" = m."nDocid"
					)';
				END IF;

-- Execute and capture into docids (jsonb)
RAISE NOTICE 'Fact SQL: %', sql_query_doc_links;
EXECUTE sql_query_doc_links INTO docids;
RAISE NOTICE 'docids: %', docids;
-- Normalize to empty array when no rows
IF docids IS NULL THEN
  docids := '[]'::jsonb;
END IF;

-- Build dynamic SQL for QM
sql_query_qm := '
    SELECT
        ''QM'' AS "cSource",
        rh."nHid" as "id",
        null::uuid as "nFSid",
        rh."dCreatedt" AS "dCreateDt",
        um."cFname" || '' '' || COALESCE(um."cLname", '''') AS "cCreateby",
        NULL::text AS "cType",
		NULL::uuid AS "nBundledetailid",
        NULL::jsonb AS "jLinktype",
        NULL::jsonb AS "jTexts",
		NULL::jsonb AS "jOT",
        NULL::jsonb AS "jCordinates",
        (CASE WHEN '|| bIsTranscipt ||' THEN rh."cTPageno" ELSE rh."cPageno" END)::int AS "nPage",
        (CASE WHEN '|| bIsTranscipt ||' THEN rh."cTLineno" ELSE rh."cLineno" END)::int AS "nLine",
		(CASE WHEN ' || bIsTranscipt || ' THEN rh."cTTime" ELSE rh."cTime" END) AS "cTime",
        NULL::text AS "cColor",
        NULL::jsonb AS "jDate",
        NULL::jsonb AS list,
        rh."nUserid",
		null::bigint as "t_shared",
		null::bigint as "t_tasks",
		null::bigint as "t_contact",
		null::bigint as "total"
    FROM "RHighlights" rh
    JOIN "UserMaster" um ON um."nUserid" = rh."nUserid" '
    || (CASE WHEN historyEnabled THEN
        ' JOIN temp_history_marknav his ON his."id" = rh."nHid" '
       ELSE '' END) || '
    WHERE rh."nUserid" = ' || quote_nullable(nMasterid) || '
      AND rh."nSessionId" = ' || quote_nullable(nSesid);

-- Append filter only if jFilter present
IF jFilter IS NOT NULL AND jFilter <> '{}'::jsonb THEN
    sql_query_qm := sql_query_qm || '
      AND EXISTS (
          SELECT *
          FROM realtime.filter_marknav(''' || jFilter::text || '''::jsonb,
                                        ' || quote_nullable(nID) || ',
                                        ' || quote_nullable(nMasterid) || ',
                                        ''ALL'',' || quote_nullable(nTeamid) || ','|| isAdmin ||') t
          WHERE t."id" = rh."nHid"
      )';
END IF;

DROP TABLE IF EXISTS qmarktable;
 EXECUTE 'CREATE TEMP TABLE qmarktable ON COMMIT DROP AS ' || sql_query_qm;

OPEN ref1 FOR
		with links as (
		    select 	l."nDocid",l."nDMLids" ,l."jLinktype",l."nBundledetailid",d.*
			from "DMLinks" l
			join bundlesource d on d."nBundledetailid" = l."nBundledetailid"
			where docids @> to_jsonb(l."nDocid")
		),
		 combined_results AS (
		SELECT distinct
			case when f."cFType" = 'F' then 'F' else 'QF' end as "cSource",
		    f."nFSid"::uuid as "id",
			f."nFSid",
		    f."dCreateDt",
		    um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
		    fd."cType",
			f."nBundledetailid",
		    fd."jLinktype",
		    fd."jTexts" AS "jTexts",
			fd."jOT",
			fd."jCordinates",
			fd."nPage",
			fd."nLine",
			null as "cTime",
		   cl."cColor" AS "cColor",
		    fd."jDate",
			null::jsonb as list,
			f."nUserid",
			count(fs."nFMSdid") as "t_shared",
			count(ft."nFMTsid") as "t_tasks",
			count(fc."nFMCid") as "t_contact",
			cmt."total" as "t_comments"
		FROM "FactMaster" f
		JOIN "UserMaster" um ON um."nUserid" = f."nUserid"
		JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"
    	JOIN "RIssueMaster" cl ON cl."nIid" = fd."nColorid"
		LEFT JOIN "FMShared" fs ON fs."nFSid" = f."nFSid"
		left join "FMTasks" ft on ft."nFSid" = f."nFSid"
		left join "FMContact" fc on fc."nFSid" = f."nFSid"
		LEFT JOIN "Codemaster" cm ON cm."nCodeid" = (fd."jDate"->>'nValue')::int
		left join realtime."comments" cmt on cmt."nFSid" = f."nFSid"
 		WHERE (f."nSesid" = nSesid OR f."nBundledetailid" = nBundledetailid)
		   and factids @> to_jsonb(f."nFSid")
		   group by f."cFType", f."nFSid",  um."cFname",um."cLname",
		    fd."cType",
			f."nBundledetailid",
		    fd."jLinktype",
		    fd."jTexts",
			fd."jOT",
			fd."jCordinates",
			fd."nPage",
			fd."nLine",
			 cl."cColor",
		    fd."jDate",
			f."nUserid",
			cmt."total"

		UNION ALL
		SELECT
		    'D' AS "cSource",
			m."nDocid"::uuid as "id",
		    m."nDocid"::uuid,
		   m."dCreateDt",
		    um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
		    dd."cType",
			m."nBundledetailid",
		    dd."jLinktype",
		    dd."jTexts" AS "jText",
			dd."jOText" as "jOT",
			dd."jCordinates",
			dd."nPage",
			dd."nLine",
			null as "cTime",
			null "cColor",
			null "jDate",
			jsonb_agg(distinct l.*) as list,
			m."nUserid",
			count(ds."nDMSid") as "t_shared",
			null::bigint as "t_tasks",
			null::bigint as "t_contact",
			cmt."total" as "t_comments"
		  FROM "DocMaster" m
		  JOIN "UserMaster" um ON um."nUserid" = m."nUserid"
		  JOIN "DocDetail" dd ON dd."nDocid" = m."nDocid"
		  JOIN "links" l ON l."nDocid" = m."nDocid"
		  LEFT JOIN "DMShared" ds ON ds."nDocid" = m."nDocid"
		  left join realtime."comments" cmt on cmt."nDocid" = m."nDocid"
		  where  (m."nSesid" = nSesid OR m."nBundledetailid" = nBundledetailid)
		  and docids @> to_jsonb(m."nDocid")
		  group by m."nDocid", m."dCreateDt",um."cFname",um."cLname", dd."cType",
		  m."nBundledetailid" ,dd."jLinktype",dd."jTexts",dd."jOText" ,dd."jCordinates",dd."nPage",
		  dd."nLine",cmt."total"

		union all
			-- select
			-- 'QM' AS "cSource",
			-- rh."nHid" as "id",
			-- null::uuid as "nFSid",
			-- rh."dCreatedt" "dCreateDt",
			-- um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
			-- NULL::text AS "cType",
			-- NULL::jsonb AS "jLinktype",
			-- NULL::jsonb AS "jTexts",
			-- NULL::jsonb AS "jCordinates",
			-- (CASE WHEN bIsTranscipt THEN rh."cTPageno" ELSE rh."cPageno" END)::int AS "nPage",
			-- (CASE WHEN bIsTranscipt THEN rh."cTLineno" ELSE rh."cLineno" END)::int AS "nLine",
			-- NULL::text AS "cColor",
			-- NULL::jsonb AS "jDate",
			-- null list,
			--  rh."nUserid"
			-- from "RHighlights" rh
			-- join "UserMaster" um on um."nUserid" = rh."nUserid"
			-- where rh."nUserid" = nMasterid
			-- and "nSessionId" = nSesid
			-- and case when jFilter is not null then
			-- exists (
			-- select * from realtime.filter_marknav(jFilter,nID,nMasterid,'ALL') t
			-- where t."id" = rh."nHid"
			-- )
	 	-- 	else true end
		 select  *	from qmarktable
		)
		SELECT * FROM combined_results
		ORDER BY
			CASE WHEN cSortby = 'asc' THEN coalesce(coalesce("nPage",("jLinktype"->'pages'->>0)::int),("jLinktype"->>'start')::int) END ASC,
			CASE WHEN cSortby = 'desc' THEN coalesce(coalesce("nPage",("jLinktype"->'pages'->>0)::int),("jLinktype"->>'start')::int) END DESC,
			CASE WHEN cSortby = 'asc' THEN "dCreateDt" END ASC,
			CASE WHEN cSortby = 'desc' THEN "dCreateDt" END DESC;
			-- ,"dCreateDt" DESC;


-- DROP TABLE IF EXISTS temp_history_marknav;
-- DROP TABLE IF EXISTS qmarktable;

   RETURN NEXT ref1;

END;
$$;

-- ===== public.et_bundles(json, refcursor) (known live version: roman-only, 2026-09-01) =====
-- 2) et_bundles: roman-aware ordering, scoped to this SP only
CREATE OR REPLACE FUNCTION public.et_bundles(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;pageNumber int;offsetCount int;perPage int default 2000;nSectionid uuid;nBundleid uuid;
isAdmin boolean default false;
BEGIN
nMasterid := (parameter ->>'nMasterid')::uuid;
pageNumber := coalesce((parameter ->>'pageNumber')::int, 1);
offsetCount := (pageNumber - 1) * perPage;
nBundleid := coalesce((parameter ->>'nBundleid')::uuid, null);
nSectionid := (parameter ->>'nSectionid')::uuid;

	select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nMasterid;

OPEN ref1 FOR
with base as
(
    select b."nBundleid",
           coalesce(b."nParentBundleid", null) "nParentBundleid",
           b."cBundlename",
           b."cBundletag",
           split_hierarchical_sort_multi(b."cBundletag", ARRAY['.', '-'])  tag_parts,
           split_hierarchical_sort_multi(b."cBundlename", ARRAY['.', '-']) name_parts
    from "BundleMaster" b
    left join "BMPermission" p on p."nUserid" = nMasterid and p."nBundleid" = b."nBundleid"
    where case when isAdmin then true else p."nBMPid" is null end
      and b."nSectionid" = nSectionid
      and case when nBundleid is not null then b."nParentBundleid" = nBundleid else b."nParentBundleid" is null end
),
flags as
(
    -- roman sort kicks in ONLY when every non-empty first segment in this
    -- result set is a valid roman numeral (protects A/B/C, CCC-1, R-2 tags)
    select coalesce(bool_and(roman_to_int(tag_parts[1])  is not null) filter (where tag_parts[1]  <> ''), false) tags_all_roman,
           coalesce(bool_and(roman_to_int(name_parts[1]) is not null) filter (where name_parts[1] <> ''), false) names_all_roman
    from base
),
bundle as
(
    select ROW_NUMBER() OVER(ORDER BY
               case when f.tags_all_roman and roman_to_int(b.tag_parts[1]) is not null
                    then array_cat(ARRAY[lpad(roman_to_int(b.tag_parts[1])::text, 10, '0')], b.tag_parts[2:])
                    else b.tag_parts
               end,
               case when f.names_all_roman and roman_to_int(b.name_parts[1]) is not null
                    then array_cat(ARRAY[lpad(roman_to_int(b.name_parts[1])::text, 10, '0')], b.name_parts[2:])
                    else b.name_parts
               end
           ) serial,
           b."nBundleid", b."nParentBundleid", b."cBundlename", b."cBundletag"
    from base b
    cross join flags f
)
select * from bundle
order by serial
LIMIT perPage
OFFSET offsetCount
;
RETURN NEXT ref1;

END;
$function$;

-- ===== public.et_case_contactbuilder(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_case_contactbuilder(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$DECLARE
    nMasterid    uuid;
    nCaseid      uuid;
    nContactid   uuid;

    cProfile     text;
    cFname       text;
    cLname       text;
    cAlias       text;
    cLinkedin    text;

    cEmail       text;
    cCountrycode text;
    cMobile      text;

    nRoleid      uuid;
    nCompanyid   uuid;
    cNote        text;
    nTZid        integer;
    cIso         text;

    cPermission  text;
    emailExists  boolean;

    cType        text;
    cMentiontag  text;
    cOccupation  text;
    nPartyid     integer;
BEGIN
    --------------------------------------------------
    -- READ PARAMETERS
    --------------------------------------------------
    nMasterid  := (parameter ->> 'nMasterid')::uuid;
    nCaseid    := (parameter ->> 'nCaseid')::uuid;
    nContactid := NULLIF(parameter ->> 'nContactid','0')::uuid;

    cProfile  := parameter ->> 'cProfile';
    cFname    := parameter ->> 'cFname';
    cLname    := parameter ->> 'cLname';

    cAlias    := parameter ->> 'cAlias';
    cLinkedin := parameter ->> 'cLinkedin';

    cEmail    := NULLIF(TRIM(parameter ->> 'cEmail'), '');
    cCountrycode := parameter ->> 'cCountrycode';
    cMobile   := NULLIF(TRIM(parameter ->> 'cMobile'), '');

    nRoleid    := (parameter ->> 'nRoleid')::uuid;
    nCompanyid := (parameter ->> 'nCompanyid')::uuid;

    cNote := parameter ->> 'cNote';
    nTZid := (parameter ->> 'nTZid')::integer;
    cIso  := parameter ->> 'cIso';

    cPermission := parameter ->> 'permission';
    cType := COALESCE(NULLIF(parameter ->> 'cType', ''), 'C');

    cMentiontag := parameter ->> 'cMentiontag';
    cOccupation := parameter ->> 'cOccupation';
    nPartyid    := (parameter ->> 'nPartyid')::integer;

    --------------------------------------------------
    -- VALIDATIONS
    --------------------------------------------------
    IF cPermission = 'N' AND cEmail IS NULL THEN
        OPEN ref FOR SELECT -1 AS msg,'Email is required' AS value;
        RETURN ref;
    END IF;

    --------------------------------------------------
    -- DUPLICATE EMAIL CHECK
    --------------------------------------------------
    SELECT EXISTS (
        SELECT 1
        FROM "ContactMaster"
        WHERE LOWER(TRIM("cEmail")) = LOWER(cEmail)
          AND "nCaseid" = nCaseid
    ) INTO emailExists;

    IF emailExists AND cPermission = 'N' THEN
        OPEN ref FOR SELECT -1 AS msg,'Email Already Exists' AS value;
        RETURN ref;
    END IF;

    --------------------------------------------------
    -- VALIDATE PARTY IS UNIQUE TO CATEGORY 22
    --------------------------------------------------
    IF nPartyid IS NOT NULL THEN

        IF NOT EXISTS (
            SELECT 1
            FROM "Codemaster"
            WHERE "nCodeid" = nPartyid
              AND "nCategoryid" = 22
        ) THEN
            OPEN ref FOR
            SELECT -1 AS msg,'Invalid Party (not in category 22)' AS value;
            RETURN ref;
        END IF;

      IF NOT EXISTS (
    SELECT 1
    FROM "Codemaster"
    WHERE "nCodeid" = nPartyid
      AND "nCategoryid" = 22
) THEN
    OPEN ref FOR
    SELECT -1 AS msg,'Invalid Party (not in category 22)' AS value;
    RETURN ref;
END IF;

    END IF;

    --------------------------------------------------
    -- INSERT
    --------------------------------------------------
    IF cPermission = 'N' THEN

        INSERT INTO "ContactMaster" (
            "nCaseid","cProfile","cFname","cLname","cEmail",
            "cCountrycode","cMobile","cAlias","cLinkedin",
            "nTZid","cIso","nRoleid","cMentiontag","cOccupation",
            "nPartyid","nCompanyid","cNote","dCreateDt","nUserid","cType"
        )
        VALUES (
            nCaseid,cProfile,cFname,cLname,cEmail,
            cCountrycode,cMobile,cAlias,cLinkedin,
            nTZid,cIso,nRoleid,cMentiontag,cOccupation,
            nPartyid,nCompanyid,cNote,NOW(),nMasterid,cType
        )
        RETURNING "nContactid" INTO nContactid;

        IF nContactid IS NULL THEN
            OPEN ref FOR SELECT -1 AS msg,'Contact insert failed' AS value;
            RETURN ref;
        END IF;

        OPEN ref FOR
        SELECT 1 AS msg,'Contact Inserted' AS value,nContactid AS "nContactid";

    ELSIF cPermission = 'E' THEN

        UPDATE "ContactMaster"
        SET
            "cProfile" = cProfile,
            "cFname" = cFname,
            "cLname" = cLname,
            "cEmail" = cEmail,
            "cCountrycode" = cCountrycode,
            "cMobile" = cMobile,
            "cAlias" = cAlias,
            "cLinkedin" = cLinkedin,
            "nTZid" = nTZid,
            "cIso" = cIso,
            "cMentiontag" = cMentiontag,
            "cOccupation" = cOccupation,
            "nPartyid" = nPartyid,
            "nRoleid" = nRoleid,
            "nCompanyid" = nCompanyid,
            "cNote" = cNote,
            "dUpdateDt" = NOW()
        WHERE "nContactid" = nContactid;

        IF NOT FOUND THEN
            OPEN ref FOR SELECT -1 AS msg,'Contact update failed' AS value;
            RETURN ref;
        END IF;

        OPEN ref FOR
        SELECT 1 AS msg,'Contact Updated' AS value,nContactid AS "nContactid";
    END IF;

    IF cPermission = 'D' THEN
        DELETE FROM "ContactMaster" WHERE "nContactid" = nContactid;

        IF NOT FOUND THEN
            OPEN ref FOR SELECT -1 AS msg,'Contact delete failed' AS value;
            RETURN ref;
        END IF;

        DELETE FROM "BDContacts" WHERE "nContactid" = nContactid;
        DELETE FROM "FMContact"  WHERE "nContactid" = nContactid;

        OPEN ref FOR SELECT 1 AS msg,'Contact Deleted' AS value;
    END IF;

    RETURN ref;
END;
$$;

-- ===== public.et_common_my_team_user(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_common_my_team_user(parameter json, ref1 refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$
DECLARE
    nMasterid UUID;
    nCaseid UUID;
    nTeamid UUID;
    ZeroUUID UUID := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
    -- Apply P-1: Blank string → NULL conversion with explicit UUID casting
    nMasterid := NULLIF(parameter ->>'nMasterid', '')::uuid;
    nCaseid := NULLIF(parameter ->>'nCaseid', '')::uuid;
    -- select * from "RoleMaster"


    OPEN ref1 FOR
    SELECT u."nUserid", u."cFname", u."cLname", u."cProfile",case when u."isAdmin" or rm."nSrno" = 1 then true else false end  "isAdmin"
    FROM "UserMaster" u
    JOIN "TeamRelation" tr ON tr."nCaseid" = nCaseid AND tr."nUserid" = u."nUserid"
	join "RoleMaster" rm on rm."nRoleid" = tr."nRoleid"
    WHERE "nTeamid" = (
        SELECT "nTeamid"
        FROM "TeamRelation"
        WHERE "nCaseid" = nCaseid AND "nUserid" = nMasterid
    )
	 order by u."cFname", u."cLname";

    RETURN NEXT ref1;
END;
$$;

-- ===== public.et_export_delete_file(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_export_delete_file(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$

declare nUserid uuid;nExportid uuid;nEDid uuid;cType text;

BEGIN

nUserid := NULLIF(parameter->>'nMasterid','')::uuid;
nExportid := NULLIF(parameter ->>'nExportid','')::uuid;
nEDid := NULLIF(parameter ->>'nEDid','')::uuid;
cType := parameter ->>'cType';
-- select * from et_export_delete_file ('{"nCaseid":37,"nUserid":4}','refcursor'); FETCH All in "refcursor";

if(cType='S')then

delete from "ExportMaster" where "nExportid" = nExportid;

delete from  "ExportDetail"  where "nExportid" = nExportid;

else

delete from  "ExportDetail" where "nEDid" = nEDid;
end if;

open ref for
select 1 as msg,'Deleted' value
;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$$;

-- ===== public.et_export_fact_detail(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_export_fact_detail(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$

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
ft."cCodename" as "cFiletype" ,s."cCodename" as "cStatus",fd."jTexts",fd."nStatus",
fd."nFiletype",fd."cType",fd."jLinktype","cTooltype",f."nBundledetailid",bm."cBundletag"
From "FactMaster" f
join "FactDetail" fd on fd."nFSid" = f."nFSid"
join "BundleDetail" b on b."nBundledetailid" = f."nBundledetailid"
left join "BundleMaster" bm on bm."nBundleid" = b."nBundleid"
left join "Codemaster" c on c."nCodeid" = fd."nTZid"
left join "Codemaster" ft on ft."nCodeid" = fd."nFiletype"
left join "Codemaster" s on s."nCodeid" = fd."nStatus"
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
$$;

-- ===== public.et_export_get_data_1(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_export_get_data_1(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$

declare nUserid uuid;nExportid uuid; bIsRetry boolean;

BEGIN

/*
select * from public.et_export_get_data ('{"nExportid":"c2b709f2-6fb9-49d2-a609-3dbed95e9bf9","nMasterid":"3a168b69-1bb8-4c7e-881f-dff78a854f80"}','r1');fetch all in "r1";

*/

nExportid := NULLIF(parameter ->>'nExportid','')::uuid;
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
bIsRetry := (parameter ->>'bIsRetry')::boolean;
--nUserid := 59;

-- for retry
if(bIsRetry) then
        update "ExportMaster" set "cStatus" = 'P' where "nExportid" = nExportid;
        update "ExportDetail" set "cStatus" = 'P' where "nExportid" = nExportid;
end if;

open ref for

select
 m."nExportid",m."nUserid",m."cType",bd."nBundledetailid",d."nEDid",bd."cPath",
 m."bPagination",m."bDoc",m."bFact",m."bWeb",m."bQfact",m."bCoverpg",m."bFitpg",
m."cDsize",m."cFsize",m."cQFsize",m."cOrientation",m."cPgsize",m."jFContact",m."jFIssue",m."jQFContact",m."jQFIssue",m."jPages",
 coalesce(f."allfacts",'[]'::jsonb) as allfacts,
 jsonb_agg(h) filter (where h.id is not null)  "highlights"
 ,case when jsonb_array_length(m."jPages") > 0 then false else true end "isAllpage" from "ExportMaster" m
join "ExportDetail" d on d."nExportid" = m."nExportid"
join "BundleDetail" bd on bd."nBundledetailid" = d."nBDid"
left join lateral (
select jsonb_agg(distinct fs."nFSid") as "allfacts"
from "FactMaster" fs
left join "FMIssue" fi on fi."nFSid"  = fs."nFSid"
left join "FMContact" fc on fc."nFSid"  = fs."nFSid"
where "nCreateId" = nUserid and  fs."nBundledetailid" = bd."nBundledetailid"
	and
	-- case when m."bQfact" =true and jsonb_array_length(m."jQFIssue") > 0 then (case fs."cFType" when  'QF' then m."jQFIssue" @> to_jsonb(fi."nIssueid"::text) when 'F' then   m."jFIssue" @> to_jsonb(fi."nIssueid"::text) end ) else true end
	(case when
	(jsonb_array_length(m."jQFIssue") > 0 or jsonb_array_length(m."jFIssue") > 0) or
	(jsonb_array_length(m."jQFContact") > 0 or jsonb_array_length(m."jFContact") > 0) then

	(case when jsonb_array_length(m."jQFIssue") > 0 and jsonb_array_length(m."jFIssue") > 0  then (( m."jQFIssue" @> to_jsonb(fi."nIssueid"::text) and fs."cFType"  =  'QF') or (  m."jFIssue" @> to_jsonb(fi."nIssueid"::text) and fs."cFType"  =  'F' )) when jsonb_array_length(m."jQFIssue") > 0 and  fs."cFType"  =  'QF' then m."jQFIssue" @> to_jsonb(fi."nIssueid"::text)

	when jsonb_array_length(m."jFIssue") > 0 and  fs."cFType"  =  'F' then m."jFIssue" @> to_jsonb(fi."nIssueid"::text) else false end
	)
	or
	(case when jsonb_array_length(m."jQFContact") > 0 and jsonb_array_length(m."jFContact") > 0  then ( (m."jQFContact" @> to_jsonb(fc."nContactid"::text)  and fs."cFType" = 'QF') or   (m."jFContact" @> to_jsonb(fc."nContactid"::text)  and fs."cFType" = 'F') ) when jsonb_array_length(m."jQFContact") > 0 and  fs."cFType"  =  'QF' then m."jQFContact" @> to_jsonb(fc."nContactid"::text)

	when jsonb_array_length(m."jFContact") > 0 and  fs."cFType"  =  'F' then m."jFContact" @> to_jsonb(fc."nContactid"::text) else false end

	)
	else true end
	)
group by "nBundledetailid"
) f on true
left join lateral(
with tbl as (
	select distinct f."nFSid" as id,f."nFSid",null::uuid as "nDocid",null::uuid as "nWebid",coalesce("cFType",'F') as "linktype"
	from "FactMaster" f
	left join "FMIssue" fi on fi."nFSid"  = f."nFSid"
	left join "FMContact" fc on fc."nFSid"  = f."nFSid"
	where case when m."bFact" = true  and m."bQfact" = true then  true when  m."bFact" = true then f."cFType" = 'F' when  m."bQfact" = true then f."cFType" = 'QF'  else false end and f."nUserid" = nUserid and f."nBundledetailid" = bd."nBundledetailid"
	and (case when
	(jsonb_array_length(m."jQFIssue") > 0 or jsonb_array_length(m."jFIssue") > 0) or
	(jsonb_array_length(m."jQFContact") > 0 or jsonb_array_length(m."jFContact") > 0) then

	(case when jsonb_array_length(m."jQFIssue") > 0 and jsonb_array_length(m."jFIssue") > 0  then (( m."jQFIssue" @> to_jsonb(fi."nIssueid"::text) and f."cFType" = 'QF') or   (m."jFIssue" @> to_jsonb(fi."nIssueid"::text) and f."cFType" = 'F') ) when jsonb_array_length(m."jQFIssue") > 0 and  f."cFType"  =  'QF' then m."jQFIssue" @> to_jsonb(fi."nIssueid"::text)

	when jsonb_array_length(m."jFIssue") > 0 and  f."cFType"  =  'F' then m."jFIssue" @> to_jsonb(fi."nIssueid"::text) else false end
	)
	or
	(case when jsonb_array_length(m."jQFContact") > 0 and jsonb_array_length(m."jFContact") > 0  then (( m."jQFContact" @> to_jsonb(fc."nContactid"::text) and  f."cFType" = 'QF') or   (m."jFContact" @> to_jsonb(fc."nContactid"::text)  and f."cFType" = 'F') ) when jsonb_array_length(m."jQFContact") > 0 and  f."cFType"  =  'QF' then m."jQFContact" @> to_jsonb(fc."nContactid"::text)

	when jsonb_array_length(m."jFContact") > 0 and  f."cFType"  =  'F' then m."jFContact" @> to_jsonb(fc."nContactid"::text) else false end

	)
	else true end
	)
	union all
	select "nDocid" as id ,null::uuid as  "nFSid",null::uuid as  "nWebid", "nDocid",'D' as "linktype"
	from "DocMaster" d
	where  m."bDoc" = true and  d."nUserid" = nUserid and d."nBundledetailid" = bd."nBundledetailid"
	union all
	select "nWebid" as id ,null::uuid "nFSid",null::uuid "nDocid","nWebid",'W' as "linktype"
	from "WebMaster" d
	where m."bWeb" = true and d."nUserid" = nUserid and d."nBundledetailid" = bd."nBundledetailid"
) select t.id,a."nAId" ,a."uuid",a."type",a."rects",a."lines",a."width",a."color",a."page",a."nFSid",a."nDocid", a."nWebid", t."linktype"
	from tbl t
	join annotations a on a."nFSid" = t."id" or a."nDocid" = t."id" or a."nWebid" = t."id"
) h on true
where m."nExportid" = nExportid
group by  m."nExportid",m."nUserid",bd."nBundledetailid",d."nEDid",bd."cPath", m."bPagination",m."bDoc",m."bFact",m."bQfact",m."bCoverpg",m."bFitpg",
m."cDsize",m."cFsize",m."cQFsize",m."cOrientation",m."cPgsize",m."jFContact",m."jFIssue",m."jQFContact",m."jQFIssue",m."jPages",
f."allfacts"
order by bd."sorted_tab";

-- select * from highlights

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$$;

-- ===== public.et_export_insert_data_1(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_export_insert_data_1(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$

declare nMasterid uuid;nCaseid uuid;
nExportid uuid;
cType text;bPagination boolean;
bDoc boolean;bFact boolean;bQfact boolean;
bWeb boolean;
bCoverpg boolean;bFitpg boolean;

cDsize text;cFsize text; cQFsize text;
cOrientation text;cPgsize text;
jFiles jsonb;
jFContact jsonb;jFIssue jsonb;
jQFContact jsonb;jQFIssue jsonb;
jPages jsonb;

BEGIN
/*
select * from public.et_export_insert_data ('{"cTranscript":"N","bPagination":false,"cPdftype":"S","bFact":true,"cFsize":"S","jFIssue":"[]","jFContact":"[]","bQfact":true,"cQFsize":"S","jQFIssue":"[]","jQFContact":"[]","bDoc":true,"bWeb":true,"cDsize":"S","bCoverpg":true,"cOrientation":"A","bFitpg":true,"cPgsize":"A4","nCaseid":"d2aaed5d-a05e-458e-a90f-710d6267ad0a","jPages":"[]","jFiles":"[\"96614464-c24f-4ab5-871e-bcab5724bf15\"]","nMasterid":7}','r1');fetch all in "r1";

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
bWeb := parameter ->>'bWeb';
jFiles := parameter ->>'jFiles';
-- select * from "ExportMaster"
-- select * from "ExportDetail"
-- truncate table "ExportMaster" restart identity;
-- truncate table "ExportDetail" restart identity;

-- select * from "UserMaster" order by 1 desc

	insert into "ExportMaster" ("nUserid","nCaseid","cType","dReqDt","cStatus","bPagination","bDoc","bFact","bQfact","bCoverpg","bFitpg",
							   "cDsize","cFsize","cQFsize","cOrientation","cPgsize","jFContact","jFIssue","jQFContact","jQFIssue","jPages","bWeb")

	values(nMasterid,nCaseid,cType,now(),'P',bPagination,bDoc,bFact,bQfact,bCoverpg,bFitpg,
		  cDsize,cFsize,cQFsize,cOrientation,cPgsize,coalesce(jFContact,'[]'::jsonb),coalesce(jFIssue,'[]'::jsonb),
		  coalesce(jQFContact,'[]'::jsonb),coalesce(jQFIssue,'[]'::jsonb),jPages,bWeb)
      RETURNING "nExportid" INTO nExportid;

	-- select max("nExportid") into nExportid from "ExportMaster";
	insert into "ExportDetail"("nExportid","nBDid")
	select distinct nExportid,NULLIF(t,'')::uuid from jsonb_array_elements_text(jFiles) t;

	open ref for select nExportid "nExportid";



RETURN ref;                                                       -- Return the cursor to the caller
    END;
$$;

-- ===== public.et_fact_get_detail(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_fact_get_detail(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$
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
    left JOIN "RIssueMaster" cl ON cl."nIid" = fd."nColorid"
    WHERE jFSids @> to_jsonb(f."nFSid"::text) --f."nFSid" = ANY(jFSids)
	group by f."nFSid",f."dCreateDt",um."cFname" ,um."cLname",
        fd."nFiletype",fd."nTZid", tz."cCodename",
        "jLinktype",fd."cType",f."cFType",fd."jTexts",fd."jOT",
        fd."nColorid",cl."cColor",fd."jDate",fd."nStatus",
		cm."cCodename",st."cCodename",ftp."cCodename",	f."nUserid",
		 bd."nBundledetailid",
    	bd."cFilename",
    	bd."cTab",
    	bd."cExhibitno",
    	bd."cBundletag",
		fd."cIsNote",
		fd."bIsHighlighted";

    RETURN ref;
END;
$$;

-- ===== public.et_fact_insert_detail(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_fact_insert_detail(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$
DECLARE nFSid uuid;jText jsonb;nFt integer;nSt integer;
jDate jsonb;cType text;nTZid integer;jOT jsonb;
jAn jsonb;nColorid uuid;jLinktype jsonb;cIsNote text;
bIsHighlighted boolean;
-- select * from "FactDetail" limit 0
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

-- alter table "FactDetail" add column "cIsNote" character varying(1) default 'N';

/*
select * from et_fact_insert_detail ('{...}','r1');fetch all in "r1";

select * from "FactDetail" order by 1 desc

alter table "FactDetail" add column "cIsNote" character varying(1) default 'N';

*/
-- select * from "Annotations" order by 1 desc

	insert into "FactDetail" ("nFSid","nFiletype","nTZid","jDate","nStatus","cType","jTexts","jOT","nColorid","jLinktype","cIsNote", "bIsHighlighted")
	select nFSid,nFt,nTZid,jDate,nSt,cType,jText,jOT,nColorid,jLinktype,coalesce(cIsNote,'N'),bIsHighlighted;

	insert into "Annotations"("uuid","type","rects","lines","colorid","width","page","nFSid","dCreateDt")
	select "uuid","type",coalesce("rects",'[]'::jsonb),coalesce("lines",'[]'::jsonb),nColorid,"width","page",nFSid,now() from jsonb_to_recordset(jAn) as ("uuid" text,"type" text,"rects" jsonb,"lines" jsonb,width int,"colorid" uuid,"page" int);

	open ref for select 1 msg;
    RETURN ref;
END;
$$;

-- ===== public.et_fact_permissions(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_fact_permissions(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$
DECLARE
    nUserid UUID;
	nFSid uuid;


	isAdmin boolean default false;
	nRoleid uuid;nCaseid uuid;
BEGIN
    nFSid := NULLIF(parameter ->> 'nFSid','')::UUID;
    nUserid := NULLIF(parameter ->> 'nUserid','')::UUID;

	isAdmin := case when exists (select * from "UserMaster" where "nUserid" = nUserid and "isAdmin" = true )  then true  else false  end;

	select "nCaseid" into nCaseid from "FactMaster" where "nFSid" = nFSid;


	select "nRoleid" into nRoleid  from "TeamRelation" where "nUserid" = nUserid and "nCaseid" = nCaseid limit 1;
	if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then
		isAdmin := true;
	end if;

    OPEN ref FOR
        SELECT f."nFSid",f."nUserid",
		case when (f."nUserid" = nUserid or isAdmin) then true else s."bCanComment" end "bCanComment",
		case when (f."nUserid" = nUserid  or isAdmin) then true else s."bCanEdit" end "bCanEdit",
		case when (f."nUserid" = nUserid  or isAdmin) then true else s."bCanReshare" end "bCanReshare",
		case when (f."nUserid" = nUserid  or isAdmin) then true else s."nFSid" is not null end "bCanView"
		from "FactMaster" f
		left join "FMShared" s on s."nFSid" = f."nFSid" and s."nUserid" = nUserid
		where f."nFSid" = nFSid; --and "nUserid" = nUserid;


    RETURN ref;
END;
$$;

-- ===== public.et_fact_update(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_fact_update(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$

DECLARE nFSid uuid;jDate jsonb;jC jsonb;jIssue jsonb;jL jsonb;jT jsonb;jTexts jsonb;jU jsonb;
nFiletype int;nStatus int;nTZid int;nColorid uuid;nFMLid uuid;rec record;Color text;
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
$$;

-- ===== public.et_get_bundle_links(json, refcursor, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_get_bundle_links(parameter json, ref1 refcursor, ref2 refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$declare nUserid uuid;nBundledetailid uuid;cFlag text;
isAdmin boolean default false;
	nCaseid uuid; nTeamid uuid;nRoleid uuid;

BEGIN
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
cFlag := parameter ->>'cFlag';

	select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nUserid;
	 	select "nCaseid" into nCaseid from bundlesource where  "nBundledetailid" =  nBundledetailid;

	select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nUserid and "nCaseid" = nCaseid limit 1;
	 raise notice 'nCaseid , nRoleid  %,%,% nTeamid &',nCaseid,nRoleid,nTeamid ;
	if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then
		isAdmin := true;
	end if;

-- select * from "DocDetail" where
if(cFlag='DL')then

open ref1 for
select  d."nDocid",dd."jLinktype",
jsonb_agg(distinct jsonb_build_object('nBundledetailid',dl."nBundledetailid",'nDMLid',dl."nDMLids",'jLinktype',dl."jLinktype",
											'cTab',bdl."cTab",'cExhibitno',bdl."cExhibitno",'cFilename',bdl."cFilename",'cBundletag',bm."cBundletag",'cPath',bdl."cPath")) sublist
from "DocMaster" d
join "DocDetail" dd on dd."nDocid" = d."nDocid"
join "DMLinks" dl on dl."nDocid" = d."nDocid"
join "BundleDetail" bd on bd."nBundledetailid" = d."nBundledetailid"
join "BundleDetail" bdl on bdl."nBundledetailid" = dl."nBundledetailid"
left join "DMShared" ds on ds."nDocid" = d."nDocid"  and ds."nUserid" = nUserid
left join "LocationShare" ls on ls."nBundledetailid" = d."nBundledetailid" and ls."nUserid" = nUserid
left join "BundleMaster" bm on bm."nBundleid" = bdl."nBundleid"
left join "TeamRelation" tr ON tr."nTeamid" =  nTeamid
where d."nBundledetailid" = nBundledetailid  and (d."nUserid" = nUserid or ls."nUserid" = d."nUserid" or ds."nUserid" = nUserid  or (case when  isAdmin = true then  d."nUserid" = tr."nUserid" else false end))
group by d."nDocid",dd."jLinktype"
;
elsif(cFlag='FL') then
-- select * from "FactMaster"

open ref1 for
select f."nFSid",fd."jLinktype",
jsonb_agg(distinct jsonb_build_object('nBundledetailid',fl."nBundledetailid",'nDMLid',fl."nFMLid",'jLinktype',fl."jLinktype",
											'cTab',bd."cTab",'cExhibitno',bd."cExhibitno",'cFilename',bd."cFilename",'cBundletag',bm."cBundletag",'cPath',bd."cPath",'nPage',fd."nPage")) sublist
from "FactMaster" f
join "FactDetail" fd on fd."nFSid" = f."nFSid"
join "FMLinks" fl on fl."nFSid" = f."nFSid"
join "BundleDetail" bd on bd."nBundledetailid" = fl."nBundledetailid"
left join "BundleMaster" bm on bm."nBundleid" = bd."nBundleid"
left join "LocationShare" ls on ls."nBundledetailid" = fl."nBundledetailid" and ls."nUserid" = nUserid
left join "FMShared" fs on fs."nFSid" = f."nFSid"  and fs."nUserid" = nUserid
left join "TeamRelation" tr ON tr."nTeamid" =  nTeamid
 where  f."nBundledetailid" = nBundledetailid and (f."nUserid" = nUserid or ls."nUserid" = f."nUserid" or fs."nUserid" = nUserid  or (case when  isAdmin = true then  f."nUserid" = tr."nUserid" else false end))
 group by f."nFSid",fd."jLinktype";
 elsif(cFlag='WL') then
-- select * from "FactMaster"

open ref1 for
select w."nWebid",wd."cUrl",wd."cTitle",wd."cNote",wd."cUrl",wd."jLinktype"
from "WebMaster" w
join "WebDetail" wd on wd."nWebid" = w."nWebid"
left join "WMShared" ws on ws."nWebid" = w."nWebid"  and ws."nUserid" = nUserid
 where  w."nBundledetailid" = nBundledetailid  and (w."nUserid" = nUserid or ws."nUserid" = nUserid );

 elsif(cFlag='F') then
-- select "bIsHighlighted",* from "FactDetail"

open ref1 for
with tm as
(select f."nFSid",fd."jLinktype",fd."jTexts",fd."cTooltype",fd."jOT",fd."bIsHighlighted",fd."nPage",
jsonb_agg(distinct jsonb_build_object('nIid',im."nIid",'cIName',im."cIName",'cCategory',ic."cCategory",'cColor',im."cColor",'cRel',rl."cCodename",'nImpactid',fi."nImpactid",'nSerialno',rl."nSerialno",'nISerialno',impct."nSerialno")  ) "jIssue"
from "FactMaster" f
join "FactDetail" fd on fd."nFSid" = f."nFSid"
JOIN "FMIssue" fi ON fi."nFSid" = f."nFSid"
JOIN "RIssueMaster" im ON im."nIid" = fi."nIssueid"
JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"
LEFT JOIN "Codemaster" rl ON rl."nCodeid" = fi."nRelevanceid"
LEFT JOIN "Codemaster" impct ON impct."nCodeid" = fi."nImpactid"
 left join "FMShared" fs on fs."nFSid" = f."nFSid"  and fs."nUserid" = nUserid
left join "TeamRelation" tr ON tr."nTeamid" =  nTeamid
left join "LocationShare" ls on ls."nBundledetailid" = f."nBundledetailid" and ls."nUserid" = nUserid
 where  f."nBundledetailid" = nBundledetailid and (f."nUserid" = nUserid  or  ls."nUserid" = f."nUserid" or fs."nUserid" = nUserid or (case when  isAdmin = true then  f."nUserid" = tr."nUserid" else false end))  and f."cFType" = 'F'
 group by f."nFSid",fd."jLinktype",fd."jTexts",fd."jOT",fd."bIsHighlighted",fd."cTooltype",fd."nPage")
select t."nFSid",t."jLinktype",t."jTexts",t."cTooltype",t."jOT",t."bIsHighlighted",t."nPage",jsonb_agg(issue order by issue->>'nSerialno',issue->>'nISerialno') "jIssue" from tm t,jsonb_array_elements(t."jIssue") issue
 group by t."nFSid",t."jLinktype",t."jTexts",t."cTooltype",t."jOT",t."bIsHighlighted",t."nPage"
 ;


 elsif(cFlag='QF') then
-- select "bIsHighlighted",* from "FactDetail"

open ref1 for
with tm as
(select f."nFSid",fd."jLinktype",fd."jTexts",fd."cTooltype",fd."jOT",fd."bIsHighlighted",fd."nPage",
jsonb_agg(distinct jsonb_build_object('nIid',im."nIid",'cIName',im."cIName",'cCategory',ic."cCategory",'cColor',im."cColor",'cRel',rl."cCodename",'nImpactid',fi."nImpactid",'nSerialno',rl."nSerialno",'nISerialno',impct."nSerialno")  ) "jIssue"
from "FactMaster" f
join "FactDetail" fd on fd."nFSid" = f."nFSid"
JOIN "FMIssue" fi ON fi."nFSid" = f."nFSid"
JOIN "RIssueMaster" im ON im."nIid" = fi."nIssueid"
JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"
LEFT JOIN "Codemaster" rl ON rl."nCodeid" = fi."nRelevanceid"
LEFT JOIN "Codemaster" impct ON impct."nCodeid" = fi."nImpactid"
left join "TeamRelation" tr ON tr."nTeamid" =  nTeamid
 where  f."nBundledetailid" = nBundledetailid and (f."nUserid" = nUserid  or (case when  isAdmin = true then  f."nUserid" = tr."nUserid" else false end)) and f."cFType" = 'QF'
 group by f."nFSid",fd."jLinktype",fd."jTexts",fd."jOT",fd."bIsHighlighted",fd."cTooltype",fd."nPage")
select t."nFSid",t."jLinktype",t."jTexts",t."cTooltype",t."jOT",t."bIsHighlighted",t."nPage",jsonb_agg(issue order by issue->>'nSerialno',issue->>'nISerialno') "jIssue" from tm t,jsonb_array_elements(t."jIssue") issue
 group by t."nFSid",t."jLinktype",t."jTexts",t."cTooltype",t."jOT",t."bIsHighlighted",t."nPage"
 ;




else

-- select * from "WebDetail"
open ref1 for
select w."nWebid",w."nBundledetailid" "nId",wd."jLinktype",wd."cUrl",wd."cTitle",wd."cNote",wd."cImg",wd."cFavicon"
from "WebMaster" w
join "WebDetail" wd on wd."nWebid" = w."nWebid"
left join "LocationShare" ls on ls."nBundledetailid" = w."nBundledetailid" and ls."nUserid" = nUserid
left join "BundleDetail" bd on bd."nBundledetailid" = w."nBundledetailid"
left join "BundleMaster" bm on bm."nBundleid" = bd."nBundleid"
 where  w."nBundledetailid" = nBundledetailid  and (w."nUserid" = nUserid or ls."nUserid" = nUserid)
;
end if;

RETURN next ref1 ;

open ref2 for select 1 msg;
RETURN next ref2 ;
-- select * from "bundlelist"

                                                      -- Return the cursor to the caller
    END;$$;

-- ===== public.et_index_getfiles(json, refcursor, refcursor, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_index_getfiles(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$
DECLARE
    nMasterid UUID;
    nCaseid UUID;
    nSectionid UUID;
    oldPath TEXT;
    nBundledetailid UUID;
    ZeroUUID UUID := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
    -- Apply P-1: Blank string → NULL conversion with explicit UUID casting
    nCaseid := NULLIF(parameter->>'nCaseid', '')::uuid;
    nMasterid := NULLIF(parameter->>'nMasterid', '')::uuid;
    nSectionid := NULLIF(parameter->>'nSectionid', '')::uuid;

    /*
    select * from et_index_getfiles (
      '{"nCaseid":"c21acb04-16cd-4aba-a966-490a13c7ffec",
        "nSectionid":"8166acd3-70e8-47ce-8362-443cd69b9b37",
        "cHyperlinktype":"T",
        "column":"[\"Tab\",\"cTab\",70],[\"Name\",\"cFilename\",\"*\"],[\"Date of Interest\",\"dIntrestDt\",70],[\"Description\",\"cDescription\",80],[\"Page\",\"cRefpage\",40],[\"Exhibit\",\"cExhibitno\",75]",
        "bCoverpg":true,
        "bIndexpg":true,
        "nMasterid":"8166acd3-70e8-47ce-8362-443cd69b9b37"}',
      'r1','r2','r3'
    );
    fetch all in "r1";
    fetch all in "r2";
    */

    SELECT "cPath", "nBundledetailid" INTO oldPath, nBundledetailid
    FROM "BundleDetail"
    WHERE "nSectionid" = nSectionid AND "cIsindex" = true;

    DELETE FROM "Annotations" a
    WHERE "nHLid" IN (
        SELECT "nHLid" FROM "HyperLink"
        WHERE "nBundledetailid" = nBundledetailid
    );

    OPEN ref1 FOR
    SELECT
        "nCaseid", "cCasename", "cCaseno", "dCreateDt", "cClaimant",
        "cRespondent", "cIndexheader", oldPath AS "oldPath"
    FROM "CaseMaster"
    WHERE "nCaseid" = nCaseid;

    RETURN NEXT ref1;

    OPEN ref2 FOR
    SELECT
        "nBundledetailid", t."nBundleid", "cFilename"::text,
        "cTab"::text, "cExhibitno"::text, "cRefpage"::text,
        "dIntrestDt"::text, "cDescription"::text, "cAuthor"::text,
        array_to_string(t.sub_info, ' / ') AS sub_info,
        t.kind::text, t."cBundletag"::text, t."nParentBundleid"
    FROM (
        WITH RECURSIVE bdl_tree AS (
            SELECT
                bm."nBundleid", bm."cBundlename"::text AS "cBundlename", bm."nParentBundleid",
                ARRAY[bm."cBundlename"::text] AS sub_info, bm."nSectionid", bm."cBundletag",
                sorted_bundletag,sorted_name
            FROM "BundleMaster" bm
            JOIN "SectionMaster" sm ON sm."nSectionid" = bm."nSectionid"
            WHERE (bm."nParentBundleid" = ZeroUUID OR bm."nParentBundleid"  IS NOT DISTINCT FROM NULL) AND sm."nCaseid" = nCaseid AND bm."nSectionid" = nSectionid

            UNION ALL

            SELECT
                c."nBundleid", c."cBundlename", c."nParentBundleid",
                p.sub_info || c."cBundlename"::text, c."nSectionid", c."cBundletag",case when c."cBundletag" = p."cBundletag" then (p.sorted_bundletag || c.sorted_name) else (p.sorted_bundletag || c.sorted_bundletag) end,p.sorted_name || c.sorted_name
            FROM "BundleMaster" c
            JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"
        )
        SELECT
            NULL AS "nBundledetailid", t."nBundleid", t."cBundlename"::text AS "cFilename",
            t."cBundlename"::text AS "cTab", ''::text AS "cExhibitno", ''::text AS "cRefpage",
                ''::text AS "dIntrestDt", ''::text AS "cDescription", ''::text AS "cAuthor", t.sub_info,''::text kind,t."cBundletag", t."nParentBundleid",sorted_bundletag as sorted_tab,sorted_name
        FROM bdl_tree t
        LEFT JOIN bundlesource b ON t."nBundleid" = b."nBundleid"
		 WHERE case when (t."nParentBundleid" IS NULL OR t."nParentBundleid" = '00000000-0000-0000-0000-000000000000') then true else b."nBundleid"  IS DISTINCT FROM NULL end
        GROUP BY
            t."nBundleid", t."nParentBundleid", t."cBundlename", t.sub_info,
            t."cBundletag", sorted_bundletag, sorted_name

        UNION ALL

        SELECT
            bd."nBundledetailid", NULL AS "nBundleid",
            REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '')::text AS "cFilename",
            bd."cTab"::text,
            TRIM(REPLACE(REPLACE(COALESCE(bd."cExhibitno", ''), E'\n', ''), E'\r', ''))::text AS "cExhibitno",
            COALESCE(bd."cRefpage", '')::text, COALESCE(bd."dIntrestDt", '')::text AS "dIntrestDt",
            COALESCE(bd."cDesc", '')::text AS "cDescription", COALESCE(bd."cAuthor", '')::text AS "cAuthor",
            p.sub_info || (CASE WHEN COALESCE(bd."cTab"::text,'') = '' THEN bd."cFilename"::text ELSE bd."cTab"::text END),
            "cFiletype"::text AS kind, p."cBundletag", NULL AS "nParentBundleid",
            p.sorted_bundletag || bd.sorted_tab,p.sorted_name || bd.sorted_name
        FROM "BundleDetail" bd
        JOIN bdl_tree p ON bd."nBundleid" = p."nBundleid"
    ) t
    ORDER BY sorted_tab nulls first,sorted_name nulls first;

    RETURN NEXT ref2;

    OPEN ref3 FOR
    WITH tm AS (
        SELECT DISTINCT
            bd."nBundledetailid",
            REPLACE(REPLACE(bd."cFilename", E'\n', ''), E'\r', '') AS "cFilename",
            TRIM(REPLACE(REPLACE(COALESCE(bd."cExhibitno", ''), E'\n', ''), E'\r', '')) AS "cExhibitno",
            "nSectionid", COALESCE(bd."cRefpage", '') AS "cRefpage",
            TRIM(COALESCE(bd."cTab", '')) AS "cTab",
            COALESCE(bd."dIntrestDt", '')::text AS "dIntrestDt",
            COALESCE(bd."cDesc", '')::text AS "cDescription",
            COALESCE(bd."cAuthor", '')::text AS "cAuthor",
            "cFiletype"::text AS kind, sorted_tab, sorted_name
        FROM "BundleDetail" bd
        WHERE
            COALESCE(bd."nBundleid", ZeroUUID) = ZeroUUID
            AND bd."nSectionid" = nSectionid
            AND bd."cIsindex" != true
        ORDER BY sorted_tab NULLS FIRST, sorted_name NULLS FIRST
    )
    SELECT
        "nBundledetailid", "cFilename", "cExhibitno", "nSectionid",
        "cRefpage", "cTab", "dIntrestDt", "cDescription", "cAuthor", "kind"
    FROM tm;

    RETURN NEXT ref3;
END;
$$;

-- ===== public.et_navigate_bundletabs(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_navigate_bundletabs(parameter json, ref1 refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$
declare nMasterid uuid;nSectionid uuid;nBundleid uuid;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;
	-- select * from et_navigate_bundletabs ('{"nSectionid":92,"nBundleid":1344752,"nMasterid":59}','r1');fetch all in "r1";
OPEN ref1 FOR

select b."cTab",b."nBundledetailid","cPage" from "BundleDetail" b
left join "BMPermission" p on p."nUserid" = nMasterid and p."nBundleid" = b."nBundleid"
where p."nBMPid" is null  and b."nBundleid" = nBundleid and
  b."nSectionid" = nSectionid and coalesce("cTab",'') != ''
  group by b."cTab",b."nBundledetailid","cPage",sorted_tab
order by sorted_tab;

RETURN NEXT ref1;

END;
$$;

-- ===== public.et_navigate_factlist(json, refcursor, refcursor, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_navigate_factlist(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$
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
           fd."jTexts", fd."jOT", fd."nColorid", fd."nStatus",
           cl."cColor" AS "cColor", fd."jDate",
           cm."cCodename" as "cDatetype",
           st."cCodename" as "cStatus",
           ftp."cCodename" as "cFiletype",
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
    JOIN "RIssueMaster" cl ON cl."nIid" = fd."nColorid"
    WHERE f."nFSid" = ANY(factids)
	group by f."nFSid", f."dCreateDt",
           um."cFname" ,um."cLname",um."nUserid",
           fd."nFiletype", fd."nTZid", tz."cCodename",
           fd."jLinktype", fd."cType", f."cFType",
           fd."jTexts", fd."jOT", fd."nColorid", fd."nStatus",
           cl."cColor", fd."jDate",cm."cCodename",st."cCodename", ftp."cCodename"
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
$$;

-- ===== public.et_preview_document_list_1(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_preview_document_list_1(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$
DECLARE
    nUserid UUID;
    nBundledetailid UUID;
    nCaseid UUID;
    nSectionid UUID;
    cUsername TEXT;
    factlinks JSONB;
    casedetail JSONB;
    factsheet JSONB;
	doclinks JSONB;
	weblinks JSONB;
	nExportid uuid;

    ZeroUUID UUID := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
    -- Apply P-1: Blank string → NULL conversion with explicit UUID casting
    nUserid := NULLIF(parameter ->>'nMasterid', '')::uuid;
    nBundledetailid := NULLIF(parameter ->>'nBundledetailid', '')::uuid;
	nExportid := NULLIF(parameter ->>'nExportid', '')::uuid;

    /*
     select * from et_preview_document_list (
       '{"nBundledetailid":"8166acd3-70e8-47ce-8362-443cd69b9b37",
         "nMasterid":"8166acd3-70e8-47ce-8362-443cd69b9b37"}',
       'r1'
     );
     FETCH All in "r1";
    */

    -- Get section and case IDs
    SELECT "nSectionid" INTO nSectionid
    FROM "BundleDetail"
    WHERE "nBundledetailid" = nBundledetailid;

    SELECT "nCaseid" INTO nCaseid
    FROM "SectionMaster"
    WHERE "nSectionid" = nSectionid;

    -- Get username
    SELECT "cFname" || ' ' || "cLname" INTO cUsername
    FROM "UserMaster"
    WHERE "nUserid" = nUserid;

    -- Build case detail JSON
    SELECT jsonb_agg(t) INTO casedetail
    FROM (
        SELECT
            c."nCaseid", c."cCasename", c."cDesc", c."cCaseno",
            to_char(now(), 'Mon dd,yyyy') AS "dExportdt"
        FROM "CaseMaster" c
        WHERE "nCaseid" = nCaseid
    ) t;

   select jsonb_agg(t) into factlinks from (
	  select f."nFSid", f."nBundledetailid", f."cFType", fd."cType", bd."cPage", null as "text", "jOT" as "jTexts", false as "isHighlight", fd."jLinktype",
	  bd."cTab", bm."cBundletag", bd."cExhibitno",
	  COALESCE(jsonb_agg(l) FILTER (WHERE l."nFSid" IS NOT NULL), '[]'::jsonb) as "jFiles"
	  from "FactMaster" f
	  join "FactDetail" fd on fd."nFSid" = f."nFSid"
	  join "BundleDetail" bd on bd."nBundledetailid" = f."nBundledetailid"
	  left join "BundleMaster" bm on bm."nBundleid" = bd."nBundleid"
	  left join (
	    select f."nFSid", t."nBundledetailid", d."cFilename", d."cPage", d."cTab", bm1."cBundletag", t."jLinktype"
	    from "FactMaster" f
	    join "FMLinks" t on t."nFSid" = f."nFSid"
	    join "BundleDetail" d on d."nBundledetailid" = t."nBundledetailid"
	    left join "BundleMaster" bm1 on bm1."nBundleid" = d."nBundleid"
	  ) l on l."nFSid" = f."nFSid"
		left join "FMIssue" i on i."nFSid"  = f."nFSid"
		left join "FMContact" c on c."nFSid"  = f."nFSid"
	  left join "ExportMaster" m on m."nExportid" = nExportid
	  where f."nUserid" = nUserid and f."nBundledetailid" = nBundledetailid and
	   case when m."bFact" = true  and m."bQfact" = true then  true when  m."bFact" = true then f."cFType" = 'F' when  m."bQfact" = true then f."cFType" = 'QF'  else false end
	and	 (case when
	(jsonb_array_length(m."jQFIssue") > 0 or jsonb_array_length(m."jFIssue") > 0) or
	(jsonb_array_length(m."jQFContact") > 0 or jsonb_array_length(m."jFContact") > 0) then

	(case when jsonb_array_length(m."jQFIssue") > 0 and jsonb_array_length(m."jFIssue") > 0  then ( (m."jQFIssue" @> to_jsonb(i."nIssueid"::text) and  f."cFType"  =  'QF') or  ( m."jFIssue" @> to_jsonb(i."nIssueid"::text) and f."cFType"  =  'F') ) when jsonb_array_length(m."jQFIssue") > 0 and  f."cFType"  =  'QF' then m."jQFIssue" @> to_jsonb(i."nIssueid"::text)

	when jsonb_array_length(m."jFIssue") > 0 and  f."cFType"  =  'F' then m."jFIssue" @> to_jsonb(i."nIssueid"::text) else false end
	)
	or
	(case when jsonb_array_length(m."jQFContact") > 0 and jsonb_array_length(m."jFContact") > 0  then ( (m."jQFContact" @> to_jsonb(c."nContactid"::text) and  f."cFType"  =  'QF') or  ( m."jFContact" @> to_jsonb(c."nContactid"::text) and  f."cFType"  =  'F') ) when jsonb_array_length(m."jQFContact") > 0 and  f."cFType"  =  'QF' then m."jQFContact" @> to_jsonb(c."nContactid"::text)

	when jsonb_array_length(m."jFContact") > 0 and  f."cFType"  =  'F' then m."jFContact" @> to_jsonb(c."nContactid"::text) else false end

	)
	else true end
	)
	  group by f."nFSid", f."nBundledetailid", fd."cType", fd."jLinktype", "jOT", bd."cPage", bd."cTab", bm."cBundletag", bd."cExhibitno"
	)t;

	-- DOC LINKS ONLY
	select jsonb_agg(t) into doclinks from (
	  select  d."nDocid", d."nBundledetailid", dd."cType", bd."cPage", null as "text", "jOText" as "jTexts", false as "isHighlight", dd."jLinktype", bd."cTab",
	  bm."cBundletag", bd."cExhibitno",
	  COALESCE(jsonb_agg(l) FILTER (WHERE l."nDocid" IS NOT NULL), '[]'::jsonb) as "jFiles"
	  from "DocMaster" d
	  join "DocDetail" dd on dd."nDocid" = d."nDocid"
	  join "BundleDetail" bd on bd."nBundledetailid" = d."nBundledetailid"
	  left join "BundleMaster" bm on bm."nBundleid" = bd."nBundleid"
	  left join (
	    select d."nDocid", t."nBundledetailid", bd2."cFilename", bd2."cPage", bd2."cTab", bm2."cBundletag", t."jLinktype"
	    from "DocMaster" d
	    join "DMLinks" t on t."nDocid" = d."nDocid"
	    join "BundleDetail" bd2 on bd2."nBundledetailid" = t."nBundledetailid"
	    left join "BundleMaster" bm2 on bm2."nBundleid" = bd2."nBundleid"
	  ) l on l."nDocid" = d."nDocid"
	  where d."nUserid" = nUserid and d."nBundledetailid" = nBundledetailid
	  group by d."nDocid", d."nBundledetailid", dd."cType", dd."jLinktype", "jOText", bd."cPage", bd."cTab", bm."cBundletag", bd."cExhibitno"
	)t;


	-- WEB LINKS (no link table assumed for now)
	select jsonb_agg(t) into weblinks from (
	  select w."nWebid", w."nBundledetailid", wd."cType", bd."cPage",
	  wd."cUrl",
	  wd."cTitle",
	  wd."cNote",
	  null as "text", "jOText" as "jTexts", false as "isHighlight", wd."jLinktype", bd."cTab", bm."cBundletag", bd."cExhibitno",
	  '[]'::jsonb as "webLinks"
	  from "WebMaster" w
	  join "WebDetail" wd on wd."nWebid" = w."nWebid"
	  join "BundleDetail" bd on bd."nBundledetailid" = w."nBundledetailid"
	  left join "BundleMaster" bm on bm."nBundleid" = bd."nBundleid"
	  where w."nUserid" = nUserid and w."nBundledetailid" = nBundledetailid
	)t;
    -- Build fact sheet JSON
    SELECT jsonb_agg(t) INTO factsheet FROM (
        WITH fdetail AS (
            	SELECT f."nFSid", "jTexts",
                CASE
                    WHEN ("jLinktype"->>'pages')::jsonb IS NOT NULL
                    AND jsonb_array_length(("jLinktype"->>'pages')::jsonb) > 0
                    THEN ("jLinktype"->>'pages')::jsonb
                    ELSE '[]'::jsonb
                END AS "cPage",
                fd."cType"
            FROM "FactMaster" f
            JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"
            WHERE
                "nBundledetailid" = nBundledetailid
                AND f."nUserid" = nUserid
        ),
        issuelist AS (
            SELECT
				i."nIssueid",
                f_1."nFSid",
                im."cIName" AS "cIssue",
                im."cColor" AS "cClr",
                r."cCodename" AS "cRelevance",
                imp."cCodename" AS "cImpact",
                ic."cCategory"
            FROM "fdetail" f_1
            JOIN "FMIssue" i ON i."nFSid" = f_1."nFSid"
            JOIN "RIssueMaster" im ON im."nIid" = i."nIssueid"
            JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"
            LEFT JOIN "Codemaster" r ON r."nCodeid" = i."nRelevanceid"
            LEFT JOIN "Codemaster" imp ON imp."nCodeid" = i."nImpactid"
        ),
        contacts AS (
            SELECT
                c_1."cFname",
                c_1."nContactid",
                f_1."nFSid",
                c_1."cProfile",
                c_1."cLname",
                c_1."cAlias",
                c_1."cEmail"
            FROM "fdetail" f_1
            JOIN "FMContact" fc ON fc."nFSid" = f_1."nFSid"
            JOIN "ContactMaster" c_1 ON c_1."nContactid" = fc."nContactid"
        )

        SELECT
            jsonb_agg(c) AS "jContacts",
            f."nFSid", f."jTexts", "cPage", f."cType",
            jsonb_agg(i) AS issuelist
        FROM fdetail f
		join "ExportMaster" m on m."nExportid" = nExportid
        JOIN issuelist i ON i."nFSid" = f."nFSid"
        LEFT JOIN contacts c ON c."nFSid" = f."nFSid"
		where  case when m."bFact" = true  and m."bQfact" = true then  true when  m."bFact" = true then f."cType" = 'F' when  m."bQfact" = true then f."cType" = 'QF'  else false end
	and	 (case when
	(jsonb_array_length(m."jQFIssue") > 0 and jsonb_array_length(m."jFIssue") > 0) or
	(jsonb_array_length(m."jQFContact") > 0 and jsonb_array_length(m."jFContact") > 0) then

	(case when jsonb_array_length(m."jQFIssue") > 0 and jsonb_array_length(m."jFIssue") > 0  then (( m."jQFIssue" @> to_jsonb(i."nIssueid"::text) and  f."cType"  =  'QF') or  ( m."jFIssue" @> to_jsonb(i."nIssueid"::text) and  f."cType"  =  'F') ) when jsonb_array_length(m."jQFIssue") > 0 and  f."cType"  =  'QF' then m."jQFIssue" @> to_jsonb(i."nIssueid"::text)

	when jsonb_array_length(m."jFIssue") > 0 and  f."cType"  =  'F' then m."jFIssue" @> to_jsonb(i."nIssueid"::text) else false end
	)
	or
	(case when jsonb_array_length(m."jQFContact") > 0 and jsonb_array_length(m."jFContact") > 0  then (( m."jQFContact" @> to_jsonb(c."nContactid"::text) and f."cType"  =  'QF') or   (m."jFContact" @> to_jsonb(c."nContactid"::text) and f."cType"  =  'F') ) when jsonb_array_length(m."jQFContact") > 0 and  f."cType"  =  'QF' then m."jQFContact" @> to_jsonb(c."nContactid"::text)

	when jsonb_array_length(m."jFContact") > 0 and  f."cType"  =  'F' then m."jFContact" @> to_jsonb(c."nContactid"::text) else false end

	)
	else true end
	)
        GROUP BY f."nFSid", f."jTexts", "cPage", f."cType"
    ) t;

    OPEN ref FOR
    SELECT
        cUsername AS "cUsername",
        COALESCE(casedetail, '[]') AS casedetail,
        COALESCE(factsheet, '[]'::jsonb) AS "factsheet",
        COALESCE(factlinks, '[]'::jsonb) AS factlinks,
		coalesce(doclinks,'[]'::jsonb) as doclinks,
		coalesce(weblinks,'[]'::jsonb) as weblinks;

    RETURN ref;  -- Return the cursor to the caller
END;
$$;

-- ===== public.et_realtime_handle_issue_category(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_realtime_handle_issue_category(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$
DECLARE
    nICid UUID;
    nCaseid UUID;
    cCategory VARCHAR(200);
    nUserid UUID;
    dCreateDt TIMESTAMP;
    dUpdateDt TIMESTAMP;
    cICtype CHAR(1);
    inserted_id UUID;
    msg_text TEXT;
    msg SMALLINT;
BEGIN
    nICid := NULLIF(parameter ->> 'nICid','')::UUID;
    nCaseid := NULLIF(parameter ->> 'nCaseid','')::UUID;
    cCategory := parameter ->> 'cCategory';
    nUserid := NULLIF(parameter ->> 'nUserid','')::UUID;
    dCreateDt := (parameter ->> 'dCreateDt')::TIMESTAMP;
    dUpdateDt := (parameter ->> 'dUpdateDt')::TIMESTAMP;
    cICtype := (parameter ->> 'cICtype')::CHAR(1);
    msg := 1;

    IF cICtype = 'I' THEN
        -- Check if the category already exists for the given case ID
        IF EXISTS (
            SELECT 1
            FROM "IssueCategory"
            WHERE "cCategory" = cCategory
            AND "nCaseid" = nCaseid
			 and "nUserid" =nUserid
        ) THEN
            msg := -1;
            msg_text := 'Category already exists for the given case ID';
        ELSE
            INSERT INTO "IssueCategory" ("nCaseid", "cCategory", "nUserid", "dCreateDt")
            VALUES (nCaseid, cCategory, nUserid, dCreateDt)
            RETURNING "nICid" INTO inserted_id;
            msg_text := 'Inserted';
        END IF;
    ELSIF cICtype = 'U' THEN
        -- Check if a different category with the same name already exists for the given case ID
        IF EXISTS (
            SELECT 1
            FROM "IssueCategory"
            WHERE "cCategory" = cCategory
            AND "nCaseid" = nCaseid
			and "nUserid" =nUserid
            AND "nICid" != nICid
        ) THEN
            msg := -1;
            msg_text := 'Category already exists for the given case ID';
        ELSE
            UPDATE "IssueCategory"
            SET "cCategory" = cCategory,
                "nUserid" = nUserid,
                "dUpdateDt" = dUpdateDt
            WHERE "nICid" = nICid;
            msg_text := 'Updated';
        END IF;
    ELSIF cICtype = 'D' THEN
        -- Check if the category exists for the given case ID and category ID
        DELETE FROM "IssueCategory"
        WHERE "nICid" = nICid
        AND "nCaseid" = nCaseid;
        msg_text := 'Deleted';
    ELSE
        msg := -1;
        msg_text := 'Invalid operation type';
    END IF;

    OPEN ref FOR
        SELECT msg, msg_text AS message, inserted_id AS "nICid";
    RETURN ref;
END;
$$;

-- ===== public.et_realtime_handle_issue_master(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_realtime_handle_issue_master(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$
DECLARE
    nIid UUID;
    cIName VARCHAR(100);
    cColor VARCHAR(6);
    nICid UUID;
    dCreatedt TIMESTAMP;
    nUserid UUID;
    dUpdatedt TIMESTAMP;
    cPermission CHAR(1);
    inserted_id UUID;
    msg_text TEXT;
    msg smallint;
    nCaseid UUID;
	v_factid uuid;
BEGIN
    nIid := NULLIF(parameter ->> 'nIid','')::UUID;
    cIName := parameter ->> 'cIName';
    cColor := parameter ->> 'cColor';
    nICid := NULLIF(parameter ->> 'nICid','')::UUID;
    dCreatedt := (parameter ->> 'dCreatedt')::TIMESTAMP;
    nUserid := NULLIF(parameter ->> 'nUserid','')::UUID;
    nCaseid := NULLIF(parameter ->> 'nCaseid','')::UUID;
    dUpdatedt := (parameter ->> 'dUpdatedt')::TIMESTAMP;
    cPermission := (parameter ->> 'cPermission')::CHAR(1);

    msg := 1;

    IF cPermission = 'I' THEN
        -- Check if the issue name already exists
        IF EXISTS (SELECT 1 FROM "RIssueMaster" WHERE "cIName" = cIName and "nCaseid" = nCaseid and "nUserid" = nUserid) THEN
            msg := -1;
            msg_text := 'Issue name already exists';
        ELSE
            INSERT INTO "RIssueMaster" ("cIName", "cColor", "nICid", "dCreatedt", "nUserid", "nCaseid")
            VALUES (cIName, cColor, nICid, dCreatedt, nUserid, nCaseid)
            RETURNING "nIid" INTO inserted_id;
            msg_text := 'Inserted';
        END IF;
    ELSIF cPermission = 'U' THEN
        -- Check if the issue name exists

        if exists (select * from "RIssueMaster" where "nIid" = nIid and "nUserid" IS NOT NULL) then

             IF EXISTS (SELECT 1 FROM "RIssueMaster" WHERE "cIName" = cIName and "nCaseid" = nCaseid and "nUserid" = nUserid and "nIid" != nIid) THEN
                msg := -1;
                msg_text := 'Issue name already exists';
            ELSE
                UPDATE "RIssueMaster"
                SET "cColor" = cColor, "nICid" = nICid, "dUpdatedt" = dUpdatedt, "cIName" = cIName, "nCaseid" = nCaseid
                WHERE "nIid" = nIid;
                inserted_id := nIid;
                msg_text := 'Updated';
            END IF;
        else
            msg := -1;
            msg_text := 'Issue can not be update';
        end if;


    ELSIF cPermission = 'D' THEN
        -- Check if the issue name exists
        IF NOT EXISTS (SELECT * FROM "RIssueMaster" WHERE "nIid" = nIid and "nUserid" IS NOT NULL) THEN
            msg := -1;
            msg_text := 'Issue can not be delete';
        ELSE

			DELETE FROM "RIssueMaster"
			WHERE "nIid" = nIid;
            msg_text := 'Deleted';
     -- select * from et_realtime_handle_issue_master ('{""nIid"":334,""cPermission"":""D""}','r1');fetch all in ""r1"";

        -- select * from ""RHighlightMapid"" limit 0

            delete from "RIssueMapid" where "nIid" = nIid;

            UPDATE "RIssueDetail"
                SET "nLID" = COALESCE((SELECT m."nIid" FROM "RIssueMapid" m WHERE m."nIDid" = "RIssueDetail"."nIDid" ORDER BY m."serialno" ASC LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid)
                WHERE "nLID" = nIid;

            DELETE FROM "RIssueDetail" WHERE "nLID" = '00000000-0000-0000-0000-000000000000'::uuid;

            DELETE FROM "RHighlightMapid" WHERE "nIid" = nIid;

            UPDATE "RHighlights"
                      SET "nLID" = COALESCE((SELECT m."nIid" FROM "RHighlightMapid" m WHERE m."nHid" = "RHighlights"."nHid" ORDER BY m."serialno" ASC LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid)
                      WHERE "nLID" = nIid;

            DELETE FROM "RHighlights" WHERE "nLID" = '00000000-0000-0000-0000-000000000000'::uuid;

            UPDATE "RSessionDetail" SET "nLID" = null WHERE "nLID" = nIid;

            UPDATE "RSessionDetail" SET "nLIid" = null WHERE "nLIid" = nIid;

			-- Remove nIid from cDefHIssues and cDefIssues in RSessionDetail
			UPDATE "RSessionDetail"
			SET "cDefHIssues" = (
				SELECT jsonb_agg(elem)
				FROM jsonb_array_elements("RSessionDetail"."cDefHIssues") AS elem
				WHERE elem->>'nIid' <> nIid::text
				)
			WHERE "cDefHIssues" @> ('[{"nIid": "' || nIid::text || '"}]')::jsonb;

			UPDATE "RSessionDetail"
			SET "cDefIssues" = (
				SELECT jsonb_agg(elem)
				FROM jsonb_array_elements("RSessionDetail"."cDefIssues") AS elem
				WHERE elem->>'nIid' <> nIid::text
				)
			WHERE "cDefIssues" @> ('[{"nIid": "' || nIid::text || '"}]')::jsonb;

			drop table if exists deleted_issues;

			CREATE TEMP TABLE deleted_issues as
				with delete_op as (
					DELETE FROM "FMIssue"
					WHERE "nIssueid" = nIid
					-- RETURNING "nFSid"
					RETURNING "nFSid"
				) select * from delete_op;

			DELETE FROM "FactMaster"
			WHERE "nFSid" IN (
			SELECT df."nFSid"
			FROM deleted_issues df
			LEFT JOIN "FMIssue" fi ON fi."nFSid" = df."nFSid"
			WHERE fi."nFSid" IS NULL
			);

			/*WITH remaining_issues AS (
				select r."nSerialno", i."nSerialno", *
				from "FMIssue" fmi
				left join "Codemaster" r on r."nCodeid" = fmi."nRelevanceid"
				left join "Codemaster" i on i."nCodeid" = fmi."nImpactid"
				INNER JOIN deleted_issues di ON fmi."nFSid" = di."nFSid"
				-- where fmi."nFSid" = '6d778adc-5da2-4e63-853b-1116cab41684'
				order by coalesce(r."nSerialno",999),coalesce(i."nSerialno",999)

				),
			 	ranked_issues AS (
			 	SELECT DISTINCT ON (ri."nFSid")
			 		ri."nFSid",
			 		ri."nIssueid"
			 	FROM remaining_issues ri
			 	ORDER BY ri."nFSid", ri.relevance_serial, ri.impact_serial
			 	)*/
				with lastcolorissue as (
					SELECT DISTINCT ON (fmi."nFSid")
					   fmi."nFSid",
					    fmi."nIssueid"
					FROM "FMIssue" fmi
					LEFT JOIN "Codemaster" r ON r."nCodeid" = fmi."nRelevanceid"
					LEFT JOIN "Codemaster" i ON i."nCodeid" = fmi."nImpactid"
					INNER JOIN deleted_issues di ON fmi."nFSid"::text = di."nFSid"::text
					ORDER BY fmi."nFSid", COALESCE(r."nSerialno", 999), COALESCE(i."nSerialno", 999)
					)
					-- Step 4: Update Annotations colorid with top-priority issue
					UPDATE "Annotations" a
					SET "colorid" = ri."nIssueid"
					FROM lastcolorissue ri
					WHERE a."nFSid" = ri."nFSid";

        END IF;
    ELSE
        msg := -1;
        msg_text := 'Invalid permission';
    END IF;

    OPEN ref FOR SELECT msg, msg_text AS message, inserted_id AS "nIid";

    RETURN ref;
END;
$$;

-- ===== public.et_realtime_insertupdate_session(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_realtime_insertupdate_session(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$
DECLARE
    nSesid uuid;
    cUnicuserid text;
    nCaseid uuid;
    cCaseno text;
    cName text;
    dStartDt timestamp;
    nDays integer;
    nLines integer;
    nPageno integer;
    permission text;nICid uuid;nUserid uuid;
BEGIN
    nSesid := NULLIF(parameter ->> 'nSesid','')::uuid;
    cUnicuserid := parameter ->> 'cUnicuserid';
    cCaseno := parameter ->> 'cCaseno';
    cName := parameter ->> 'cName';
    dStartDt := (parameter ->> 'dStartDt')::timestamp;
    nDays := (parameter ->> 'nDays')::int;
    nLines := (parameter ->> 'nLines')::int;
    nPageno := (parameter ->> 'nPageno')::int;
    permission := parameter ->> 'permission';

select "nUserid" into nUserid  From "RTUsers";
/*
select * from et_realtime_insertupdate_session ('{"nSesid":1,"permission":"D"}','r1');fetch all in "r1";
select * From "RIssueMaster"
select * From "RSessionMaster"

truncate table "RSessionMaster" restart identity;
truncate table "RSessionDetail" restart identity;
select * From "RIssueMaster" order by 1 desc
*/
--update "RSessionMaster" set "cStatus" ='C' where "nCaseid" = 22 and  "cStatus" !='C' and "dDelDt" is Null
    IF (permission = 'N') THEN
        nCaseid := (SELECT "nCaseid" FROM "CaseMaster" WHERE "cCaseno" = cCaseno LIMIT 1);
        IF nCaseid IS NOT NULL THEN
	--	if not exists (select * From "RSessionMaster" where "nCaseid" = nCaseid and  "cStatus" !='C' and "dDelDt" is Null ) then
            INSERT INTO "RSessionMaster"("nCaseid", "cName", "dStartDt", "nDays", "nLines", "nPageno", "cUnicuserid")
            SELECT nCaseid, cName, dStartDt + ((i-1) * interval '1 day'), i, nLines, nPageno, cUnicuserid
            FROM generate_series(1, nDays) AS i;
			if not exists (select * FRom "RIssueMaster" where "nCaseid" = nCaseid and upper("cIName") =upper('UnassignedRT issue')) then
				 if not exists (select * FROm "IssueCategory" where "nCaseid" = nCaseid and upper("cCategory") = upper('Unassigned') ) then
						insert into "IssueCategory"("nCaseid","cCategory","nUserid","dCreateDt","cICtype")
						values (nCaseid,'Unassigned',nUserid,now(),'U')
                        RETURNING "nICid" INTO nICid;
				  else
				  	select "nICid" into nICid From "IssueCategory" where "nCaseid" = nCaseid and upper("cCategory") = upper('Unassigned');
				  end if;
				  insert into "RIssueMaster"("cIName","cColor","nICid","dCreatedt","nUserid","nCaseid")
				  values ('UnassignedRT issue','fbea49',nICid,now(),'00000000-0000-0000-0000-000000000000'::uuid,nCaseid );
			end if;
            OPEN ref FOR
                SELECT 1 AS msg, 'Session created successfully' AS value, "nSesid", "dStartDt", "cUnicuserid" from "RSessionMaster" order by "nSesid" desc limit  nDays;
		--	else
			--            OPEN ref FOR
           --     SELECT -1 AS msg, 'Session already active for this case' AS value;
			--	end if;
        ELSE
            OPEN ref FOR
                SELECT -1 AS msg, 'Invalid case no' AS value;
        END IF;
    ELSIF (permission = 'E') THEN
        nCaseid := (SELECT "nCaseid" FROM "CaseMaster" WHERE "cCaseno" = cCaseno LIMIT 1);
        IF nCaseid IS NOT NULL THEN
            UPDATE "RSessionMaster"
            SET "nCaseid" = nCaseid, "cName" = cName, "nLines" = nLines, "nPageno" = nPageno ,"dStartDt" = dStartDt
            WHERE "nSesid" = nSesid;
            OPEN ref FOR
                SELECT 1 AS msg, 'Updated' AS value,nSesid as "nSesid";
        ELSE
            OPEN ref FOR
                SELECT -1 AS msg, 'Invalid case no' AS value;
        END IF;

	ELSIF (permission = 'D')THEN


		update "RSessionDetail" set "dDelDt"= now() where "nSesid" = nSesid;
		update "RSessionMaster" set "dDelDt"= now() where "nSesid" = nSesid;
-- 		delete from "RSessionDetail" where "nSesid" = nSesid;
-- 		delete from "RSessionMaster" where "nSesid" = nSesid;

		-- select * from "RSessionMaster"
		-- select * from "RSessionDetail"
		-- alter table  "RSessionDetail" add column "dDelDt" timestamp

		open ref for
		select 1 as msg,'Deleted' as value,nSesid as "nSesid";

	--session end
	ELSIF (permission = 'C')THEN

		Update 		"RSessionMaster" set "cStatus" = 'C',"dUpdatedt"=now() where  "nSesid" = nSesid;
		open ref for
		select 1 as msg,'Session end.' as value,nSesid as "nSesid";

    END IF;

    RETURN ref; -- Return the cursor to the caller
END;
$$;

-- ===== public.et_realtime_issuelist_group(json, refcursor, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_realtime_issuelist_group(parameter json, ref1 refcursor, ref2 refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$
declare nCaseid uuid;nUserid uuid;nSessionid uuid;nIDid uuid;nTeamid uuid;
isAdmin boolean default false;nRoleid uuid;
BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nSessionid := NULLIF(parameter ->>'nSessionid','')::uuid;
nIDid := NULLIF(parameter ->>'nIDid','')::uuid;
nTeamid := NULLIF(parameter ->>'nTeamid','')::uuid;

select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nUserid;
select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nUserid and "nCaseid" = nCaseid limit 1;
raise notice 'nRoleid %',nRoleid;
if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then
    isAdmin := true;
end if;

open ref1 for
select ic."nICid","cCategory",
case when (ic."nUserid" = nUserid or isAdmin) then true else false end "edit",
case when ((ic."nUserid" = nUserid or isAdmin) and count(fi."nIssueid") = 0) then true else false end "delete",
qcp."nQFactSequence" AS "nQFactSequence"
From "RIssueMaster" im
join "IssueCategory" ic on ic."nICid" = im."nICid"
left join team_issues ti on ti."nIid" = im."nIid" and ti."nTeamid" = nTeamid
left join "FMIssue" fi  on fi."nIssueid" = im."nIid"
left join realtime."RClaimSequence" rs on rs."nICid" = im."nICid" and rs."nUserid" = nUserid
left join public."RUserQFactClaimPref" qcp on qcp."nICid" = ic."nICid" and qcp."nUserid" = nUserid
where ic."nCaseid" = nCaseid
  and (ti."nIid" is not null or im."nUserid" is null)
group by "nSequence",ic."nICid","cCategory",qcp."nQFactSequence"
order by "nSequence","cCategory";

open ref2 for
select im."nIid", im."cIName", im."cColor",ic."nICid","cCategory"
,0 "nRelid",0 "nImpactid",im."nUserid",count(fi."nIssueid") "isFact",
case when (im."nUserid" = nUserid or isAdmin) and fi."nIssueid" is null then true else false end "edit",
case when ((im."nUserid" = nUserid or isAdmin) and fi."nIssueid" is null) then true else false end "delete",
um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",rs."nSequence",
qp."nQFactSequence" AS "nQFactSequence",
qp."bVisible"       AS "bQFactVisible"
From "RIssueMaster" im
LEFT JOIN "UserMaster" um ON um."nUserid" = im."nUserid"
join "IssueCategory" ic on ic."nICid" = im."nICid"
left join team_issues ti on ti."nIid" = im."nIid" and ti."nTeamid" = nTeamid
left join "FMIssue" fi  on fi."nIssueid" = im."nIid"
left join realtime."RIssueSequence" rs on rs."nIid" = im."nIid" and rs."nUserid" = nUserid
left join public."RUserQFactPref" qp on qp."nIid" = im."nIid" and qp."nUserid" = nUserid
where ic."nCaseid" = nCaseid
  and (ti."nIid" is not null or im."nUserid" is null)
group by rs."nSequence",im."nIid", im."cIName", im."cColor",ic."nICid","cCategory", im."nUserid", fi."nIssueid" ,um."cFname",um."cLname",qp."nQFactSequence",qp."bVisible"
order by "nSequence","cIName";

 RETURN next ref1;
 RETURN next ref2;
END;
$$;

-- ===== public.et_task_detail_v2(json, refcursor, refcursor, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_task_detail_v2(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$

declare nTaskid uuid; nMasterid uuid;

BEGIN
nTaskid := NULLIF(parameter ->>'nTaskid','')::uuid;
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
-- select * from et_get_taskdetail ('{""nTaskid"":86,""nMasterid"":43}','r1','r2','r3');fetch all in ""r3"";
open ref1 for

-- 	select distinct  t."nTaskid",t."nUserid" "nCreateId",td."cSubject",td."cDesc",td."jEmailnotify",td."nPriority",
-- td."nProgress",td."jTimeline",pr."cCodename" "cPriority",td."cTasktype",td."cTasktype"
-- 	from "TaskMaster" t
-- 	join "TaskDetail" td on td."nTaskid" = t."nTaskid"
-- 	left join "Codemaster" pr on pr."nCodeid" = td."nPriority"
-- 	where t."nTaskid" = nTaskid;

select distinct  t."nTaskid",t."nUserid" "nCreateId",td."cSubject",td."cDesc",td."nPriority",
td."nProgress",td."cTasktype", td."nStatus", td."dStartDt",
td."dEndDt", td."cAssign", td."cRemind",td."cStatusChange"
	from "TaskMaster" t
	join "TaskDetail" td on td."nTaskid" = t."nTaskid"
	-- left join "Codemaster" pr on pr."nCodeid" = td."nPriority"
	where t."nTaskid" = nTaskid;

 RETURN next ref1;

 open ref2 for
	select distinct  t."nUserid", "bCanComment", "bCanCopy", "bCanEdit", "bCanReshare"
	from "TaskShared" t
	where t."nTaskid" = nTaskid
	;
 RETURN next ref2;

 open ref3 for
	select "nTRid","dReminderDt"
	from "TaskReminders" t
	where t."nTaskid" = nTaskid;
 RETURN next ref3;

 -- Return the cursor to the caller
    END;
$$;

-- ===== public.et_task_insert_detail_v2(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_task_insert_detail_v2(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$
DECLARE
    nTaskid UUID;
    cSubject text;
    cDesc text;
    jEmailnotify jsonb;
    nPriority int;
    nProgress int;
    jTimeline jsonb;
    cTasktype text;
    cStatus text;
    permission text;
	nStatus int;
	cAssign boolean;
	cRemind boolean;
	cStatusChange boolean;


-- From jTimeline
dStartDt date;
dEndDt date;


BEGIN
nTaskid := NULLIF(parameter ->> 'nTaskid','')::uuid;
cSubject := parameter ->> 'cSubject';
cDesc := parameter ->> 'cDesc';
jEmailnotify := parameter ->> 'jEmailnotify';
nPriority := parameter ->> 'nPriority';
nProgress := parameter ->> 'nProgress';
jTimeline := parameter ->> 'jTimeline';
cTasktype := parameter ->> 'cTasktype';
cStatus := parameter ->> 'cStatus';
permission := parameter ->> 'permission';
nStatus := parameter ->> 'nStatus';

-- Extract boolean flags from jEmailnotify
cAssign := (jEmailnotify ->> 'cAssign')::boolean;
cRemind := (jEmailnotify ->> 'cRemind')::boolean;
cStatusChange := (jEmailnotify ->> 'cStatusChange')::boolean;

-- Extract dates from jTimeline
dStartDt := (jTimeline ->> 'dStartDt')::timestamp;
dEndDt := (jTimeline ->> 'dEndDt')::timestamp;


--  select * from ""TaskDetail""

    if(permission ='N') then

        insert into "TaskDetail" ("nTaskid","cSubject","cDesc","nPriority","nProgress","cTasktype","cStatus",
		 "nStatus", "cAssign", "cRemind", "cStatusChange","dStartDt", "dEndDt" )
        values(nTaskid,cSubject,cDesc,nPriority,nProgress,cTasktype,coalesce(cStatus,'P'),
		  nStatus, cAssign, cRemind, cStatusChange, dStartDt, dEndDt);

        open ref for select 1 msg;

    end if;

    if(permission ='E') then
    update "TaskDetail" set "cSubject" = cSubject,
	"cDesc" = cDesc,
	"nPriority" = nPriority,
	"nProgress" = nProgress,
	"cStatus" = CASE WHEN nProgress = 100 THEN 'C' ELSE "cStatus" END,
	"jTimeline" = jTimeline,
	"cTasktype"= cTasktype,
	"nStatus" = nStatus,
	"cAssign" = cAssign,
	"cRemind" = cRemind,
	"cStatusChange" = cStatusChange,
	"dStartDt" = dStartDt,
	"dEndDt" = dEndDt
	where "nTaskid" = nTaskid;

        open ref for select 1 msg;
    end if;

	 if(permission ='S') then
 			update "TaskDetail" set "nProgress" = nProgress, "cStatus" = CASE WHEN nProgress = 100 THEN 'C' ELSE "cStatus" END where "nTaskid" = nTaskid;
			open ref for select 1 msg;
	end if;


    RETURN ref;  -- Return the cursor to the caller
END;
$$;

-- ===== public.et_task_insert_reminder_v2(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_task_insert_reminder_v2(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$
DECLARE
    nTaskid UUID;
    jReminder jsonb;
    email boolean;
    inapp boolean;
	dReminderDt timestamp;

BEGIN
nTaskid := NULLIF(parameter ->> 'nTaskid','')::uuid;
jReminder := parameter ->> 'jReminder';
email := parameter ->> 'bemail';
inapp := parameter ->> 'binapp';
dReminderDt := (parameter ->> 'dReminderDt')::timestamp;

raise notice 'dReminderDt %',dReminderDt;

--  select * from ""TaskReminders""

    delete from "TaskReminders" where "nTaskid" = nTaskid;

    IF dReminderDt IS NOT NULL THEN
    insert into "TaskReminders" ("nTaskid","dReminderDt")
	values(nTaskid,dReminderDt);
    -- select nTaskid,(r->>0)::text,(r->>1)::text,email,inapp,(r ->> 'dReminderDate')::timestamp from jsonb_array_elements(jReminder) r;
    end if;
    open ref for select 1 msg;

    RETURN ref;  -- Return the cursor to the caller
END;
$$;

-- ===== public.et_user_sync_update(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_user_sync_update(parameter json, ref1 refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$
declare nMasterid uuid;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
/*
select * from et_signout ('{""nMasterid"":2,""cToken"":""234234"",""cJwt"":""fdffff"",""bResponce"":true}','r1');fetch all in ""r1"";
select * from ""UserMaster""  order by 1
*/

    update "UserMaster" set "dSyncdt" = now()
    where "nUserid" = nMasterid;


OPEN ref1 FOR
select 1 as msg;

    RETURN NEXT ref1;




END;
$$;

-- ===== public.et_workspace_fact_list(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION public.et_workspace_fact_list(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$

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
$$;

-- ===== realtime.et_current_active_session(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION realtime.et_current_active_session(parameter json, ref1 refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$
declare nMasterid UUID;nCaseid uuid;nSesid uuid;
BEGIN

nMasterid := (parameter ->>'nUserid')::UUID;
nCaseid := parameter ->>'nCaseid';
nSesid := parameter ->>'nSesid';

/*

select * from "RSessionMaster"

select * from realtime.et_current_active_session('{"nCaseid":"bc669a9e-6388-42af-9a94-f438e907ea30"}','r');fetch all in "r"

*/
    OPEN ref1 FOR
	select r."cName",r."dStartDt",r."nDays",r."nLines",r."cUnicuserid",r."cStatus",
	r."dCreatedt",r."cProtocol",r."nCaseid",r."nRTSid",r."nSesid" ,s."cUrl",s."nPort",r."nSesid" "nLSesid",r."bRefresh",r."isTranscript" "isTrans",r."isTranscript"
	from "RSessionMaster" r
	left join "RealtimeServers" s on s."nRTSid" = r."nRTSid"
	where case when nSesid is not null then r."nSesid" = nSesid else true end
	and "nCaseid" = nCaseid  and r."dDelDt" is null
	 and "cStatus" = 'R' order by "dStartDt" desc limit 1
    ;

    RETURN NEXT ref1;

END;
$$;

-- ===== realtime.et_fact_insert_detail(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION realtime.et_fact_insert_detail(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$
DECLARE nFSid uuid;jText jsonb;nFt integer;nSt integer;
jDate jsonb;cType text;nTZid integer;jOT jsonb;
jAn jsonb;nColorid uuid;jLinktype jsonb;cIsNote text;
bIsHighlighted boolean;
jCordinates jsonb;
nPage int; nLine int;cFFrom text;
-- select * from "FactDetail" limit 0
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
-- alter table "FactDetail" add column "cIsNote" character varying(1) default 'N';

/*

select * from realtime.et_fact_insert_detail ('{"nSesid":"da4238c4-1630-4586-aba1-899dca410a7c","jCoordinates":"[{\"text\":\"ation of things.  To look at the development \",\"t\":\"13:39:28:07\",\"l\":8,\"p\":42,\"oP\":22,\"oL\":2,\"identity\":\"374926425208602\"},{\"text\":\"      plan as it was executed and t\",\"t\":\"13:39:31:10\",\"l\":9,\"p\":42,\"oP\":22,\"oL\":3,\"identity\":\"374926425208603\"}]","nColorid":"a05df4b6-6091-4390-b7c4-43c214e78fc3","jT":"[\"hello world\"]","jOT":"[\"ation of things.  To look at the development \",\"      plan as it was executed and t\"]","jIssues":"[[\"a05df4b6-6091-4390-b7c4-43c214e78fc3\",22,14]]","cFtype":"QF","cIsNote":"Y","cFFrom":"RT","nCaseid":"bc669a9e-6388-42af-9a94-f438e907ea30","jContacts":"[]","nMasterid":"7ee7a723-d96d-4d63-81c1-4dc4a2be4699","nFSid":"d491a0ca-c6fc-4917-9407-f09e11fc7379"}','r1');fetch all in "r1";
*/
-- select * from "FactDetail" order by 1 desc

	insert into "FactDetail" ("nFSid","nFiletype","nTZid","jDate","nStatus","cType","jTexts","jOT","nColorid","jLinktype","cIsNote", "bIsHighlighted", "jCordinates", "nPage","nLine" )
	select nFSid,nFt,nTZid,jDate,nSt,cType,jText,jOT,nColorid,jLinktype,coalesce(cIsNote,'N'),bIsHighlighted, case when cFFrom = 'I' then null else jCordinates end, nPage, nLine;

	if(cFFrom = 'I') then
		 insert into "Annotations"("uuid","type","rects","lines","colorid","width","page","nFSid","dCreateDt")
		 select "uuid","type",coalesce("rects",'[]'::jsonb),coalesce("lines",'[]'::jsonb),nColorid,"width","page",nFSid,now() from jsonb_to_recordset(jAn) as ("uuid" text,"type" text,"rects" jsonb,"lines" jsonb,width int,"page" int);
	 end if;

	open ref for select 1 msg;
    RETURN ref;
END;
$$;

-- ===== realtime.et_fact_insert_team(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION realtime.et_fact_insert_team(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$
DECLARE nFSid uuid;jTeams jsonb;jNotify jsonb;nCaseid uuid; nPMid int;
cMsg text;
cTitle text;

nUserid uuid;
jNewUsers jsonb;
bIsUserUpdated boolean;

/*
select * from realtime.et_fact_insert_team ('{"nColorid":"ff093734-8dc6-4bb0-9ea6-a15f1f1b7efd","nFt":0,"nSt":0,"jT":"[]","jOT":"[\"imant”) hereby submits this reply to Respondent’s counterclaims (the “Reply\\nto Counterclaims”) to the Secretariat of the International Chamber of Commerce (the “ICC”), in\\naccordance with Article 5.6 of the ICC Rules \"]","jFl":"[]","jIssues":"[[\"ff093734-8dc6-4bb0-9ea6-a15f1f1b7efd\",0,0]]","jContacts":"[]","jTasks":"[]","jUsers":"[{\"nUserid\":\"7ee7a723-d96d-4d63-81c1-4dc4a2be4699\",\"bCanEdit\":true,\"bCanCopy\":true,\"bCanReshare\":true,\"bCanComment\":true},{\"nUserid\":\"70ad86c0-e204-44a6-9aea-415291721a9b\",\"bCanEdit\":true,\"bCanCopy\":true,\"bCanReshare\":true,\"bCanComment\":true},{\"nUserid\":\"b9ca9bc3-e855-4ce4-8457-ff54a5552e8a\",\"bCanEdit\":true,\"bCanCopy\":true,\"bCanReshare\":true,\"bCanComment\":true},{\"nUserid\":\"fc2b2057-ac44-41c7-9058-64e8617ed3e5\",\"bCanEdit\":true,\"bCanCopy\":true,\"bCanReshare\":true,\"bCanComment\":true}]","cFtype":"F","cFFrom":"I","nPage":3,"nLine":0,"nCaseid":"bc669a9e-6388-42af-9a94-f438e907ea30","jDate":"{\"type\":\"D\",\"nValue\":241,\"cValue\":\"On\",\"record\":[{\"date\":\"2025-09-16\"}]}","nBDid":"5381572f-0e29-437d-9e48-395ce160a74b","jAn":"[{\"uuid\":\"a0abd7c2-44c5-401b-bdf9-6b44df9575c4\",\"type\":\"highlight\",\"page\":3,\"rects\":[{\"x\":195.47698974609375,\"y\":64.20703125,\"width\":25.25811767578125,\"height\":12},{\"x\":220.76953125,\"y\":64.95703125,\"width\":3.6796875,\"height\":11.0390625},{\"x\":220.76953125,\"y\":64.20703125,\"width\":3.6796875,\"height\":12},{\"x\":225.52734375,\"y\":64.95703125,\"width\":187.09771728515625,\"height\":11.0390625},{\"x\":225.52734375,\"y\":64.20703125,\"width\":187.09771728515625,\"height\":12},{\"x\":412.3359375,\"y\":64.95703125,\"width\":7.083892822265625,\"height\":11.0390625},{\"x\":412.3359375,\"y\":64.20703125,\"width\":7.083892822265625,\"height\":12},{\"x\":419.4140625,\"y\":64.95703125,\"width\":3.0703125,\"height\":11.0390625},{\"x\":419.4140625,\"y\":64.20703125,\"width\":3.0703125,\"height\":12},{\"x\":421.96875,\"y\":64.95703125,\"width\":63.10968017578125,\"height\":11.0390625},{\"x\":421.96875,\"y\":64.20703125,\"width\":63.10968017578125,\"height\":12},{\"x\":485.015625,\"y\":64.95703125,\"width\":3.0703125,\"height\":11.0390625},{\"x\":485.015625,\"y\":64.20703125,\"width\":3.0703125,\"height\":12},{\"x\":487.453125,\"y\":64.95703125,\"width\":25.33905029296875,\"height\":11.0390625},{\"x\":487.453125,\"y\":64.20703125,\"width\":25.33905029296875,\"height\":12},{\"x\":512.73046875,\"y\":64.95703125,\"width\":25.631378173828125,\"height\":11.0390625},{\"x\":512.73046875,\"y\":64.20703125,\"width\":25.631378173828125,\"height\":12},{\"x\":92.6015625,\"y\":81.8671875,\"width\":79.35031127929688,\"height\":11.0390625},{\"x\":92.6015625,\"y\":81.1171875,\"width\":79.35031127929688,\"height\":12},{\"x\":171.8203125,\"y\":81.8671875,\"width\":8.03228759765625,\"height\":11.0390625},{\"x\":171.8203125,\"y\":81.1171875,\"width\":8.03228759765625,\"height\":12},{\"x\":179.84765625,\"y\":81.8671875,\"width\":3.0703125,\"height\":11.0390625},{\"x\":179.84765625,\"y\":81.1171875,\"width\":3.0703125,\"height\":12},{\"x\":183.83203125,\"y\":81.8671875,\"width\":308.0859375,\"height\":11.0390625},{\"x\":183.83203125,\"y\":81.1171875,\"width\":308.0859375,\"height\":12},{\"x\":491.61328125,\"y\":81.8671875,\"width\":3.0703125,\"height\":11.0390625},{\"x\":491.61328125,\"y\":81.1171875,\"width\":3.0703125,\"height\":12},{\"x\":495.83203125,\"y\":81.8671875,\"width\":3.6796875,\"height\":11.0390625},{\"x\":495.83203125,\"y\":81.1171875,\"width\":3.6796875,\"height\":12},{\"x\":500.47265625,\"y\":81.8671875,\"width\":14.60009765625,\"height\":11.0390625},{\"x\":500.47265625,\"y\":81.1171875,\"width\":14.60009765625,\"height\":12},{\"x\":515.109375,\"y\":81.8671875,\"width\":3.6796875,\"height\":11.0390625},{\"x\":515.109375,\"y\":81.1171875,\"width\":3.6796875,\"height\":12},{\"x\":519.92578125,\"y\":81.8671875,\"width\":18.41015625,\"height\":11.0390625},{\"x\":519.92578125,\"y\":81.1171875,\"width\":18.41015625,\"height\":12},{\"x\":92.6015625,\"y\":97.95703125,\"width\":199.14523315429688,\"height\":12}]}]","cType":"S","jLinktype":"{}","nMasterid":"ba561c55-81f5-4180-8934-2ce6dcaa096c","nFSid":"0fe2abf0-55b8-4b53-b791-5e561e5cc8a5"}','r1');fetch all in "r1";

*/
BEGIN
nFSid := NULLIF(parameter->>'nFSid','')::uuid;
jTeams := parameter->>'jUsers';
nUserid := coalesce((parameter ->>'nUserid'),(parameter ->>'nMasterid'));
bIsUserUpdated := coalesce((parameter->>'bIsUserUpdated'),'false')::boolean;

/*

with tbl as (
	select * from jsonb_to_recordset(jTeams) as t("nUserid" uuid,"bCanEdit" boolean,"bCanReshare" boolean,"bCanComment" boolean)
),shared_users as (
	select * from realtime.fact_shared_users(nFSid,nUserid)
),del_op as (
	delete from "FMShared" f
	where "nFSid" = nFSid
	and	exists (
		select * from shared_users s where s."nUserid" = f."nUserid"
	) and
	not exists (
		select * from tbl t where t."nUserid" = f."nUserid"
	)
	returning "nFMSdid"
),	INSERT INTO "FMShared" ("nFSid","nUserid","bCanEdit","bCanReshare","bCanComment","nShareBy")
	select nFSid,t."nUserid",t."bCanEdit",t."bCanReshare",t."bCanComment",nUserid
	from tbl t
	returning jsonb_agg("nUserid") into jNewUsers
	;

*/

	nCaseid := (select "nCaseid" from "FactMaster" where "nFSid" = nFSid );
	nPMid := (select "nPMid"  from "PermissionModule" where "cType" = 'NF' );

	cTitle = 'Fact shared';
	cMsg = (select cr."cFname" || ' ' || cr."cLname"  || ' has shared fact with you' from "FactMaster" f join "UserMaster" cr on cr."nUserid" = f."nUserid" where f."nFSid" = nFSid limit 1);



	-- INSERT INTO "FMShared" ("nFSid","nUserid","bCanEdit","bCanReshare","bCanComment","nShareBy")
	-- SELECT  nFSid,(team->>'nUserid')::uuid,(team->>'bCanEdit')::boolean,(team->>'bCanReshare')::boolean,(team->>'bCanComment')::boolean,nUserid
	-- FROM jsonb_array_elements(jTeams) AS team;

	DELETE FROM "FMShared" f
	WHERE f."nFSid" = nFSid
		and f."nShareBy" = nUserid
	  AND NOT EXISTS (
	    SELECT 1
	    FROM jsonb_to_recordset(jTeams) AS t("nUserid" uuid)
	    WHERE t."nUserid" = f."nUserid"
	  );


	INSERT INTO "FMShared"
  ("nFSid","nUserid","bCanEdit","bCanReshare","bCanComment","nShareBy")
	SELECT
	  nFSid,
	  (team->>'nUserid')::uuid,
	  (team->>'bCanEdit')::boolean,
	  (team->>'bCanReshare')::boolean,
	  (team->>'bCanComment')::boolean,
	  nUserid          -- the sharer (from your outer scope)
	FROM jsonb_array_elements(jTeams) AS team
	ON CONFLICT ("nFSid","nUserid")
	DO UPDATE SET
	  "bCanEdit"    = EXCLUDED."bCanEdit",
	  "bCanReshare" = EXCLUDED."bCanReshare",
	  "bCanComment" = EXCLUDED."bCanComment";

	-- select * 	from "UserMaster" u where jNewUsers @>

	with tbl as (select u."nUserid",'Fact shared' as "cTitle",
		cr."cFname" || ' ' || cr."cLname"  || ' has shared fact with you' as "cMsg",
		s."nFSid",u."cToken",'FS' as "cType",nCaseid as "nCaseid"
		from "UserMaster" u
		join "FMShared" s on s."nUserid" = u."nUserid"
		join "FactMaster" fm on fm."nFSid" = s."nFSid"
		join "UserMaster" cr on cr."nUserid" = fm."nUserid"
		left join "UserPermission" up on up."nUserid" = u."nUserid"  and  up."nCaseid" = nCaseid and up."nPMid" = nPMid
		where s."nFSid" = nFSid -- and nullif(u."cToken",'') is not null
		and coalesce(up."nUPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid
		) select jsonb_agg(t) into jNotify from tbl t;




	open ref for select 1 msg,coalesce(jNotify,'[]'::jsonb) as "jNotify";
    RETURN ref;
END;
$$;

-- ===== realtime.et_factsheet_detail(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION realtime.et_factsheet_detail(parameter json, ref1 refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$
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
	d."jDate",d."nFiletype",d."nStatus",d."cType",d."jLinktype",d."jTexts",d."jOT",d."cIsNote",d."nColorid",
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
$$;

-- ===== realtime.et_factsheet_submit(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION realtime.et_factsheet_submit(parameter json, ref1 refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$
declare nFSid UUID;nMasterid uuid;
nSesid uuid;nColorid uuid;
nFt int;nSt int;
jFl jsonb;jIssues jsonb;jContacts jsonb;jTasks jsonb;jUsers jsonb;jDate jsonb;jT jsonb;

BEGIN

nFSid := (parameter ->>'nFSid')::UUID;
nMasterid := (parameter->>'nMasterid')::uuid;

nSesid := (parameter ->>'nSesid')::UUID;
nColorid := (parameter ->>'nColorid')::UUID;

nFt := parameter ->>'nFt';
nSt := parameter ->>'nSt';

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

	update "FactDetail" set "jDate" = jDate,"nFiletype" = nFt,"nStatus" = nSt,"nColorid" = nColorid,"jTexts" = jT where "nFSid" = nFSid;

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
$$;

-- ===== realtime.et_marknav_doclinks(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION realtime.et_marknav_doclinks(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$

declare nSesid uuid;nUserid uuid;nBundledetailid uuid;
    sql_query TEXT;
	historyEnabled boolean;
	cSortby text;


	isAdmin boolean default false;
	nRoleid uuid;nTeamid uuid;nCaseid uuid;
	jFilter jsonb;
	nID uuid;
	bIsTranscipt boolean default false;

BEGIN
	nSesid := NULLIF(parameter ->>'nSesid','')::uuid;
	nUserid := parameter ->>'nUserid';
	nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
	historyEnabled := COALESCE(parameter ->> 'historyEnabled','false')::boolean;
	cSortby := parameter->>'cSortby';
	jFilter := parameter ->>'jFilter';
	bIsTranscipt := COALESCE(parameter ->> 'bIsTranscipt','false')::boolean;

	nID := (case when nSesid  is not distinct from null then nBundledetailid else nSesid end);

isAdmin := case when exists (  select * from "UserMaster" where "nUserid" = nUserid and "isAdmin" = true )  then true  else false  end;
 	if(nBundledetailid is not null) then
	 	select "nCaseid" into nCaseid from bundlesource where  "nBundledetailid" =  nBundledetailid;
	 else
		select "nCaseid" into nCaseid from "RSessionMaster" where "nSesid" = nSesid;
	 end if;

	select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nUserid and "nCaseid" = nCaseid limit 1;
	raise notice 'nSesid ,nCaseid , nRoleid %,%,%',nSesid,nCaseid,nRoleid ;
	if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then
		isAdmin := true;
	end if;

sql_query := 'WITH tbl AS (
				SELECT m."dCreateDt",
				m."nDocid",
				u."cFname" || '' '' || COALESCE(u."cLname", '''') AS "cCreateby",
				d."jLinktype",
				d."jOText" as "jOT",
				d."jTexts",
				d."cType",
				m."nBundledetailid",
				-- CASE on bIsTranscipt so the published view picks up nTPage/nTLine
				-- written by run3.py during transferAnnotations. Inline the
				-- boolean since this SELECT is built via string-concat dynamic SQL.
				CASE WHEN '||COALESCE(bIsTranscipt,false)||' THEN d."nTPage" ELSE d."nPage" END AS "nPage",
				CASE WHEN '||COALESCE(bIsTranscipt,false)||' THEN d."nTLine" ELSE d."nLine" END AS "nLine",
				m."nUserid",
				d."jCordinates",
				cmt."total" as "t_comments",count(s."nDMSid") as "t_shared"
				FROM "DocMaster" m
				JOIN "UserMaster" u ON u."nUserid" = m."nUserid"
				JOIN "DocDetail" d ON d."nDocid" = m."nDocid"
			  	left join "TeamRelation" tr ON tr."nTeamid" = '''|| nTeamid ||'''
				LEFT JOIN "DMShared" s ON s."nDocid" = m."nDocid" -- AND s."nUserid" = ' || quote_nullable(nUserid) || '
				left join realtime."comments" cmt on cmt."nDocid" = m."nDocid"
				 '||(
                CASE WHEN historyEnabled = true
                     THEN 'JOIN realtime.history_marknav('|| quote_nullable(nSesid) ||','|| quote_nullable(nBundledetailid) ||','|| quote_nullable(nUserid) ||',''D'','|| 1 || ') his ON his."id" = m."nDocid"'
                     ELSE '' END
              ) ||'
				WHERE (m."nSesid" = ' || quote_nullable(nSesid) || '
				or  m."nBundledetailid" = ' || quote_nullable(nBundledetailid) || ')
				AND (m."nUserid" = ' || quote_nullable(nUserid)  || '
				or s."nUserid" = ' || quote_nullable(nUserid)  || '  or (case when ''' || isAdmin || '''::boolean = true then  m."nUserid" = tr."nUserid" else false end))
				-- Orphan filter: on the published view, suppress doc-links whose
				-- annotation could not be re-anchored. Mirrors et_marks.sql:48-50.
				AND (
				  '||COALESCE(bIsTranscipt,false)||' = false
				  OR (d."cTransferStatus" IS DISTINCT FROM ''O'' AND d."jTCordinates" IS NOT NULL)
				)
				group by m."dCreateDt", m."nDocid", u."cFname",u."cLname",d."jLinktype", d."jOText", d."jTexts", d."cType", m."nBundledetailid",
				d."nPage", d."nTPage", d."nLine", d."nTLine", m."nUserid", d."jCordinates", cmt."total"
				),
				links AS (
				SELECT l."nDocid",
				l."nDMLids",
				l."jLinktype",
				l."nBundledetailid",
				d.*
				FROM "DMLinks" l
				JOIN tbl m ON m."nDocid" = l."nDocid"
				JOIN bundlesource d ON d."nBundledetailid" = l."nBundledetailid"

				)
				SELECT t.*,
					jsonb_agg(DISTINCT l.*) AS "list"
				FROM tbl t
				JOIN links l ON l."nDocid" = t."nDocid"
				where '||(
                CASE WHEN jFilter IS NOT NULL AND jFilter <> '{}'::jsonb
                     THEN ' EXISTS (
                SELECT *
                FROM realtime.filter_marknav(''' || jFilter::text || '''::jsonb,
                                            ' || quote_nullable(nID) || ',
                                            ' || quote_nullable(nUserid) || ',
                                            ''ALL'',' || quote_nullable(nTeamid) || ','|| isAdmin ||') filter
                WHERE  filter."id" = t."nDocid"
            )'
                     ELSE ' true ' END
              ) ||'
				GROUP BY t."dCreateDt",
						t."nDocid",
						t."cCreateby",
						t."jLinktype",
						t."jOT",
						t."jTexts",
						t."cType",
						t."nBundledetailid",
						t."nPage",
						t."nLine",
						t."nUserid",
						t."jCordinates",
						t."t_comments",t.t_shared
						' ||
						(
							CASE
							WHEN cSortby = 'asc'  THEN ' ORDER BY t."nPage" ASC,t."dCreateDt" ASC'
							WHEN cSortby = 'desc' THEN ' ORDER BY t."nPage" DESC,t."dCreateDt" DESC'
							ELSE ''
							END
						)
						|| '
						';



raise notice 'sql_query %',sql_query;
    OPEN ref FOR EXECUTE sql_query;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$$;

-- ===== realtime.et_marknav_team_user(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION realtime.et_marknav_team_user(parameter json, ref1 refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$
DECLARE
    nUserid          UUID;
    nBundledetailid  UUID;
    nSesid           UUID;
    cType            text;
    nCaseid          UUID;
    nTeamid          UUID;
    nRoleid          UUID;
    isAdmin          boolean default false;
BEGIN
    nUserid         := NULLIF(parameter ->> 'nUserid', '')::uuid;
    nSesid          := NULLIF(parameter ->> 'nSesid', '')::uuid;
    nBundledetailid := NULLIF(parameter ->> 'nBundledetailid', '')::uuid;
    cType           := parameter ->> 'cType';

    IF nSesid IS NOT NULL THEN
        SELECT "nCaseid" INTO nCaseid
          FROM "RSessionMaster"
         WHERE "nSesid" = nSesid;
    END IF;

    IF nCaseid IS NULL AND nBundledetailid IS NOT NULL THEN
        SELECT bm."nCaseid" INTO nCaseid
          FROM "BundleDetail" bd
          JOIN "BundleMaster" bm ON bm."nBundleid" = bd."nBundleid"
         WHERE bd."nBundledetailid" = nBundledetailid;
    END IF;

    isAdmin := EXISTS (
        SELECT 1 FROM "UserMaster"
         WHERE "nUserid" = nUserid AND "isAdmin" = true
    );

    SELECT "nTeamid", "nRoleid"
      INTO nTeamid, nRoleid
      FROM "TeamRelation"
     WHERE "nUserid" = nUserid
       AND "nCaseid" = nCaseid
     LIMIT 1;

    IF NOT isAdmin
       AND (SELECT "nSrno" FROM "RoleMaster" WHERE "nRoleid" = nRoleid) = 1 THEN
        isAdmin := true;
    END IF;

    OPEN ref1 FOR
    SELECT q."nUserid", q."cFname", q."cLname", q."cProfile"
    FROM (
      SELECT DISTINCT
        u."nUserid",
        u."cFname",
        u."cLname",
        u."cProfile",
        CASE WHEN u."nUserid" = nUserid THEN 0 ELSE 1 END AS _sort_first
      FROM "UserMaster" u
      LEFT JOIN "FactMaster" f
        ON f."nUserid" = u."nUserid"
       AND (f."nSesid" = nSesid OR f."nBundledetailid" = nBundledetailid)
       AND (COALESCE(cType,'A') = 'A' OR f."cFType" = cType)
      LEFT JOIN "FMShared" fs
        ON fs."nFSid" = f."nFSid"
      LEFT JOIN "DocMaster" d
        ON d."nUserid" = u."nUserid"
       AND (d."nSesid" = nSesid OR d."nBundledetailid" = nBundledetailid)
       AND (cType = 'A' OR cType = 'D')
      LEFT JOIN "DMShared" ds
        ON ds."nDocid" = d."nDocid"
      LEFT JOIN "TeamRelation" tr
        ON tr."nTeamid" = nTeamid
       AND tr."nUserid" = u."nUserid"
       AND tr."nCaseid" = nCaseid
      WHERE (
            COALESCE(cType,'A') = 'A'
            AND (f."nFSid" IS NOT NULL OR d."nDocid" IS NOT NULL)
            AND (
                  u."nUserid"  = nUserid
               OR fs."nUserid" = nUserid
               OR ds."nUserid" = nUserid
               OR (isAdmin AND tr."nUserid" IS NOT NULL)
            )
          )
         OR (
            cType = 'D'
            AND d."nDocid" IS NOT NULL
            AND f."nFSid"  IS NULL
            AND (
                  u."nUserid"  = nUserid
               OR ds."nUserid" = nUserid
               OR (isAdmin AND tr."nUserid" IS NOT NULL)
            )
          )
         OR (
            cType NOT IN ('A','D')
            AND f."nFSid"  IS NOT NULL
            AND d."nDocid" IS NULL
            AND (
                  u."nUserid"  = nUserid
               OR fs."nUserid" = nUserid
               OR (isAdmin AND tr."nUserid" IS NOT NULL)
            )
          )
    ) q
    ORDER BY q._sort_first, q."cFname", q."nUserid";

    RETURN NEXT ref1;
END;
$$;

-- ===== realtime.et_marks(json, refcursor, refcursor, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION realtime.et_marks(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$

declare nCaseid uuid;nUserid uuid;nSessionid uuid;nIid uuid;jFactids jsonb;

        isAdmin boolean default false;
        nRoleid uuid;nTeamid uuid;bTranscript boolean;

BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nSessionid := NULLIF(parameter ->>'nSessionid','')::uuid;
jFactids := parameter ->>'jFactids';
bTranscript := parameter ->>'bTranscript';

isAdmin := case when exists (select * from "UserMaster" where "nUserid" = nUserid and "isAdmin" = true )  then true  else false  end;

 if(nCaseid is null) then
        select "nCaseid" into nCaseid from "RSessionMaster" where "nSesid" = nSessionid;
 end if;


select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nUserid and "nCaseid" = nCaseid limit 1;

if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then
        isAdmin := true;
end if;


    OPEN ref1 FOR
                select DISTINCT f."nFSid" as "id",f."cFType" as "cType",
                 CASE WHEN COALESCE(bTranscript,false) = false THEN d."jCordinates"  ELSE d."jTCordinates" END AS "jCordinates",
                d."nColorid",i."cColor" as "color"
                from "FactMaster" f
                join "FactDetail" d on d."nFSid" = f."nFSid"
                left join "RIssueMaster" i on i."nIid" = d."nColorid"
                left join "TeamRelation" tr ON tr."nTeamid" = nTeamid
                left join "FMShared" s on s."nFSid" = f."nFSid" and s."nUserid" = nUserid
                where f."nSesid" = nSessionid
                  and ((f."nUserid" = nUserid or s."nUserid" = nUserid) or (case when isAdmin = true then  f."nUserid" = tr."nUserid" else false end))
                  and (
                    COALESCE(bTranscript, false) = false
                    OR (d."cTransferStatus" IS DISTINCT FROM 'O' AND d."jTCordinates" IS NOT NULL)
                  );

    RETURN NEXT ref1;

    OPEN ref2 FOR

          select DISTINCT h."nHid",
      CASE WHEN COALESCE(bTranscript,false) = false THEN h."cPageno"  ELSE h."cTPageno" END AS "cPageno",
          CASE WHEN COALESCE(bTranscript,false) = false THEN h."cLineno"  ELSE h."cTLineno"  END AS "cLineno",
      CASE WHEN COALESCE(bTranscript,false) = false THEN h."cTime"  ELSE h."cTTime"END AS "cTime",
          CASE WHEN COALESCE(bTranscript,false) = false THEN h."identity" ELSE h."tidentity" END AS "identity"
                  FROM "RHighlights" h
                left join "TeamRelation" tr ON tr."nTeamid" = nTeamid
                WHERE h."nSessionId" = nSessionid
                  AND (h."nUserid"  = nUserid or (case when isAdmin = true then  h."nUserid" = tr."nUserid" else false end))
                  AND (
                    COALESCE(bTranscript, false) = false
                    OR (h."cTransferStatus" IS DISTINCT FROM 'O' AND h."cTPageno" IS NOT NULL)
                  );

        RETURN NEXT ref2;

    OPEN ref3 FOR

        select DISTINCT m."nDocid" as "id",'D' as "cType" ,
        CASE WHEN COALESCE(bTranscript,false) = false THEN d."jCordinates"  ELSE d."jTCordinates" END AS "jCordinates"
        from "DocMaster" m
        join "DocDetail" d on d."nDocid" = m."nDocid"
        left join "DMShared" s on s."nDocid" = m."nDocid" and s."nUserid" = nUserid
                left join "TeamRelation" tr ON tr."nTeamid" = nTeamid
        where m."nSesid" = nSessionid
          and (m."nUserid" = nUserid or s."nUserid" = nUserid or (case when isAdmin = true then  m."nUserid" = tr."nUserid" else false end))
          and (
            COALESCE(bTranscript, false) = false
            OR (d."cTransferStatus" IS DISTINCT FROM 'O' AND d."jTCordinates" IS NOT NULL)
          )
          and (
            COALESCE(bTranscript, false) = true
            OR d."jCordinates" IS NOT NULL
          );

        RETURN NEXT ref3;

END;
$$;

-- ===== realtime.et_navigate_fact_companies(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION realtime.et_navigate_fact_companies(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$

declare nMasterid uuid;nSesid uuid;
isAdmin boolean default false;
conpanyids uuid[];
nBundledetailid uuid;

	nRoleid uuid;nTeamid uuid;nCaseid uuid;
-- fga_factids jsonb;

begin
-- select et_navigate_fact_companies('{ ""nBundledetailid"": 530060, ""cType"": ""N"", ""jFilter"": ""[]"", ""sortby"": {}, ""nMasterid"": 59 }','r');fetch all in ""r""

nSesid := NULLIF(parameter ->>'nSesid','')::uuid;
nMasterid := NULLIF(parameter ->>'nUserid','')::uuid;
nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
-- fga_factids := parameter->>'jFactids';

isAdmin := case when exists (select * from "UserMaster" where "nUserid" = nMasterid and "isAdmin" = true )  then true  else false  end;

	 if(nBundledetailid is not null) then
	 	select "nCaseid" into nCaseid from bundlesource where  "nBundledetailid" =  nBundledetailid;
	 else
		select "nCaseid" into nCaseid from "RSessionMaster" where "nSesid" = nSesid;
	 end if;

	select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nMasterid and "nCaseid" = nCaseid limit 1;
	raise notice 'nSesid ,nCaseid , nRoleid %,%,%',nSesid,nCaseid,nRoleid ;
	if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then
		isAdmin := true;
	end if;

	open ref for
	select cm."nCompanyid" "nCompanyid",case when cm."nCompanyid" IS NOT NULL then cc."cCompany" else 'Unassigned' end "cCompany" from "FactMaster" f
    join "FMContact" fc on fc."nFSid" = f."nFSid"
	join "ContactMaster" cm on cm."nContactid" = fc."nContactid"
    left join "FMShared" fs on fs."nFSid" = f."nFSid"
	left join "ContactCompany" cc on cc."nCompanyid" = cm."nCompanyid"
	left join "TeamRelation" tr ON tr."nTeamid" =  nTeamid
    -- left join "BDPermission" bd on bd."nBundledetailid" = f."nBundledetailid" and bd."nUserid" = nMasterid
     where (f."nSesid" = nSesid  or f."nBundledetailid" = nBundledetailid)
	 and (f."nUserid" = nMasterid or fs."nUserid" = nMasterid or (case when isAdmin = true then  f."nUserid" = tr."nUserid" else false end)) -- and (isAdmin or "nBDPid" is null) --or fga_factids @> to_jsonb(fc."nFSid")
	group by cm."nCompanyid",cc."cCompany" ;

	 return ref;
    END;
$$;

-- ===== realtime.et_navigate_factlist(json, refcursor, refcursor, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION realtime.et_navigate_factlist(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$

DECLARE
    nMasterid uuid;
    nSesid uuid;
    nBundledetailid uuid;
    cSortby text;
    cSorttype text;
    pageNumber int;
    offsetCount int;
    perPage int := 10;
    factids jsonb;
    sql_query TEXT;

    jFilter jsonb;
    cFType text;
    nID uuid;
    historyEnabled boolean;

    isAdmin boolean default false;
    nRoleid uuid;
    nTeamid uuid;
    nCaseid uuid;
    bIsTranscipt boolean default false;

BEGIN
    --------------------------------------------------
    -- PARAMETERS
    --------------------------------------------------
    nSesid := NULLIF(parameter->>'nSesid','')::uuid;
    nMasterid := NULLIF(parameter->>'nUserid','')::uuid;

    cSorttype := parameter->>'cSorttype';
    cSortby := parameter->>'cSortby';

    pageNumber := COALESCE((parameter->>'nPageNumber')::int, 1);
    jFilter := parameter->>'jFilter';

    offsetCount := (pageNumber - 1) * perPage;

    cFType := NULLIF(parameter->>'cFType','');
    nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;

    historyEnabled := COALESCE(parameter->>'historyEnabled','false')::boolean;
    bIsTranscipt := COALESCE(parameter->>'bIsTranscipt','false')::boolean;

    nID := (CASE WHEN nSesid IS NULL THEN nBundledetailid ELSE nSesid END);

    --------------------------------------------------
    -- ADMIN / TEAM LOGIC
    --------------------------------------------------

    isAdmin :=
        CASE WHEN EXISTS (
            SELECT 1 FROM "UserMaster"
            WHERE "nUserid" = nMasterid
              AND "isAdmin" = true
        )
        THEN true ELSE false END;

    IF nBundledetailid IS NOT NULL THEN
        SELECT "nCaseid"
        INTO nCaseid
        FROM bundlesource
        WHERE "nBundledetailid" = nBundledetailid;
    ELSE
        SELECT "nCaseid"
        INTO nCaseid
        FROM "RSessionMaster"
        WHERE "nSesid" = nSesid;
    END IF;

    SELECT "nTeamid","nRoleid"
    INTO nTeamid,nRoleid
    FROM "TeamRelation"
    WHERE "nUserid" = nMasterid
      AND "nCaseid" = nCaseid
    LIMIT 1;

    IF isAdmin = false
       AND (SELECT "nSrno" FROM "RoleMaster" WHERE "nRoleid" = nRoleid) = 1
    THEN
        isAdmin := true;
    END IF;

    --------------------------------------------------
    -- COLLECT FACT IDS
    --------------------------------------------------

    sql_query := '
    SELECT jsonb_agg(DISTINCT f."nFSid")
    FROM "FactMaster" f
    JOIN "FactDetail" d ON d."nFSid" = f."nFSid"

    LEFT JOIN "FMShared" s ON s."nFSid" = f."nFSid"

    LEFT JOIN "TeamRelation" tr
        ON tr."nTeamid" = ' || quote_literal(nTeamid) || '

    WHERE
    (
        f."nSesid" = ' || quote_nullable(nSesid) || '
        OR
        f."nBundledetailid" = ' || quote_nullable(nBundledetailid) || '
    )

    AND
    (
        f."nUserid" = ' || quote_nullable(nMasterid) || '
        OR s."nUserid" = ' || quote_nullable(nMasterid) || '

        OR
        (
            ' || isAdmin || '::boolean = true
            AND f."nUserid" = tr."nUserid"
        )
    )
    ';

    IF cFType IS NOT NULL THEN
        sql_query := sql_query ||
            ' AND f."cFType" = ' || quote_literal(cFType);
    END IF;

    IF jFilter IS NOT NULL AND jFilter <> '{}'::jsonb THEN
        sql_query := sql_query || '
        AND EXISTS (
            SELECT 1
            FROM realtime.filter_marknav(
                ' || quote_literal(jFilter::text) || '::jsonb,
                ' || quote_nullable(nID) || ',
                ' || quote_nullable(nMasterid) || ',
                ''ALL'',
                ' || quote_nullable(nTeamid) || ',
                ' || isAdmin || '
            ) t
            WHERE t."id" = f."nFSid"
        )';
    END IF;

    EXECUTE sql_query INTO factids;

    IF factids IS NULL THEN
        factids := '[]'::jsonb;
    END IF;

    --------------------------------------------------
    -- REF1 – MAIN FACT LIST (DEDUP FIXED)
    --------------------------------------------------

    OPEN ref1 FOR

    WITH
    shared_ct AS (
        SELECT "nFSid", COUNT(*) AS t_shared
        FROM "FMShared"
        GROUP BY "nFSid"
    ),

    task_ct AS (
        SELECT "nFSid", COUNT(*) AS t_tasks
        FROM "FMTasks"
        GROUP BY "nFSid"
    ),

    contact_ct AS (
        SELECT "nFSid", COUNT(*) AS t_contact
        FROM "FMContact"
        GROUP BY "nFSid"
    )

    SELECT DISTINCT ON (f."nFSid")

        CASE WHEN f."cFType" = 'F' THEN 'F' ELSE 'QF' END AS "cSource",

        f."nFSid",
        f."dCreateDt",

        um."cFname" || ' ' || COALESCE(um."cLname",'') AS "cCreateby",
        um."nUserid",

        f."nBundledetailid",

        fd."nFiletype",
        fd."nTZid",
        tz."cCodename" AS "cTimezone",

        fd."jLinktype",
        fd."cType",
        f."cFType",

        fd."jTexts",
        fd."jOT",

        fd."nColorid",
        fd."nStatus",

        fd."jCordinates",
        -- CASE on bIsTranscipt so the published view picks up nTPage written by
        -- run3.py during transferAnnotations. Mirrors et_marks.sql:57-58.
        CASE WHEN COALESCE(bIsTranscipt,false) THEN fd."nTPage" ELSE fd."nPage" END AS "nPage",

        cl."cColor",

        fd."jDate",

        cm."cCodename" as "cDatetype",
        st."cCodename" as "cStatus",
        ftp."cCodename" as "cFiletype",

        COALESCE(s.t_shared,0)  as "t_shared",
        COALESCE(ft.t_tasks,0)  as "t_tasks",
        COALESCE(fc.t_contact,0) as "t_contact",

        cmt."total" as "t_comments"

    FROM "FactMaster" f

    JOIN "UserMaster" um ON um."nUserid" = f."nUserid"
    JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"

    LEFT JOIN shared_ct s ON s."nFSid" = f."nFSid"
    LEFT JOIN task_ct ft ON ft."nFSid" = f."nFSid"
    LEFT JOIN contact_ct fc ON fc."nFSid" = f."nFSid"

    LEFT JOIN "Codemaster" cm
        ON cm."nCodeid" = (fd."jDate"->>'nValue')::int

    LEFT JOIN "Codemaster" tz
        ON tz."nCodeid" = fd."nTZid"

    LEFT JOIN "Codemaster" st
        ON st."nCodeid" = fd."nStatus"
		AND st."nCategoryid" = 24

    LEFT JOIN "Codemaster" ftp
        ON ftp."nCodeid" = fd."nFiletype"
		AND ftp."nCategoryid" = 23

    JOIN "RIssueMaster" cl
        ON cl."nIid" = fd."nColorid"

    LEFT JOIN realtime."comments" cmt
        ON cmt."nFSid" = f."nFSid"

    WHERE factids @> to_jsonb(f."nFSid")
      -- Orphan filter: on the published view, suppress facts whose annotation
      -- could not be re-anchored. Mirrors et_marks.sql:48-50.
      AND (
        COALESCE(bIsTranscipt, false) = false
        OR (fd."cTransferStatus" IS DISTINCT FROM 'O' AND fd."jTCordinates" IS NOT NULL)
      )

    ORDER BY
        f."nFSid",
        f."dCreateDt" DESC;

    --------------------------------------------------
    -- REF2 – ISSUES
    --------------------------------------------------

    OPEN ref2 FOR
    SELECT jsonb_agg(f."nFSid") AS "jFSids",
           fi."nIssueid", fi."nImpactid", fi."nRelevanceid",
           im."nICid", ic."cCategory", im."cIName", im."cColor"
    FROM "FactMaster" f
    JOIN "FMIssue" fi ON fi."nFSid" = f."nFSid"
    JOIN "RIssueMaster" im ON im."nIid" = fi."nIssueid"
    JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"
    WHERE factids @> to_jsonb(f."nFSid")
    GROUP BY fi."nIssueid", fi."nImpactid", fi."nRelevanceid",
             im."nICid", ic."cCategory", im."cIName", im."cColor";

    --------------------------------------------------
    -- REF3 – LINKS
    --------------------------------------------------

    OPEN ref3 FOR
    SELECT fl."nFSid", fl."nFMLid",
           fl."nBundledetailid",
           bd."cFilename" AS "cName",
           bd."cExhibitno", bd."cTab",
           fl."jLinktype", bd."cPage"
    FROM "FMLinks" fl
    JOIN "BundleDetail" bd
      ON bd."nBundledetailid" = fl."nBundledetailid"
    WHERE factids @> to_jsonb(fl."nFSid");

    RETURN NEXT ref1;
    RETURN NEXT ref2;
    RETURN NEXT ref3;

END;
$$;

-- ===== realtime.et_navigate_facts_bycompany(json, refcursor, refcursor, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION realtime.et_navigate_facts_bycompany(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$

declare nMasterid uuid;nSesid uuid;nCompanyid uuid;
isAdmin boolean default false;
cSortby text;cSorttype text;
factids jsonb;
    sql_query TEXT;
	jFilter jsonb;
	filter_string text;
    nBundledetailid uuid;
	historyEnabled boolean;
	nID uuid;
	fga_factids jsonb;

	nRoleid uuid;nTeamid uuid;nCaseid uuid;
	bIsTranscipt boolean default false;
begin

nSesid := NULLIF(parameter ->>'nSesid','')::uuid;
nCompanyid := NULLIF(parameter ->>'nCompanyid','')::uuid;
nMasterid := NULLIF(parameter ->>'nUserid','')::uuid;
cSorttype := parameter ->>'cSorttype';
cSortby := parameter ->>'cSortby';
	jFilter := coalesce(parameter ->>'jFilter','[]')::jsonb;
    nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
    bIsTranscipt := COALESCE(parameter ->> 'bIsTranscipt','false')::boolean;

isAdmin := case when exists (  select * from "UserMaster" where "nUserid" = nMasterid and "isAdmin" = true )  then true  else false  end;
 	if(nBundledetailid is not null) then
	 	select "nCaseid" into nCaseid from bundlesource where  "nBundledetailid" =  nBundledetailid;
	 else
		select "nCaseid" into nCaseid from "RSessionMaster" where "nSesid" = nSesid;
	 end if;

	select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nMasterid and "nCaseid" = nCaseid limit 1;
	raise notice 'nSesid ,nCaseid , nRoleid %,%,%',nSesid,nCaseid,nRoleid ;
	if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then
		isAdmin := true;
	end if;

historyEnabled := COALESCE(parameter ->> 'historyEnabled','false')::boolean;
	nID := (case when nSesid  is not distinct from null then nBundledetailid else nSesid end);

sql_query := 'SELECT jsonb_agg(distinct f."nFSid")
			  FROM "FactMaster" f
			  JOIN "FactDetail" d ON d."nFSid" = f."nFSid"
			  LEFT JOIN "FMTasks" t ON t."nFSid" = f."nFSid"
			  LEFT JOIN "TaskDetail" td ON td."nTaskid" = t."nTaskid"
			  LEFT JOIN "FMIssue" i ON i."nFSid" = f."nFSid"
			  LEFT JOIN "RIssueMaster" im ON im."nIid" = i."nIssueid"
			  LEFT JOIN "FMShared" s ON s."nFSid" = f."nFSid"
			  LEFT JOIN "FMContact" c ON c."nFSid" = f."nFSid"
			  left join "ContactMaster" cm on cm."nContactid" = c."nContactid"
			  LEFT JOIN "FMLinks" l ON l."nFSid" = f."nFSid"
			  '||(
                CASE WHEN historyEnabled = true
                     THEN 'JOIN realtime.history_marknav('|| quote_nullable(nSesid) ||','|| quote_nullable(nBundledetailid) ||','|| quote_nullable(nMasterid) ||',''F'','|| 1 || ') his ON his."id" = f."nFSid"'
                     ELSE '' END
              ) ||'
			  left join "TeamRelation" tr ON tr."nTeamid" = '''|| nTeamid ||'''
			 WHERE (f."nSesid" IS NOT DISTINCT FROM ' || quote_nullable(nSesid) || '
              OR f."nBundledetailid" IS NOT DISTINCT FROM ' || quote_nullable(nBundledetailid) || ')
              AND (f."nUserid" = ' || quote_nullable(nMasterid) || '
              OR s."nUserid" = ' || quote_nullable(nMasterid) || ' or (case when ''' || isAdmin || '''::boolean = true then  f."nUserid" = tr."nUserid" else false end))
			  '||(
                    CASE WHEN nCompanyid IS NULL
                    THEN 'AND cm."nCompanyid" IS NULL'
                    ELSE 'AND cm."nCompanyid" = ' || quote_nullable(nCompanyid)
                    END
                );


			IF jFilter IS NOT NULL AND jFilter <> '{}'::jsonb THEN

				sql_query := sql_query || '
				AND EXISTS (
				SELECT *
				FROM realtime.filter_marknav(''' || jFilter::text || '''::jsonb,
				' || quote_nullable(nID) || ',
				' || quote_nullable(nMasterid) || ',
				''F'',' || quote_nullable(nTeamid) || ','|| isAdmin ||') t
				WHERE t."id" = f."nFSid"
				)';
			END IF;

raise notice 'sql_query %', sql_query;
EXECUTE sql_query INTO factids;

IF factids IS NULL THEN
    factids := '[]'::jsonb;
END IF;

raise notice 'factids %', factids;

	open ref1 for
	  SELECT f."nFSid", f."dCreateDt", um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",um."nUserid",
        fd."nFiletype", fd."nTZid", "jLinktype", fd."cType", f."cFType", --tz."cCodename" AS "cTimezone",
        fd."jTexts", fd."jOT", fd."nColorid", fd."nStatus", cl."cColor" AS "cColor", fd."jDate", cm."cCodename" as "cDatetype",
		st."cCodename" as "cStatus", ftp."cCodename" as "cFiletype",
		fc."nContactid",cf."cProfile",cf."cFname",cf."cLname",
		fd."jCordinates",
		-- CASE on bIsTranscipt so the published view picks up nTPage written by
		-- run3.py during transferAnnotations. Mirrors et_marks.sql:57-58.
		CASE WHEN COALESCE(bIsTranscipt,false) THEN fd."nTPage" ELSE fd."nPage" END AS "nPage",
		cr."cRole",
		pr."cCodename" "cPartyname",
		cf."cMentiontag",
		f."nBundledetailid" ,
		count(s."nFMSdid") as "t_shared",
	count(ft."nFMTsid") as "t_tasks",
	count(fc."nFMCid") as "t_contact",
	cmt."total" as "t_comments"
    FROM "FactMaster" f
    JOIN "UserMaster" um ON um."nUserid" = f."nUserid"
    JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"
 	join "FMContact" fc on fc."nFSid" = f."nFSid"
	join "ContactMaster" cf on cf."nContactid" = fc."nContactid" and cf."nCompanyid" = nCompanyid
    JOIN "RIssueMaster" cl ON cl."nIid" = fd."nColorid"

	left join "FMShared" s on s."nFSid" = f."nFSid"
	left join "FMTasks" ft on ft."nFSid" = f."nFSid"

	left join "Codemaster" cm on cm."nCodeid" = (fd."jDate"->>'nValue')::int
    -- JOIN "Codemaster" tz ON tz."nCodeid" = fd."nTZid"
	left join "Codemaster" st on st."nCodeid" = fd."nStatus"
	left join "Codemaster" ftp on ftp."nCodeid" = fd."nFiletype"
	LEFT JOIN "Codemaster" pr ON pr."nCodeid" = cf."nPartyid"
	LEFT JOIN "ContactRole" cr ON cr."nCRoleid" = cf."nRoleid"
	left join realtime."comments" cmt on cmt."nFSid" = f."nFSid"
    WHERE  factids @> to_jsonb(f."nFSid")
      -- Orphan filter: on the published view, suppress facts whose annotation
      -- could not be re-anchored. Mirrors et_marks.sql:48-50.
      AND (
        COALESCE(bIsTranscipt, false) = false
        OR (fd."cTransferStatus" IS DISTINCT FROM 'O' AND fd."jTCordinates" IS NOT NULL)
      )
	group by f."nFSid",f."dCreateDt",um."cFname" ,um."cLname",um."nUserid",
        fd."nFiletype",fd."nTZid", -- tz."cCodename",
        "jLinktype",fd."cType",f."cFType",fd."jTexts",fd."jOT",
        fd."nColorid",cl."cColor",fd."jDate",fd."nStatus",
		fd."jCordinates",
		fd."nPage", fd."nTPage",
		cm."cCodename",st."cCodename",ftp."cCodename",fc."nContactid",cf."cProfile",cf."cFname",cf."cLname",
		cf."cMentiontag",
		f."nBundledetailid",
		cr."cRole",
		pr."cCodename",
		cmt."total"
	order by
		f."dCreateDt" DESC;

	 RETURN next ref1;

	open ref2 for
		select jsonb_agg(f."nFSid") "jFSids",fi."nIssueid",fi."nImpactid",fi."nRelevanceid",im."nICid",ic."cCategory",im."cIName",im."cColor",
		rl."cCodename",impct."cCodename"
		from "FactMaster" f
		join "FMIssue" fi on fi."nFSid" = f."nFSid"
		join "RIssueMaster" im on im."nIid" = fi."nIssueid"
		join "IssueCategory" ic on ic."nICid" = im."nICid"
		left join "Codemaster" rl on rl."nCodeid" = fi."nRelevanceid"
		left join "Codemaster" impct on impct."nCodeid" = fi."nImpactid"
		WHERE  factids @> to_jsonb(f."nFSid")
		 group by fi."nIssueid",fi."nImpactid",fi."nRelevanceid" ,im."nICid",ic."cCategory",im."cIName",im."cColor",rl."cCodename",impct."cCodename" ;


	 RETURN next ref2;


	 open ref3 for
		select fl."nFMLid",fl."nBundledetailid",bd."cFilename" "cName",bd."cExhibitno",bd."cTab",fl."jLinktype","cPage"
		from  "FMLinks" fl
		join "BundleDetail" bd on bd."nBundledetailid" = fl."nBundledetailid"
		  		WHERE  factids @> to_jsonb(fl."nFSid") ;

	 RETURN next ref3;

    END;
$$;

-- ===== realtime.et_navigate_get_all(json, refcursor, refcursor, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION realtime.et_navigate_get_all(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$
DECLARE
	nID uuid;

    nMasterid uuid;
    nSesid uuid;
    nBundledetailid uuid;
	cSortby text;
	perPage int := 10;
	pageNumber int;
    offsetCount int;
	jFilter jsonb;
	sql_query TEXT;
	sql_query_doc_links TEXT;
	sql_query_qm TEXT;
	filter_string text default null;
    filter_string_doc_links text default null;
	filter_string_q_mark text default null;
	factids jsonb;
    docids jsonb;
	bIsTranscipt boolean default false;
	historyEnabled boolean;

	isAdmin boolean default false;
	nRoleid uuid;nTeamid uuid;nCaseid uuid;
	-- fga_factids jsonb;



BEGIN
    -- Extract parameters
    nSesid := NULLIF(parameter->>'nSesid','')::uuid;
    nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
    nMasterid := NULLIF(parameter->>'nUserid','')::uuid;
    cSortby := parameter->>'cSortby';
    pageNumber := COALESCE((parameter->>'nPageNumber')::int, 1);
    offsetCount := (pageNumber - 1) * perPage;
	jFilter := parameter ->>'jFilter';
	-- jFilter := parameter -> 'jFilter';  -- returns jsonb directly
	bIsTranscipt := COALESCE(parameter ->> 'bIsTranscipt','false')::boolean;
	-- fga_factids := parameter->>'jFactids';

	nID := (case when nSesid  is not distinct from null then nBundledetailid else nSesid end);

	historyEnabled := COALESCE(parameter ->> 'historyEnabled','false')::boolean;
	-- create a temp table to dump data from history_marknav

isAdmin := case when exists (select * from "UserMaster" where "nUserid" = nMasterid and "isAdmin" = true )  then true  else false  end;

 if(nBundledetailid is not null) then
 	select "nCaseid" into nCaseid from bundlesource where  "nBundledetailid" =  nBundledetailid;
 else
 -- select * from "RSessionMaster" where "nSesid" = '3695e05a-b8bf-4b13-9e80-f38b10bf7cf1';
	select "nCaseid" into nCaseid from "RSessionMaster" where "nSesid" = nSesid;
 end if;

select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nMasterid and "nCaseid" = nCaseid limit 1;
-- raise notice 'nSesid ,nCaseid , nRoleid %,%,%',nSesid,nCaseid,nRoleid ;
if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then
	isAdmin := true;
end if;


	DROP TABLE IF EXISTS temp_history_marknav;
  IF historyEnabled THEN

	CREATE TEMP TABLE temp_history_marknav ON COMMIT DROP AS
	SELECT *
	FROM realtime.history_marknav(
	nSesid,
	nBundledetailid,
	nMasterid,
	'ALL',
	1
	);

  END IF;


	sql_query := '
	 SELECT jsonb_agg(distinct f."nFSid")
    FROM "FactMaster" f
    JOIN "FactDetail" d ON d."nFSid" = f."nFSid"
	left join "TeamRelation" tr ON tr."nTeamid" = '''|| nTeamid ||'''
    LEFT JOIN "FMTasks" t ON t."nFSid" = f."nFSid"
	LEFT JOIN "TaskDetail" td ON td."nTaskid" = t."nTaskid"
	LEFT JOIN "FMIssue" i ON i."nFSid" = f."nFSid"
	LEFT JOIN "RIssueMaster" im ON im."nIid" = i."nIssueid"
    LEFT JOIN "FMShared" s ON s."nFSid" = f."nFSid"
    LEFT JOIN "FMContact" c ON c."nFSid" = f."nFSid"
    LEFT JOIN "FMLinks" l ON l."nFSid" = f."nFSid"
	 '|| (case when historyEnabled = true then
	'join temp_history_marknav his on his."id" = f."nFSid" '
	else '' end
	) ||'
	WHERE (f."nSesid" = ' || quote_nullable(nSesid) || '
		OR f."nBundledetailid" = ' || quote_nullable(nBundledetailid) || ')
	AND (f."nUserid" = ' || quote_nullable(nMasterid) || '
	OR s."nUserid" = ' || quote_nullable(nMasterid) || '
	or (case when ''' || isAdmin || '''::boolean = true then  f."nUserid" = tr."nUserid" else false end))';

	--or ('''|| coalesce(fga_factids,'[]')::text || ''')::jsonb @> to_jsonb(f."nFSid")
	-- IF jFilter IS NOT NULL AND jsonb_array_length(jFilter) > 0 THEN
	IF jFilter IS NOT NULL AND jFilter <> '{}'::jsonb THEN

    sql_query := sql_query || '
      AND EXISTS (
          SELECT *
          FROM realtime.filter_marknav(''' || jFilter::text || '''::jsonb,
                                        ' || quote_nullable(nID) || ',
                                        ' || quote_nullable(nMasterid) || ',
                                        ''ALL'',' || quote_nullable(nTeamid) || ','|| isAdmin ||') t
          WHERE t."id" = f."nFSid"
      )';
END IF;

RAISE NOTICE 'Fact SQL: %', sql_query;
EXECUTE sql_query INTO factids;

RAISE NOTICE 'Fact SQL Result: %', factids;

IF factids IS NULL THEN
    factids := '[]'::jsonb;
END IF;
/*IF (coalesce(historyEnabled,false) = false) THEN
factids := coalesce(fga_factids, '[]'::jsonb) || coalesce(factids, '[]'::jsonb);
END IF;*/

sql_query_doc_links := '
				SELECT jsonb_agg(DISTINCT m."nDocid")
				FROM "DocMaster"  m
				JOIN "DocDetail"  d  ON d."nDocid" = m."nDocid"
				left join "TeamRelation" tr ON tr."nTeamid" = '''|| nTeamid ||'''
				LEFT JOIN "DMLinks"  l  ON l."nDocid" = m."nDocid"
				LEFT JOIN "DMShared" ds ON ds."nDocid" = m."nDocid"
				'|| (case when historyEnabled = true then
				'join temp_history_marknav his on his."id" = m."nDocid" '
				else '' end
				) ||'
				WHERE
						(m."nUserid" = ' || quote_nullable(nMasterid) || '
					OR  ds."nUserid" = ' || quote_nullable(nMasterid) || '
	or (case when ''' || isAdmin || '''::boolean = true then  m."nUserid" = tr."nUserid" else false end))
					AND (m."nSesid" IS NOT DISTINCT FROM ' || quote_nullable(nSesid) || '
					OR  m."nBundledetailid" IS NOT DISTINCT FROM ' || quote_nullable(nBundledetailid) || ')
					';

				-- Append filter only if jFilter is a non-empty object
				IF jFilter IS NOT NULL AND jFilter <> '{}'::jsonb THEN
				sql_query_doc_links := sql_query_doc_links || '
					AND EXISTS (
					SELECT 1
					FROM realtime.filter_marknav(''' || jFilter::text || '''::jsonb,
													' || quote_nullable(nID) || ',
													' || quote_nullable(nMasterid) || ',
													''ALL'',' || quote_nullable(nTeamid) || ','|| isAdmin ||') t
					WHERE t."id" = m."nDocid"
					)';
				END IF;

-- Execute and capture into docids (jsonb)
RAISE NOTICE 'Fact SQL: %', sql_query_doc_links;
EXECUTE sql_query_doc_links INTO docids;
RAISE NOTICE 'docids: %', docids;
-- Normalize to empty array when no rows
IF docids IS NULL THEN
  docids := '[]'::jsonb;
END IF;

-- Build dynamic SQL for QM
sql_query_qm := '
    SELECT
        ''QM'' AS "cSource",
        rh."nHid" as "id",
        null::uuid as "nFSid",
        rh."dCreatedt" AS "dCreateDt",
        um."cFname" || '' '' || COALESCE(um."cLname", '''') AS "cCreateby",
        NULL::text AS "cType",
		NULL::uuid AS "nBundledetailid",
        NULL::jsonb AS "jLinktype",
        NULL::jsonb AS "jTexts",
		NULL::jsonb AS "jOT",
        NULL::jsonb AS "jCordinates",
        (CASE WHEN '|| bIsTranscipt ||' THEN rh."cTPageno" ELSE rh."cPageno" END)::int AS "nPage",
        (CASE WHEN '|| bIsTranscipt ||' THEN rh."cTLineno" ELSE rh."cLineno" END)::int AS "nLine",
		(CASE WHEN ' || bIsTranscipt || ' THEN rh."cTTime" ELSE rh."cTime" END) AS "cTime",
        NULL::text AS "cColor",
        NULL::jsonb AS "jDate",
        NULL::jsonb AS list,
        rh."nUserid",
		null::bigint as "t_shared",
		null::bigint as "t_tasks",
		null::bigint as "t_contact",
		null::bigint as "total"
    FROM "RHighlights" rh
    JOIN "UserMaster" um ON um."nUserid" = rh."nUserid" '
    || (CASE WHEN historyEnabled THEN
        ' JOIN temp_history_marknav his ON his."id" = rh."nHid" '
       ELSE '' END) || '
    WHERE rh."nUserid" = ' || quote_nullable(nMasterid) || '
      AND rh."nSessionId" = ' || quote_nullable(nSesid);

-- Append filter only if jFilter present
IF jFilter IS NOT NULL AND jFilter <> '{}'::jsonb THEN
    sql_query_qm := sql_query_qm || '
      AND EXISTS (
          SELECT *
          FROM realtime.filter_marknav(''' || jFilter::text || '''::jsonb,
                                        ' || quote_nullable(nID) || ',
                                        ' || quote_nullable(nMasterid) || ',
                                        ''ALL'',' || quote_nullable(nTeamid) || ','|| isAdmin ||') t
          WHERE t."id" = rh."nHid"
      )';
END IF;

DROP TABLE IF EXISTS qmarktable;
 EXECUTE 'CREATE TEMP TABLE qmarktable ON COMMIT DROP AS ' || sql_query_qm;

OPEN ref1 FOR
		with links as (
		    select 	l."nDocid",l."nDMLids" ,l."jLinktype",l."nBundledetailid",d.*
			from "DMLinks" l
			join bundlesource d on d."nBundledetailid" = l."nBundledetailid"
			where docids @> to_jsonb(l."nDocid")
		),
		 combined_results AS (
		SELECT distinct
			case when f."cFType" = 'F' then 'F' else 'QF' end as "cSource",
		    f."nFSid"::uuid as "id",
			f."nFSid",
		    f."dCreateDt",
		    um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
		    fd."cType",
			f."nBundledetailid",
		    fd."jLinktype",
		    fd."jTexts" AS "jTexts",
			fd."jOT",
			fd."jCordinates",
			-- CASE on bIsTranscipt so the published view picks up the
			-- nTPage/nTLine values written by run3.py during transferAnnotations.
			-- Mirrors the canonical pattern in et_marks.sql:57-58 for RHighlights.
			CASE WHEN COALESCE(bIsTranscipt,false) THEN fd."nTPage" ELSE fd."nPage" END AS "nPage",
			CASE WHEN COALESCE(bIsTranscipt,false) THEN fd."nTLine" ELSE fd."nLine" END AS "nLine",
			null as "cTime",
		   cl."cColor" AS "cColor",
		    fd."jDate",
			null::jsonb as list,
			f."nUserid",
			count(fs."nFMSdid") as "t_shared",
			count(ft."nFMTsid") as "t_tasks",
			count(fc."nFMCid") as "t_contact",
			cmt."total" as "t_comments"
		FROM "FactMaster" f
		JOIN "UserMaster" um ON um."nUserid" = f."nUserid"
		JOIN "FactDetail" fd ON fd."nFSid" = f."nFSid"
    	JOIN "RIssueMaster" cl ON cl."nIid" = fd."nColorid"
		LEFT JOIN "FMShared" fs ON fs."nFSid" = f."nFSid"
		left join "FMTasks" ft on ft."nFSid" = f."nFSid"
		left join "FMContact" fc on fc."nFSid" = f."nFSid"
		LEFT JOIN "Codemaster" cm ON cm."nCodeid" = (fd."jDate"->>'nValue')::int
		left join realtime."comments" cmt on cmt."nFSid" = f."nFSid"
 		WHERE (f."nSesid" = nSesid OR f."nBundledetailid" = nBundledetailid)
		   and factids @> to_jsonb(f."nFSid")
		   -- Orphan filter: on the published view, suppress facts whose
		   -- annotation could not be re-anchored (run3.py stamped 'O' and
		   -- cleared jTCordinates). Mirrors et_marks.sql:48-50.
		   AND (
		     COALESCE(bIsTranscipt, false) = false
		     OR (fd."cTransferStatus" IS DISTINCT FROM 'O' AND fd."jTCordinates" IS NOT NULL)
		   )
		   group by f."cFType", f."nFSid",  um."cFname",um."cLname",
		    fd."cType",
			f."nBundledetailid",
		    fd."jLinktype",
		    fd."jTexts",
			fd."jOT",
			fd."jCordinates",
			fd."nPage", fd."nTPage",
			fd."nLine", fd."nTLine",
			 cl."cColor",
		    fd."jDate",
			f."nUserid",
			cmt."total"

		UNION ALL
		SELECT
		    'D' AS "cSource",
			m."nDocid"::uuid as "id",
		    m."nDocid"::uuid,
		   m."dCreateDt",
		    um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
		    dd."cType",
			m."nBundledetailid",
		    dd."jLinktype",
		    dd."jTexts" AS "jText",
			dd."jOText" as "jOT",
			dd."jCordinates",
			-- Same CASE pattern as the FactDetail arm above; published view
			-- reads the transferred coords from nTPage/nTLine.
			CASE WHEN COALESCE(bIsTranscipt,false) THEN dd."nTPage" ELSE dd."nPage" END AS "nPage",
			CASE WHEN COALESCE(bIsTranscipt,false) THEN dd."nTLine" ELSE dd."nLine" END AS "nLine",
			null as "cTime",
			null "cColor",
			null "jDate",
			jsonb_agg(distinct l.*) as list,
			m."nUserid",
			count(ds."nDMSid") as "t_shared",
			null::bigint as "t_tasks",
			null::bigint as "t_contact",
			cmt."total" as "t_comments"
		  FROM "DocMaster" m
		  JOIN "UserMaster" um ON um."nUserid" = m."nUserid"
		  JOIN "DocDetail" dd ON dd."nDocid" = m."nDocid"
		  JOIN "links" l ON l."nDocid" = m."nDocid"
		  LEFT JOIN "DMShared" ds ON ds."nDocid" = m."nDocid"
		  left join realtime."comments" cmt on cmt."nDocid" = m."nDocid"
		  where  (m."nSesid" = nSesid OR m."nBundledetailid" = nBundledetailid)
		  and docids @> to_jsonb(m."nDocid")
		  -- Orphan filter for the doc-link arm; same rationale as the FactDetail
		  -- WHERE above.
		  AND (
		    COALESCE(bIsTranscipt, false) = false
		    OR (dd."cTransferStatus" IS DISTINCT FROM 'O' AND dd."jTCordinates" IS NOT NULL)
		  )
		  group by m."nDocid", m."dCreateDt",um."cFname",um."cLname", dd."cType",
		  m."nBundledetailid" ,dd."jLinktype",dd."jTexts",dd."jOText" ,dd."jCordinates",
		  dd."nPage", dd."nTPage", dd."nLine", dd."nTLine", cmt."total"

		union all
		 select  *	from qmarktable
		)
		SELECT * FROM combined_results
		ORDER BY
			CASE WHEN cSortby = 'asc' THEN coalesce(coalesce("nPage",("jLinktype"->'pages'->>0)::int),("jLinktype"->>'start')::int) END ASC,
			CASE WHEN cSortby = 'desc' THEN coalesce(coalesce("nPage",("jLinktype"->'pages'->>0)::int),("jLinktype"->>'start')::int) END DESC,
			CASE WHEN cSortby = 'asc' THEN "dCreateDt" END ASC,
			CASE WHEN cSortby = 'desc' THEN "dCreateDt" END DESC;
			-- ,"dCreateDt" DESC;

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
	  WHERE  (f."nSesid" = nSesid OR f."nBundledetailid" = nBundledetailid) and factids @> to_jsonb(f."nFSid")
    GROUP BY fi."nIssueid", fi."nImpactid", fi."nRelevanceid",
             im."nICid", ic."cCategory", im."cIName", im."cColor",
             rl."cCodename", impct."cCodename";

OPEN ref3 FOR

    SELECT fl."nFSid",fl."nFMLid", bd."nBundledetailid",
           bd."cFilename" AS "cName", bd."cExhibitno", bd."cTab",
           fl."jLinktype", bd."cPage"
    FROM "FMLinks" fl
	JOIN "BundleDetail" bd ON bd."nBundledetailid" = fl."nBundledetailid"
	  WHERE factids @> to_jsonb(fl."nFSid");

   RETURN NEXT ref1;
   RETURN NEXT ref2;
   RETURN NEXT ref3;

END;
$$;

-- ===== realtime.et_realtime_handle_update_claim(json, refcursor) (2026-05-19 body) =====
CREATE OR REPLACE FUNCTION realtime.et_realtime_handle_update_claim(parameter json, ref refcursor) RETURNS refcursor
    LANGUAGE plpgsql
    AS $$
DECLARE
    nICid UUID;cCategory text;
	nUserid UUID;
	msg int;msg_text text;
BEGIN
    nICid := NULLIF(parameter ->> 'nICid','')::UUID;
	nUserid:= NULLIF(parameter ->> 'nUserid','')::UUID;
	cCategory:= parameter ->> 'cCategory';

    msg := 1;
        -- Check if the issue name exists
	update "IssueCategory" set "cCategory" = cCategory,"nUserid" = nUserid where "nICid" = nICid;

	msg_text := 'Updated';

    OPEN ref FOR SELECT msg, msg_text AS message;

    RETURN ref;
END;
$$;

-- ===== restore dropped overload public.et_dashboard(json, refcursor, refcursor, refcursor) =====
CREATE OR REPLACE FUNCTION public.et_dashboard(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$
declare nMasterid uuid;pageNumber int;offsetCount int;perPage int default 10;jCases jsonb;allcases uuid[];
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
pageNumber := coalesce( (parameter ->>'pageNumber')::int ,1);
offsetCount := (pageNumber - 1) * perPage;

/*
 select * from et_dashboard('{"nMasterid":285,"pageNumber":1}','r1','r2','r3');FETCH All in "r3";
 FETCH All in "r2";
 FETCH All in "r3";
select * from et_admindashboard ('{\"pageNumber\":1,\"nMasterid\":2}','r1','r2','r3');fetch all in \"r1\";fetch all in \"r2\";fetch all in \"r3\";
*/

allcases = (array (
	select t."nCaseid" From "TeamRelation" t
	join "CaseMaster" c on c."nCaseid" = t."nCaseid" and "isArchived" = false
	where t."nUserid" = nMasterid and t."cStatus" = 'A'
group by t."nCaseid",c."dUpdateDt",c."dCreateDt" order by  coalesce(c."dUpdateDt",c."dCreateDt") desc
        LIMIT perPage
        OFFSET offsetCount
));


    OPEN ref1 FOR
	select  c."nCaseid",c."cCasename",c."cCaseno",c."dUpdateDt"
	,jsonb_agg(pm."cType") filter (where up."nPMid" is not null ) "jPermission"
    FROM  "CaseMaster" c
	-- NOTE: PermissionModule IDs (5,15,16) are still integers in the database, not UUIDs
	-- If these are converted to UUIDs, this line should be updated with the UUID values
	left join "UserPermission" up on up."nCaseid" = c."nCaseid" and  up."nPMid" in (5,15,16) and up."nUserid" = nMasterid
	left join "PermissionModule" pm on pm."nPMid" = up."nPMid"
	where c."nCaseid" = ANY(allcases)
	group by c."nCaseid",c."cCasename",c."cCaseno",c."dUpdateDt"
	order by c."dUpdateDt" desc;

    RETURN NEXT ref1;





    OPEN ref2 FOR
	SELECT t."nTeamid", t."cTeamname", t."nCaseid"
    FROM  "TeamMaster" t
    JOIN "TeamRelation" tr ON tr."nTeamid" = t."nTeamid"
	where t."nCaseid" = ANY(allcases)

	 AND (
        EXISTS (
            SELECT 1
            FROM "UserMaster" um
            WHERE um."nUserid" = nMasterid AND um."isAdmin" = true
        )
        OR EXISTS (
            SELECT 1
            FROM "TeamRelation" tr
            WHERE tr."nUserid" = nMasterid
              AND (
                  (t."nCaseid" = tr."nCaseid" AND tr."nRoleid" = '8632ee5c-e854-411c-b83d-c21656ad39ac'::uuid)
                  OR tr."nTeamid" = t."nTeamid"
              )
        )
    )
    GROUP BY t."nTeamid", t."cTeamname", t."nCaseid";

 	RETURN NEXT ref2;


	-- select * from "UserMaster"

    OPEN ref3 FOR

	 SELECT jsonb_agg(DISTINCT t."nTeamid") AS "teams",u."nUserid", u."cFname", u."cLname", u."cProfile",t."nRoleid"
    FROM "TeamRelation" t
    JOIN "UserMaster" u ON u."nUserid" = t."nUserid"
	where t."nCaseid" = ANY(allcases)
	 AND (
        EXISTS (
            SELECT 1
            FROM "UserMaster" um
            WHERE um."nUserid" = nMasterid AND um."isAdmin" = true
        )
        OR EXISTS (
            SELECT 1
            FROM "TeamRelation" tr
            WHERE tr."nUserid" = nMasterid
              AND (
                  (t."nCaseid" = tr."nCaseid" AND tr."nRoleid" = '8632ee5c-e854-411c-b83d-c21656ad39ac'::uuid)
                  OR tr."nTeamid" = t."nTeamid"
              )
        )
    )
    GROUP BY u."nUserid",u."cFname", u."cLname", u."cProfile",t."nRoleid"
	;

	 RETURN NEXT ref3;

END;
$$;
UPDATE public."Codemaster" SET "cCodename" = 'Heavily for us', "nSerialno" = 1 WHERE "nCodeid" = 20 AND "nCategoryid" = 5 AND "cCodename" = 'Strongly For Us';
UPDATE public."Codemaster" SET "cCodename" = 'For us', "nSerialno" = 2 WHERE "nCodeid" = 19 AND "nCategoryid" = 5 AND "cCodename" = 'For Us';
UPDATE public."Codemaster" SET "cCodename" = 'Against us', "nSerialno" = 5 WHERE "nCodeid" = 18 AND "nCategoryid" = 5 AND "cCodename" = 'Against Us';
UPDATE public."Codemaster" SET "cCodename" = 'Heavily against us', "nSerialno" = 4 WHERE "nCodeid" = 21 AND "nCategoryid" = 5 AND "cCodename" = 'Strongly Against Us';
UPDATE public."Codemaster" SET "cCodename" = 'Unsure', "nSerialno" = 6 WHERE "nCodeid" = 23 AND "nCategoryid" = 5 AND "cCodename" = 'Unsure';
UPDATE public."Codemaster" SET "cCodename" = 'Neutral', "nSerialno" = 5 WHERE "nCodeid" = 17 AND "nCategoryid" = 4 AND "cCodename" = 'Neutral';
UPDATE public."Codemaster" SET "cCodename" = 'Contract', "nSerialno" = NULL WHERE "nCodeid" = 50 AND "nCategoryid" = 23 AND "cCodename" = 'Contract/Agreement';
UPDATE public."Codemaster" SET "cCodename" = 'Correspondence', "nSerialno" = NULL WHERE "nCodeid" = 51 AND "nCategoryid" = 23 AND "cCodename" = 'Correspondence';
UPDATE public."Codemaster" SET "cCodename" = 'Witness Statement', "nSerialno" = NULL WHERE "nCodeid" = 49 AND "nCategoryid" = 23 AND "cCodename" = 'Witness Evidence';
UPDATE public."Codemaster" SET "cCodename" = 'Expert Report', "nSerialno" = NULL WHERE "nCodeid" = 48 AND "nCategoryid" = 23 AND "cCodename" = 'Expert Evidence';
UPDATE public."Codemaster" SET "cCodename" = 'Disputed', "nSerialno" = 2 WHERE "nCodeid" = 45 AND "nCategoryid" = 24 AND "cCodename" = 'Disputed';
UPDATE public."Codemaster" SET "cCodename" = 'Stipulated', "nSerialno" = 1 WHERE "nCodeid" = 44 AND "nCategoryid" = 24 AND "cCodename" = 'Stipulated';
UPDATE public."Codemaster" SET "cCodename" = 'Alleged', "nSerialno" = 3 WHERE "nCodeid" = 46 AND "nCategoryid" = 24 AND "cCodename" = 'Alleged';
UPDATE public."Codemaster" SET "cCodename" = 'Tentative', "nSerialno" = 4 WHERE "nCodeid" = 47 AND "nCategoryid" = 24 AND "cCodename" = 'Tentative';
COMMIT;
DROP INDEX CONCURRENTLY IF EXISTS public."ix_bd_desc_trgm";
DROP INDEX CONCURRENTLY IF EXISTS public."ix_bd_exhibit_norm_trgm";
DROP INDEX CONCURRENTLY IF EXISTS public."ix_bd_exhibit_trgm";
DROP INDEX CONCURRENTLY IF EXISTS public."ix_bd_filename_trgm";
DROP INDEX CONCURRENTLY IF EXISTS public."ix_bd_tab_trgm";
DROP INDEX CONCURRENTLY IF EXISTS public."ix_bundlemaster_bundlename_trgm";
DROP INDEX CONCURRENTLY IF EXISTS public."ix_bundlemaster_bundletag_trgm";
DROP INDEX CONCURRENTLY IF EXISTS public."ix_bundlemaster_parent";
DROP INDEX CONCURRENTLY IF EXISTS public."ix_bundlemaster_section";
DROP INDEX CONCURRENTLY IF EXISTS public."ix_outputdataexport_case_user";
DROP INDEX CONCURRENTLY IF EXISTS public."ix_rtconnectivitylogs_ddt";
DROP INDEX CONCURRENTLY IF EXISTS public."ix_savedsearch_user_case";
DROP INDEX CONCURRENTLY IF EXISTS public."ix_section_case_order";
DROP INDEX CONCURRENTLY IF EXISTS public."ix_workspaceview_case_shared";
DROP INDEX CONCURRENTLY IF EXISTS public."ix_workspaceview_case_user";
