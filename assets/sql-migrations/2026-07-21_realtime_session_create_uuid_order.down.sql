-- 2026-07-21 down: restore the pre-fix body (uuid ORDER BY bug included) verbatim.
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
$function$

