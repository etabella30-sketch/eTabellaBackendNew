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
$function$
