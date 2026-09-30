-- 2026-07-21: et_realtime_insertupdate_session create branch returned the wrong
-- rows since the uuid migration. "RSessionMaster"."nSesid" is a uuid, so
-- `ORDER BY "nSesid" DESC LIMIT nDays` no longer means "newest rows" — it
-- returns the lexically largest uuids TABLE-WIDE (no WHERE clause), so callers
-- (session/eclipse in realtime-server) marked/registered an unrelated session
-- while the real insert stayed at the column-default status and never went live.
-- Fix: capture the inserted ids with a data-modifying CTE and return exactly
-- those rows. Also returns "nCaseid" (additive, callers may ignore it).

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
    createdIds uuid[];
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
            WITH ins AS (
                INSERT INTO "RSessionMaster"("nCaseid", "cName", "dStartDt", "nDays", "nLines", "nPageno", "cUnicuserid")
                SELECT nCaseid, cName, dStartDt + ((i-1) * interval '1 day'), i, nLines, nPageno, cUnicuserid
                FROM generate_series(1, nDays) AS i
                RETURNING "nSesid"
            )
            SELECT array_agg("nSesid") INTO createdIds FROM ins;
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
                SELECT 1 AS msg, 'Session created successfully' AS value, "nSesid", "nCaseid", "dStartDt", "cUnicuserid"
                FROM "RSessionMaster" WHERE "nSesid" = ANY(createdIds) ORDER BY "dStartDt";
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
$function$
