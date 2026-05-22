CREATE OR REPLACE FUNCTION public.et_fact_insert_team(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFSid uuid;jTeams jsonb;jNotify jsonb;nCaseid uuid; nPMid int;

-- select * from "FMShared" limit 0
-- select * from "FactMaster" limit 0
-- select * from "UserMaster" limit 0
/*
select * from et_fact_insert_team ('{...}','r1');fetch all in "r1";
*/
BEGIN
nFSid := NULLIF(parameter->>'nFSid','')::uuid;
jTeams := parameter->>'jUsers';

	delete from "FMShared" where "nFSid" = nFSid;

	insert into "FMShared" ("nFSid","nUserid")	
	SELECT nFSid,jsonb_array_elements_text(jTeams)::uuid AS i;

	nCaseid := (select "nCaseid" from "FactMaster" where "nFSid" = nFSid );

	nPMid := (select "nPMid"  from "PermissionModule" where "cType" = 'NF' );

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
