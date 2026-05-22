CREATE OR REPLACE FUNCTION realtime.filter_marknav(jfilter jsonb, nsesid uuid, nuserid uuid, ctype text)
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

		start_dt timestamp;end_dt timestamp;dateType text;

		
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
	where ("nSesid" = nSesid   or "nBundledetailid" = nSesid)
	and 
	(
		(IsCreateByMe is null and IsShared is null and ("nCreateid" = nUserid or "nShareUserid" = nUserid))
		or (
			(IsCreateByMe is not null and  "nCreateid" = nUserid)
			or 
			(IsShared is not null and "nShareUserid" = nUserid)
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
		or (jCRoles is not null and jCRoles @> to_jsonb("nRoleid"))
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
$function$
