CREATE OR REPLACE FUNCTION realtime.et_factsheet_submit(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nFSid UUID;nMasterid uuid;
nSesid uuid;nColorid uuid;
nFt int;nSt int;
jFl jsonb;jIssues jsonb;jContacts jsonb;jTasks jsonb;jUsers jsonb;jDate jsonb;jT jsonb;

BEGIN

nFSid := (parameter ->>'nFSid')::UUID;
nMasterid := (parameter->>'nMasterid')::uuid;

nSesid := (parameter ->>'nSesid')::UUID;
nColorid := (parameter ->>'nColorid')::UUID;

nFt := parameter ->>'nFt';
nSt := parameter ->>'nSt';

jFl := parameter ->>'jFl';
jIssues := parameter ->>'jIssues';
jContacts := parameter ->>'jContacts';
jTasks := parameter ->>'jTasks';
jUsers := parameter ->>'jUsers';
jDate := parameter ->>'jDate';
jT := parameter ->>'jT';

/*
select * from realtime.et_factsheet_submit ('{"nFSid":"b70b6782-0e93-438b-9421-19b3331d3e88","nSesid":"79d6fa26-7d27-49a3-8204-1e128505b682","nColorid":"fa9402d3-1132-4d90-a449-c8aec21a52ad","nFt":230,"nSt":235,"jFl":"[{\"b\":\"4f8b09a1-bb84-4bc6-8820-67ec61153e29\",\"Linktype\":{\"end\":35,\"type\":\"P\",\"pages\":[],\"start\":3}},{\"b\":\"93e55e26-d690-4354-9703-82a6b664f472\",\"Linktype\":{\"end\":164,\"type\":\"P\",\"pages\":[],\"start\":2}}]","jIssues":"[{\"nIid\":\"8394121e-a3c6-41c5-9ed2-da690433e9cc\",\"nImpactid\":22,\"nRelid\":15},{\"nIid\":\"d27c56d7-e723-4d48-bce3-332968ada019\",\"nImpactid\":0,\"nRelid\":0},{\"nIid\":\"fa9402d3-1132-4d90-a449-c8aec21a52ad\",\"nImpactid\":21,\"nRelid\":14}]","jContacts":"[{\"c\":\"81520e33-18f3-40b8-8a92-1ce0d6024814\"}]","jTasks":"[{\"t\":\"588c9ec2-0874-41e7-9994-2b5741843d24\"},{\"t\":\"cb804998-3dd6-4732-93d8-b8c9088b02ce\"}]","jUsers":"[{\"nUserid\":\"7ee7a723-d96d-4d63-81c1-4dc4a2be4699\",\"bCanEdit\":null,\"bCanCopy\":null,\"bCanReshare\":true,\"bCanComment\":true}]","jDate":"{\"type\":\"D\",\"cValue\":\"Between\",\"nValue\":245,\"record\":[{\"date\":\"2025-08-11T00:00:00.000Z\"},{\"date\":\"2025-08-27T00:00:00.000Z\"}]}","jT":"[\" provision.  But then it would have been \\n    incouple.  on KFH to sir you were provided -- you''re\\n    obliged to provide these financial statements, where are\\n    they?  There''s no evidence to suggest that --\\nMR EGGERS:  Is it in dispute whether these additional\\n    statements were provided or not?\\nMR IKRAM:  No.  Our understanding is it''s not in dispute\\n    that the only financial statements that were produced --\\nMR EGGERS:  January, May 2008.\"]","nMasterid":"fc2b2057-ac44-41c7-9058-64e8617ed3e5"}','r1');fetch all in "r1";

 select * From "FactDetail"
 select * From "FactMaster"
*/

	update "FactDetail" set "jDate" = jDate,"nFiletype" = nFt,"nStatus" = nSt,"nColorid" = nColorid,"jTexts" = jT where "nFSid" = nFSid;

-- jFl  select * from "FMLinks" where "nFSid" = 'b70b6782-0e93-438b-9421-19b3331d3e88'
	with tbl as (
		select * from jsonb_to_recordset(jFl) as ("b" uuid,"Linktype" jsonb)
	),del_op as (
		delete from "FMLinks" l 
		where l."nFSid" = nFSid 
			and not exists (
			select * from tbl t where t."b" = l."nBundledetailid"
			)
		returning "nFMLid"
	) insert into "FMLinks" ("jLinktype","nBundledetailid","nFSid")
		select t."Linktype",t."b",nFSid 
		from tbl t 
		where not exists (
			select * from "FMLinks" f where f."nFSid" = nFSid and f."nBundledetailid" = t."b" 
		);

-- jIssues select * from "FMIssue" where "nFSid" = 'b70b6782-0e93-438b-9421-19b3331d3e88'

	with tbl as (
		select * from jsonb_to_recordset(jIssues) as ("nIid" uuid,"nImpactid" int,"nRelid" int)
	),update_op as (
		update "FMIssue" f set "nRelevanceid" = t."nRelid","nImpactid" = t."nImpactid" 
		from tbl t where f."nFSid" = nFSid and t."nIid" = f."nIssueid"
		returning "nFMIid"
	),delete_op as (
		delete from "FMIssue" f where f."nFSid" = nFSid and  not exists (select * from tbl t where t."nIid" = f."nIssueid")
		returning "nFMIid"
	) insert into "FMIssue" ("nImpactid","nRelevanceid","nFSid","nIssueid")
		select t."nImpactid",t."nRelid",nFSid,t."nIid" from tbl t where not exists (select * from "FMIssue" f where f."nFSid" = nFSid and f."nIssueid" = t."nIid");

-- jContacts select * from "FMContact" where "nFSid" = 'b70b6782-0e93-438b-9421-19b3331d3e88'

	with tbl as (
		select * from jsonb_to_recordset(jContacts) as ("c" uuid)
	),delete_op as (
		delete from "FMContact" f where f."nFSid" = nFSid and not exists (select * from tbl t where t."c" = f."nContactid")
		returning "nFMCid"
	) insert into "FMContact" ("nContactid","nFSid")
		select t."c",nFSid from tbl t where not exists (select * from "FMContact" f where f."nFSid" = nFSid and f."nContactid" = t."c" );
		
-- jTasks  select * from "FMTasks" where "nFSid" = 'b70b6782-0e93-438b-9421-19b3331d3e88'

	with tbl as (
		select * from jsonb_to_recordset(jTasks) as ("t" uuid)
	),delete_op as (
		delete from "FMTasks" f where f."nFSid" = nFSid and not exists (select * from tbl t where t."t" = f."nTaskid")
		returning "nFMTsid"
	) insert into "FMTasks" ("nTaskid","nFSid")
		select t."t",nFSid from tbl t where not exists (select * from "FMTasks" f where f."nFSid" = nFSid and f."nTaskid" = t."t" );

-- jUsers  select * from "FMShared" where "nFSid" = 'b70b6782-0e93-438b-9421-19b3331d3e88'

	/*with tbl as (
		select * from jsonb_to_recordset(jUsers) as ("nUserid" uuid,"bCanEdit" boolean,"bCanCopy" boolean,"bCanReshare" boolean,"bCanComment" boolean)
	),update_op as (
		update "FMShared" f set "bCanEdit" = t."bCanEdit","bCanCopy" = t."bCanCopy" ,"bCanReshare" = t."bCanReshare" ,"bCanComment" = t."bCanComment" 
		from tbl t where f."nFSid" = nFSid and t."nUserid" = f."nUserid"
		returning "nFMSdid"
	),delete_op as (
		delete from "FMShared" f where f."nFSid" = nFSid and not exists (select * from tbl t where t."nUserid" = f."nUserid")
		returning "nFMSdid"
	) insert into "FMShared" ("nUserid","nFSid","bCanEdit","bCanCopy","bCanReshare","bCanComment")
		select t."nUserid",nFSid,t."bCanEdit",t."bCanCopy",t."bCanReshare",t."bCanComment" 
		from tbl t where not exists (select * from "FMShared" f where f."nFSid" = nFSid and f."nUserid" = t."nUserid" );*/

		
		

	update "FactMaster" set "dUpdateDt" = now() where "nFSid" = nFSid;

    OPEN ref1 FOR
	select 1 as msg,'FactSheet Update' as value;
    RETURN NEXT ref1;
    
    
END;
$function$
