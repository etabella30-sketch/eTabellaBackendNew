CREATE OR REPLACE FUNCTION realtime.et_fact_insert_team_old(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFSid uuid;jTeams jsonb;jNotify jsonb;nCaseid uuid; nPMid int;

cMsg text;
cTitle text;

-- select * from "FMShared" limit 0
-- select * from "FactMaster" limit 0
-- select * from "UserMaster" limit 0
/*
select * from realtime.et_fact_insert_team ('{"nColorid":"ff093734-8dc6-4bb0-9ea6-a15f1f1b7efd","nFt":0,"nSt":0,"jT":"[]","jOT":"[\"imant”) hereby submits this reply to Respondent’s counterclaims (the “Reply\\nto Counterclaims”) to the Secretariat of the International Chamber of Commerce (the “ICC”), in\\naccordance with Article 5.6 of the ICC Rules \"]","jFl":"[]","jIssues":"[[\"ff093734-8dc6-4bb0-9ea6-a15f1f1b7efd\",0,0]]","jContacts":"[]","jTasks":"[]","jUsers":"[{\"nUserid\":\"7ee7a723-d96d-4d63-81c1-4dc4a2be4699\",\"bCanEdit\":true,\"bCanCopy\":true,\"bCanReshare\":true,\"bCanComment\":true},{\"nUserid\":\"70ad86c0-e204-44a6-9aea-415291721a9b\",\"bCanEdit\":true,\"bCanCopy\":true,\"bCanReshare\":true,\"bCanComment\":true},{\"nUserid\":\"b9ca9bc3-e855-4ce4-8457-ff54a5552e8a\",\"bCanEdit\":true,\"bCanCopy\":true,\"bCanReshare\":true,\"bCanComment\":true},{\"nUserid\":\"fc2b2057-ac44-41c7-9058-64e8617ed3e5\",\"bCanEdit\":true,\"bCanCopy\":true,\"bCanReshare\":true,\"bCanComment\":true}]","cFtype":"F","cFFrom":"I","nPage":3,"nLine":0,"nCaseid":"bc669a9e-6388-42af-9a94-f438e907ea30","jDate":"{\"type\":\"D\",\"nValue\":241,\"cValue\":\"On\",\"record\":[{\"date\":\"2025-09-16\"}]}","nBDid":"5381572f-0e29-437d-9e48-395ce160a74b","jAn":"[{\"uuid\":\"a0abd7c2-44c5-401b-bdf9-6b44df9575c4\",\"type\":\"highlight\",\"page\":3,\"rects\":[{\"x\":195.47698974609375,\"y\":64.20703125,\"width\":25.25811767578125,\"height\":12},{\"x\":220.76953125,\"y\":64.95703125,\"width\":3.6796875,\"height\":11.0390625},{\"x\":220.76953125,\"y\":64.20703125,\"width\":3.6796875,\"height\":12},{\"x\":225.52734375,\"y\":64.95703125,\"width\":187.09771728515625,\"height\":11.0390625},{\"x\":225.52734375,\"y\":64.20703125,\"width\":187.09771728515625,\"height\":12},{\"x\":412.3359375,\"y\":64.95703125,\"width\":7.083892822265625,\"height\":11.0390625},{\"x\":412.3359375,\"y\":64.20703125,\"width\":7.083892822265625,\"height\":12},{\"x\":419.4140625,\"y\":64.95703125,\"width\":3.0703125,\"height\":11.0390625},{\"x\":419.4140625,\"y\":64.20703125,\"width\":3.0703125,\"height\":12},{\"x\":421.96875,\"y\":64.95703125,\"width\":63.10968017578125,\"height\":11.0390625},{\"x\":421.96875,\"y\":64.20703125,\"width\":63.10968017578125,\"height\":12},{\"x\":485.015625,\"y\":64.95703125,\"width\":3.0703125,\"height\":11.0390625},{\"x\":485.015625,\"y\":64.20703125,\"width\":3.0703125,\"height\":12},{\"x\":487.453125,\"y\":64.95703125,\"width\":25.33905029296875,\"height\":11.0390625},{\"x\":487.453125,\"y\":64.20703125,\"width\":25.33905029296875,\"height\":12},{\"x\":512.73046875,\"y\":64.95703125,\"width\":25.631378173828125,\"height\":11.0390625},{\"x\":512.73046875,\"y\":64.20703125,\"width\":25.631378173828125,\"height\":12},{\"x\":92.6015625,\"y\":81.8671875,\"width\":79.35031127929688,\"height\":11.0390625},{\"x\":92.6015625,\"y\":81.1171875,\"width\":79.35031127929688,\"height\":12},{\"x\":171.8203125,\"y\":81.8671875,\"width\":8.03228759765625,\"height\":11.0390625},{\"x\":171.8203125,\"y\":81.1171875,\"width\":8.03228759765625,\"height\":12},{\"x\":179.84765625,\"y\":81.8671875,\"width\":3.0703125,\"height\":11.0390625},{\"x\":179.84765625,\"y\":81.1171875,\"width\":3.0703125,\"height\":12},{\"x\":183.83203125,\"y\":81.8671875,\"width\":308.0859375,\"height\":11.0390625},{\"x\":183.83203125,\"y\":81.1171875,\"width\":308.0859375,\"height\":12},{\"x\":491.61328125,\"y\":81.8671875,\"width\":3.0703125,\"height\":11.0390625},{\"x\":491.61328125,\"y\":81.1171875,\"width\":3.0703125,\"height\":12},{\"x\":495.83203125,\"y\":81.8671875,\"width\":3.6796875,\"height\":11.0390625},{\"x\":495.83203125,\"y\":81.1171875,\"width\":3.6796875,\"height\":12},{\"x\":500.47265625,\"y\":81.8671875,\"width\":14.60009765625,\"height\":11.0390625},{\"x\":500.47265625,\"y\":81.1171875,\"width\":14.60009765625,\"height\":12},{\"x\":515.109375,\"y\":81.8671875,\"width\":3.6796875,\"height\":11.0390625},{\"x\":515.109375,\"y\":81.1171875,\"width\":3.6796875,\"height\":12},{\"x\":519.92578125,\"y\":81.8671875,\"width\":18.41015625,\"height\":11.0390625},{\"x\":519.92578125,\"y\":81.1171875,\"width\":18.41015625,\"height\":12},{\"x\":92.6015625,\"y\":97.95703125,\"width\":199.14523315429688,\"height\":12}]}]","cType":"S","jLinktype":"{}","nMasterid":"ba561c55-81f5-4180-8934-2ce6dcaa096c","nFSid":"0fe2abf0-55b8-4b53-b791-5e561e5cc8a5"}','r1');fetch all in "r1";

*/
BEGIN
nFSid := NULLIF(parameter->>'nFSid','')::uuid;
jTeams := parameter->>'jUsers';

	delete from "FMShared" where "nFSid" = nFSid;

	-- insert into "FMShared" ("nFSid","nUserid")	
	-- SELECT nFSid,jsonb_array_elements_text(jTeams)::uuid AS i;
	INSERT INTO "FMShared" ("nFSid","nUserid","bCanEdit","bCanReshare","bCanComment")
	SELECT  nFSid,(team->>'nUserid')::uuid,(team->>'bCanEdit')::boolean,(team->>'bCanReshare')::boolean,(team->>'bCanComment')::boolean
	FROM jsonb_array_elements(jTeams) AS team;

	
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
		
	--	select * from realtime.et_fact_insert_team ('{"nColorid":"d27c56d7-e723-4d48-bce3-332968ada019","nFt":0,"nSt":0,"jT":"[\"cies haven''t been disclosed, whether they \\n    would have been in accordance with their practice is,\\n    but the fact that they haven''t asked for them and they\\n    haven''t referred to financial statements in the November 2018\\n    yes di memo, shows that falsified --\\n    the financial statements were not a factor in their\\n    extending the amendment letter.\\nPRESIDENT:  Just before on this, but on this point.  At\\n    least I could be mis\"]","jOT":"[\"cies haven''t been disclosed, whether they \",\"    would have been in accordance with their practice is,\",\"    but the fact that they haven''t asked for them and they\",\"    haven''t referred to financial statements in the November 2018\",\"    yes di memo, shows that falsified --\",\"    the financial statements were not a factor in their\",\"    extending the amendment letter.\",\"PRESIDENT:  Just before on this, but on this point.  At\",\"    least I could be mis\"]","jFl":"[]","jIssues":"[[\"8394121e-a3c6-41c5-9ed2-da690433e9cc\",0,0],[\"d27c56d7-e723-4d48-bce3-332968ada019\",0,0]]","jContacts":"[]","jTasks":"[]","jUsers":"[{\"nUserid\":\"7ee7a723-d96d-4d63-81c1-4dc4a2be4699\"},{\"nUserid\":\"ba561c55-81f5-4180-8934-2ce6dcaa096c\",\"bCanEdit\":true,\"bCanCopy\":false,\"bCanReshare\":false,\"bCanComment\":false},{\"nUserid\":\"b9ca9bc3-e855-4ce4-8457-ff54a5552e8a\",\"bCanEdit\":true,\"bCanCopy\":false,\"bCanReshare\":true,\"bCanComment\":false},{\"nUserid\":\"d246f683-b36d-44d8-9f11-d94271c05508\",\"bCanEdit\":true,\"bCanCopy\":false,\"bCanReshare\":true,\"bCanComment\":true}]","cFtype":"F","cFFrom":"RT","nPage":250,"nLine":13,"nCaseid":"bc669a9e-6388-42af-9a94-f438e907ea30","jDate":"{\"type\":\"D\",\"nValue\":241,\"cValue\":\"On\",\"record\":[{\"date\":\"2025-09-01T05:49:28.878Z\"}]}","nSesid":"79d6fa26-7d27-49a3-8204-1e128505b682","jCordinates":"[{\"text\":\"cies haven''''t been disclosed, whether they \",\"t\":\"17:58:15:14\",\"l\":13,\"p\":250,\"oP\":250,\"oL\":10,\"identity\":\"358527507241300\"},{\"text\":\"    would have been in accordance with their practice is,\",\"t\":\"17:58:19:15\",\"l\":14,\"p\":250,\"oP\":250,\"oL\":11,\"identity\":\"358539670847600\"},{\"text\":\"    but the fact that they haven''''t asked for them and they\",\"t\":\"17:58:22:29\",\"l\":15,\"p\":250,\"oP\":250,\"oL\":12,\"identity\":\"358539838279100\"},{\"text\":\"    haven''''t referred to financial statements in the November 2018\",\"t\":\"17:58:26:12\",\"l\":16,\"p\":250,\"oP\":250,\"oL\":13,\"identity\":\"358549888751000\"},{\"text\":\"    yes di memo, shows that falsified --\",\"t\":\"17:58:31:28\",\"l\":17,\"p\":250,\"oP\":250,\"oL\":14,\"identity\":\"358565519923800\"},{\"text\":\"    the financial statements were not a factor in their\",\"t\":\"17:58:37:24\",\"l\":18,\"p\":250,\"oP\":250,\"oL\":15,\"identity\":\"358566119992200\"},{\"text\":\"    extending the amendment letter.\",\"t\":\"17:58:40:27\",\"l\":19,\"p\":250,\"oP\":250,\"oL\":16,\"identity\":\"358566377550400\"},{\"text\":\"PRESIDENT:  Just before on this, but on this point.  At\",\"t\":\"17:58:42:23\",\"l\":20,\"p\":250,\"oP\":250,\"oL\":17,\"identity\":\"358579438065000\"},{\"text\":\"    least I could be mis\",\"t\":\"17:58:47:06\",\"l\":21,\"p\":250,\"oP\":250,\"oL\":18,\"identity\":\"358579747935600\"}]","nMasterid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5","nFSid":"3260f24f-99ff-4103-9f46-a7e7babb344d"}','r1');fetch all in "r1";
		

cTitle = 'Fact shared';
cMsg = (select cr."cFname" || ' ' || cr."cLname"  || ' has shared fact with you' from "FactMaster" f join "UserMaster" cr on cr."nUserid" = f."nUserid" where f."nFSid" = nFSid limit 1);

nCaseid := (select "nCaseid" from "FactMaster" where "nFSid" = nFSid );

nPMid := (select "nPMid"  from "PermissionModule" where "cType" = 'NF' );
	/*
with tbl as (
SELECT 
	    (team->>'nUserid')::uuid as "nUserid",
	    (team->>'bCanEdit')::boolean as "bCanEdit",
	    (team->>'bCanCopy')::boolean as "bCanCopy",
	    (team->>'bCanReshare')::boolean as "bCanReshare",
	    (team->>'bCanComment')::boolean as "bCanComment"
	FROM jsonb_array_elements(jTeams) AS team
),shared as ( 
select u."nUserid",
		cTitle as "cTitle",
		cMsg as "cMsg",
		 nFSid as "nFSid",
		 u."cToken",
		 'FS' as "cType",
		 nCaseid as "nCaseid",
		 t.*
	From "UserMaster" u 
	join tbl t on t."nUserid" = u."nUserid"	)
	
	select jsonb_agg(distinct s) into jNotify from shared s;*/
		

	open ref for select 1 msg,coalesce(jNotify,'[]'::jsonb) as "jNotify";
    RETURN ref;
END;
$function$
