CREATE OR REPLACE FUNCTION realtime.filter_marknav_backup(jfilter jsonb, nsesid uuid, nuserid uuid, ctype text)
 RETURNS TABLE(id uuid, type text)
 LANGUAGE plpgsql
AS $function$

declare 
		jClaims jsonb;jIssues jsonb;jRels jsonb;jImps jsonb;
		IsNote boolean;IsFactlink boolean;IsComment boolean;
		jContacts jsonb;jCRoles jsonb;jCPartys jsonb;jCCompanies jsonb;IsContactNote boolean;
		jTasks jsonb;IsTaskDesc boolean;jTShared jsonb;jTStatus jsonb;jTPriority jsonb;
		jDate jsonb;jFiletypes jsonb;jStatus jsonb;createDate jsonb;createBy jsonb;dTDate timestamp;

		IsCreateByMe boolean;IsShared boolean;
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
	
/*
select now()
select * from realtime.filter_marknav('{"createDate":{"start":"2025-08-27","end":"2025-08-27"}}'::jsonb,'79d6fa26-7d27-49a3-8204-1e128505b682','ba561c55-81f5-4180-8934-2ce6dcaa096c','ALL')

select * from "IssueCategory" order by "dCreateDt" desc

select * from "ContactMaster" order by "dCreateDt" desc

select * from "FMShared"

select * from "TaskDetail" jTimeline->>'dEnd'

select * from "DMShared"

*/

    RETURN QUERY
 
with tbl as (
	select f."nFSid" as "id",f."cFType"::text "type",f."nSesid",f."nUserid" as "nCreateid",
	fi."nImpactid",fi."nRelevanceid",fi."nIssueid",i."nICid",
	jsonb_array_length(coalesce(fd."jTexts",'[]'::jsonb))>0 as "IsNote",
	coalesce(fl."nFMLid",'00000000-0000-0000-0000-000000000000'::uuid) != '00000000-0000-0000-0000-000000000000'::uuid as "IsFactlink",
	cm."nContactid",cm."nRoleid",cm."nCompanyid",cm."nPartyid",
	coalesce(cm."cNote",'') != '' as "IsContactNote",
	td."nTaskid",coalesce(td."cDesc",'') != '' as "IsTaskDesc",td."nStatus" as "nTStatus",td."nPriority",ts."nUserid" as "nTShareUserid",td."jTimeline",
	fd."nFiletype",fd."nStatus",f."dCreateDt",fd."jDate",
	fs."nUserid" as "nShareUserid"
	from "FactMaster" f
	join "FactDetail" fd on fd."nFSid" = f."nFSid"
	join "FMIssue" fi on fi."nFSid" = f."nFSid"
	join "RIssueMaster" i on i."nIid" = fi."nIssueid"
	left join "FMShared" fs on fs."nFSid" = f."nFSid"
	left join "FMLinks" fl on fl."nFSid" = f."nFSid"
	left join "FMContact" fc on fc."nFSid" = f."nFSid"
	left join "ContactMaster" cm on cm."nContactid" = fc."nContactid"
	left join "FMTasks" fm on fm."nFSid" = f."nFSid"
	left join "TaskDetail" td on td."nTaskid" = fm."nTaskid"
	left join "TaskShared" ts on ts."nTaskid" = fm."nTaskid"
	where case when cType = 'ALL' then true else ("cFType" = cType) end
	union all
	select d."nDocid" as "id",'D'::text as "type",d."nSesid",d."nUserid" as "nCreateid",
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
	  NULL::jsonb       as "jTimeline",
	  NULL::integer     as "nFiletype",
	  NULL::integer     as "nStatus",
	  d."dCreateDt",
	  NULL::jsonb       as "jDate",
	  s."nUserid" as "nShareUserid"
	From "DocMaster" d
	left join "DMShared" s on s."nDocid" = d."nDocid"
	where case when cType = 'ALL' then true else cType = 'D' end
	
) select t."id",t."type" 
	from tbl t
	where "nSesid" = nSesid 
	and 
	(
		(IsCreateByMe is null and IsShared is null and ("nCreateid" = nUserid or "nShareUserid" = nUserid))
		or (
			(IsCreateByMe is not null and  "nCreateid" = nUserid)
			or 
			(IsShared is not null and "nShareUserid" = nUserid)
		)
	)
	and 
	(
		(jClaims is null and jIssues is null and jRels is null and jImps is null)
		or
		(
			(jClaims is not null and jClaims @> to_jsonb("nICid"))
			or (jIssues is not null and jIssues @> to_jsonb("nIssueid"))
			or (jRels is not null and jRels @> to_jsonb("nRelevanceid"))
			or (jImps is not null and jImps @> to_jsonb("nImpactid"))
		)
	)
	and 
	(
		(IsNote is null and IsFactlink is null and IsComment is null)
		or 
		(
			(IsNote is not null and "IsNote" = true)
			or (IsFactlink is not null and "IsFactlink" = true)
			-- or (IsComment is not null and "IsComment" = true)
		)
	)
	and 
	( 	
		(jContacts IS NULL and jCRoles is null and jCPartys is null and jCCompanies is null and IsContactNote is null) 
		or
		(
			(jContacts is not null and jContacts @> to_jsonb("nContactid"))
			or (jCRoles is not null and jCRoles @> to_jsonb("nRoleid"))
			or (jCPartys is not null and jCPartys @> to_jsonb("nPartyid"))
			or (jCCompanies is not null and jCCompanies @> to_jsonb("nCompanyid"))
			or (IsContactNote is not null and "IsContactNote" = true)
		)
	)
	and 
	(
		(jTasks is null and IsTaskDesc is null and jTShared is null and jTStatus is null and jTPriority is null and dTDate is null)
		or 
		(
			(jTasks is not null and jTasks @> to_jsonb("nTaskid"))
			or (IsTaskDesc is not null and "IsTaskDesc"  = true)
			or (jTShared is not null and jTShared @> to_jsonb("nTShareUserid"))
			or (jTStatus is not null and jTStatus @> to_jsonb("nTStatus"))
			or (jTPriority is not null and jTPriority @> to_jsonb("nPriority"))
			--or (dTDate )
		)
	)
	and 
	(
		(jDate is null and jFiletypes is null and jStatus is null and createDate is null and createBy is null)
		or 
		(
			(jFiletypes is not null and jFiletypes @> to_jsonb("nFiletype"))
			-- or jDate
			or (jStatus is not null and jStatus @> to_jsonb("nStatus") )
			or (createDate is not null and "dCreateDt"::date between (createDate->>'start')::date and  (createDate->>'end')::date )
			or (createBy is not null and createBy @> to_jsonb("nCreateid"))
		)
	)
	group by t."id",t."type" 
;
	

	  
END;
$function$
