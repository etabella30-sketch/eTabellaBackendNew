-- 2026-08-06_session_timezone.up.sql
--
-- Sessions created on the live server never recorded the hearing timezone:
-- et_realtime_insertupdate_session ignored cTimezone entirely, so RSessionMaster
-- rows created through the cloud Eclipse/CaseView create path carried NULL and
-- every downstream consumer fell back to the server's system timezone.
-- "RSessionMaster"."cTimezone" (text, nullable) already exists — schema change
-- is NOT needed; this only patches the SP to accept and persist the value.
-- Also persists "cProtocol" ('C' Case view / 'B' Bridge, default 'B') now that
-- the admin create dialog offers the protocol choice; the ingest still
-- auto-detects the wire format, this is bookkeeping for downstream consumers.
--
-- Apply to dev etabella_tech_uuid FIRST. Function body is based on the
-- sp-audit snapshot (sp-audit/sp/public/et_realtime_insertupdate_session.sql);
-- re-dump the live function before applying to prod and reconcile if drifted.
--
-- Safety guard: refuse to run against prod by accident.
DO $guard$
BEGIN
    IF current_database() = 'etabella.com.uuid' THEN
        RAISE EXCEPTION 'Refusing to run on prod database % — apply via the release runbook', current_database();
    END IF;
END
$guard$;

CREATE OR REPLACE FUNCTION public.et_realtime_insertupdate_session(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
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
    cTimezone text;
    cProtocol text;
    insertedIds uuid[];
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
    cTimezone := NULLIF(parameter ->> 'cTimezone','');
    cProtocol := COALESCE(NULLIF(parameter ->> 'cProtocol',''), 'B');
    permission := parameter ->> 'permission';

select "nUserid" into nUserid  From "RTUsers";

    IF (permission = 'N') THEN
        nCaseid := (SELECT "nCaseid" FROM "CaseMaster" WHERE "cCaseno" = cCaseno LIMIT 1);
        IF nCaseid IS NOT NULL THEN
            -- Collect the ids of the rows THIS call inserts. The legacy cursor
            -- re-selected "ORDER BY nSesid DESC LIMIT nDays" — meaningless
            -- with uuid keys, so it returned whichever session in the whole
            -- table sorted highest; the Eclipse create then activated and
            -- routed a stranger's session while the new one stayed 'P'.
            WITH ins AS (
                INSERT INTO "RSessionMaster"("nCaseid", "cName", "dStartDt", "nDays", "nLines", "nPageno", "cUnicuserid", "cTimezone", "cProtocol")
                SELECT nCaseid, cName, dStartDt + ((i-1) * interval '1 day'), i, nLines, nPageno, cUnicuserid, cTimezone, cProtocol
                FROM generate_series(1, nDays) AS i
                RETURNING "nSesid"
            )
            SELECT array_agg("nSesid") INTO insertedIds FROM ins;
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
                SELECT 1 AS msg, 'Session created successfully' AS value, "nSesid", "dStartDt", "cUnicuserid"
                FROM "RSessionMaster" WHERE "nSesid" = ANY(insertedIds) ORDER BY "dStartDt";
        ELSE
            OPEN ref FOR
                SELECT -1 AS msg, 'Invalid case no' AS value;
        END IF;
    ELSIF (permission = 'E') THEN
        nCaseid := (SELECT "nCaseid" FROM "CaseMaster" WHERE "cCaseno" = cCaseno LIMIT 1);
        IF nCaseid IS NOT NULL THEN
            UPDATE "RSessionMaster"
            SET "nCaseid" = nCaseid, "cName" = cName, "nLines" = nLines, "nPageno" = nPageno ,"dStartDt" = dStartDt,
                "cTimezone" = COALESCE(cTimezone, "cTimezone")
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
$function$;

-- The local realtime service loads its active-session detail through this SP
-- (session.service.ts getSessionDetail → currentSessionDetail); without
-- cTimezone in the row the feed parsers cannot stamp hearing-local times.
CREATE OR REPLACE FUNCTION realtime.et_current_active_session(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid UUID;nCaseid uuid;nSesid uuid;
BEGIN

nMasterid := (parameter ->>'nUserid')::UUID;
nCaseid := parameter ->>'nCaseid';
nSesid := parameter ->>'nSesid';

    OPEN ref1 FOR
	select r."cName",r."dStartDt",r."nDays",r."nLines",r."cUnicuserid",r."cStatus",
	r."dCreatedt",r."cProtocol",r."nCaseid",r."nRTSid",r."nSesid" ,s."cUrl",s."nPort",r."nSesid" "nLSesid",r."bRefresh",r."isTranscript" "isTrans",r."isTranscript",
	r."cTimezone"
	from "RSessionMaster" r
	left join "RealtimeServers" s on s."nRTSid" = r."nRTSid"
	where case when nSesid is not null then r."nSesid" = nSesid else true end
	and "nCaseid" = nCaseid  and r."dDelDt" is null
	 and "cStatus" = 'R' order by "dStartDt" desc limit 1
    ;

    RETURN NEXT ref1;

END;
$function$;
