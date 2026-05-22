CREATE OR REPLACE FUNCTION public.et_realtime_sync_sessions(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    jSessions jsonb;jUsers jsonb;jServers jsonb;rec RECORD;x record;
    nUId uuid;nRTSid uuid;nCaseid uuid;nSesid uuid;jUpdatedSessions jsonb;jDeleted jsonb;
    v_zero_uuid uuid := '00000000-0000-0000-0000-000000000000'::uuid;

BEGIN
    jSessions := parameter ->> 'jSessions';
    jUsers := parameter ->> 'jUsers';
    jServers := parameter ->> 'jServers';
	jDeleted := parameter ->> 'jDeleted';

-- select * from et_realtime_sync_sessions ('{"jSessions":"[]","jUsers":"[]","jServers":"[]"}','r1');fetch all in "r1";

drop table if exists temp_users;
create temp table temp_users as 
select NULLIF(COALESCE("nUserid"::text, ''), '')::uuid as "nUserid","nId","cEmail" from jsonb_to_recordset(jUsers) as ("cEmail" text,"nId" int,"nUserid" text);

drop table if exists temp_servers;
create temp table temp_servers as 
select * from jsonb_to_recordset(jServers) as ("nId" int,"nUserid" uuid,"cName" text,"cUrl" text,"nPort" int,"nRTSid" uuid);

drop table if exists temp_sessions;
create temp table temp_sessions as 
select * from jsonb_to_recordset(jSessions) as ("nId" int,"nUserid" uuid,"nSesid" uuid,"nRTSid" uuid,"cCaseno" text,"cName" text,"cUnicuserid" text,"dStartDt" timestamp,"nDays" int,"nLines" int,"nPageno" int,"cTimezone" text,"cStatus" text,"cMsg" text,"cRStatus" text,"nCaseid" uuid,"cProtocol" text);

drop table if exists temp_deleted_session;
create temp table temp_deleted_session as 
select * from jsonb_to_recordset(jDeleted) as ("nId" int,"nSesid" uuid);

update "temp_users" t set "nUserid" = u."nUserid" from "UserMaster" u where upper(trim(u."cEmail")) = upper(trim(t."cEmail"));

update "RSessionMaster" s set "cStatus" = 'C',"dDelDt" = now() from temp_deleted_session t where t."nSesid" = s."nSesid";

   FOR x IN SELECT * FROM temp_servers
	LOOP
		if exists (select * from "RealtimeServers" r where r."cUrl" = x."cUrl" and r."nPort" = x."nPort") then
			select "nRTSid" into nRTSid from "RealtimeServers" r where r."cUrl" = x."cUrl" and r."nPort" = x."nPort" limit 1;
		else
			insert into "RealtimeServers"("cUrl","nPort","cName")
			values(x."cUrl",x."nPort",x."cName") returning "nRTSid" into nRTSid;		
		end if;

		update temp_servers t set "nRTSid" = nRTSid where t."nId" = x."nId";
   END LOOP;

   FOR rec IN SELECT * FROM temp_sessions
	LOOP
		select * into x from temp_sessions t where t."nId" = rec."nId";
		select s."nRTSid" into nRTSid from "temp_servers" s where s."nId" = x."nRTSid" limit 1;
		if(x."nSesid" IS NOT NULL) then
			update "RSessionMaster" r set "cName" = x."cName","dStartDt" = x."dStartDt",
			"nLines" = x."nLines","nPageno" = x."nPageno", "nRTSid" = COALESCE(nRTSid, v_zero_uuid),"cStatus" = coalesce(x."cRStatus",'P'),
			"dUpdatedt" = now(),"cProtocol" = x."cProtocol"
			where r."nSesid" = x."nSesid";
			nSesid = x."nSesid";
		else
			select "nCaseid" into nCaseid from "CaseMaster" c where trim(upper(c."cCaseno")) = trim(upper(x."cCaseno")) limit 1;
			if(nCaseid IS NOT NULL) then
			    INSERT INTO "RSessionMaster"("nCaseid", "cName", "dStartDt", "nDays", "nLines", "nPageno", "cUnicuserid","nRTSid","cNotifytype","cTimezone","cStatus","cProtocol")
			    values(nCaseid,x."cName",x."dStartDt",x."nDays",x."nLines",x."nPageno",x."cUnicuserid",COALESCE(nRTSid, v_zero_uuid),'O',x."cTimezone",coalesce(x."cRStatus",'P'),x."cProtocol") returning "nSesid" into nSesid;
				
				insert into "RSessionDetail" ("nSesid","nUserid","cUsertype")
					select nSesid,t."nUserid",'T' 
					From "TeamRelation" t where "nCaseid" = nCaseid;

				update temp_sessions t set "cStatus" = 'C',"nSesid" = nSesid,"nCaseid"=nCaseid where t."nId" = x."nId";
			else
				update temp_sessions t set "cStatus" = 'F',"cMsg" = 'Case no invalid' where t."nId" = x."nId";
			end if;
		end if;
   END LOOP;

jUpdatedSessions = (
	select jsonb_agg(t) 
		from ( 
			select s."nId",s."nSesid",s."nCaseid",s."cStatus",s."cMsg",coalesce(s."cRStatus",'P') as "cRStatus",
			s."dStartDt" as "dDate",((s."dStartDt"::Date)::timestamp + interval '1 day') "dEnddt",
			coalesce(c."cCasename",'') as "cCasename",coalesce(c."cCaseno",'') as "cCaseno",
			coalesce(c."cClaimant",'') as "cClaimant",coalesce(c."cRespondent",'') as "cRespondent",
			coalesce(c."cIndexheader",'') as "cIndexheader",coalesce(c."cDesc",'') as "cDesc",
			coalesce(c."cTClaimant",'') as "cTClaimant",coalesce(c."cTRespondent",'') as "cTRespondent"
			from "temp_sessions" s
			left join "CaseMaster" c on c."nCaseid" = s."nCaseid"
		)t
	);
	
	
jUpdatedSessions = (
	select jsonb_agg(t) 
		from ( 
	
			select s."nSesid" "nId",s."nSesid",s."nCaseid",s."cStatus",'' "cMsg",'C' as "cRStatus",
			s."dStartDt" as "dDate",((s."dStartDt"::Date)::timestamp + interval '1 day') "dEnddt"  ,
			coalesce(c."cCasename",'') as "cCasename",coalesce(c."cCaseno",'') as "cCaseno",
			coalesce(c."cClaimant",'') as "cClaimant",coalesce(c."cRespondent",'') as "cRespondent",
			coalesce(c."cIndexheader",'') as "cIndexheader",coalesce(c."cDesc",'') as "cDesc",
			coalesce(c."cTClaimant",'') as "cTClaimant",coalesce(c."cTRespondent",'') as "cTRespondent"
			from "RSessionMaster"  s
			left join "CaseMaster" c on c."nCaseid" = s."nCaseid"
			where s."nSesid" in (  'b5f2d9f8-f3cb-4297-8d7f-65812b904cb2')
	
		)t
	);

	
open ref for select 1 as msg,coalesce(jUpdatedSessions,'[]'::jsonb) as "jUpdatedSessions";

    RETURN ref;
END;
$function$
