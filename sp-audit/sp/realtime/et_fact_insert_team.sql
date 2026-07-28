CREATE OR REPLACE FUNCTION realtime.et_fact_insert_team(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFSid uuid;jTeams jsonb;jNotify jsonb;nCaseid uuid; nPMid int;
cMsg text;
cTitle text;

nUserid uuid;
jNewUsers jsonb;
bIsUserUpdated boolean;

BEGIN
nFSid := NULLIF(parameter->>'nFSid','')::uuid;
jTeams := parameter->>'jUsers';
nUserid := coalesce((parameter ->>'nUserid'),(parameter ->>'nMasterid'));
bIsUserUpdated := coalesce((parameter->>'bIsUserUpdated'),'false')::boolean;

	nCaseid := (select "nCaseid" from "FactMaster" where "nFSid" = nFSid );
	nPMid := (select "nPMid"  from "PermissionModule" where "cType" = 'NF' );

	cTitle = 'Fact shared';
	cMsg = (select cr."cFname" || ' ' || cr."cLname"  || ' has shared fact with you' from "FactMaster" f join "UserMaster" cr on cr."nUserid" = f."nUserid" where f."nFSid" = nFSid limit 1);

	-- Full replacement: jUsers is the COMPLETE share list the editor saved
	-- (the share editor surfaces every FMShared row for the fact, whoever
	-- created it), so any member missing from it is an intended removal.
	-- The old "nShareBy" = nUserid scoping made NULL-sharer / other-sharer
	-- rows undeletable — the reported "removed member still shared" bug.
	DELETE FROM "FMShared" f
	WHERE f."nFSid" = nFSid
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
	  "bCanComment" = EXCLUDED."bCanComment",
	  "nShareBy"    = EXCLUDED."nShareBy";

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
$function$

