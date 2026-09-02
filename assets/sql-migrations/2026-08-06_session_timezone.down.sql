-- 2026-08-06_session_timezone.down.sql
-- Restores et_realtime_insertupdate_session to the pre-timezone snapshot
-- (sp-audit/sp/public/et_realtime_insertupdate_session.sql). Existing
-- "cTimezone" values written while the up-migration was live are left in
-- place — the column predates this migration.
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

    IF (permission = 'N') THEN
        nCaseid := (SELECT "nCaseid" FROM "CaseMaster" WHERE "cCaseno" = cCaseno LIMIT 1);
        IF nCaseid IS NOT NULL THEN
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

-- Restore realtime.et_current_active_session to the pre-timezone snapshot
-- (sp-audit/sp/realtime/et_current_active_session.sql).
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
	r."dCreatedt",r."cProtocol",r."nCaseid",r."nRTSid",r."nSesid" ,s."cUrl",s."nPort",r."nSesid" "nLSesid",r."bRefresh",r."isTranscript" "isTrans",r."isTranscript"
	from "RSessionMaster" r
	left join "RealtimeServers" s on s."nRTSid" = r."nRTSid"
	where case when nSesid is not null then r."nSesid" = nSesid else true end
	and "nCaseid" = nCaseid  and r."dDelDt" is null
	 and "cStatus" = 'R' order by "dStartDt" desc limit 1
    ;

    RETURN NEXT ref1;

END;
$function$;
