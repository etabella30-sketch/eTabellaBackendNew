CREATE OR REPLACE FUNCTION public.et_fact_update(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
	
DECLARE nFSid uuid;jDate jsonb;jC jsonb;jIssue jsonb;jL jsonb;jT jsonb;jTexts jsonb;jU jsonb;
nFiletype int;nStatus int;nTZid int;nColorid uuid;nFMLid uuid;rec record;Color text;
bIsHighlighted boolean; nMasterid uuid; jNotify jsonb; nCaseid uuid; nPMid int;

BEGIN
nFSid := NULLIF(parameter ->>'nFSid','')::uuid;
jDate := parameter ->>'jDate';
jC := parameter ->>'jC';
jIssue := parameter ->>'jIssue';
jL := parameter ->>'jL';
jT := parameter ->>'jT';
jTexts := parameter ->>'jTexts';
jU := parameter ->>'jU';
nFiletype := parameter ->>'nFiletype';
nStatus := parameter ->>'nStatus';
nTZid := parameter ->>'nTZid';
nColorid := NULLIF(parameter ->>'nColorid','')::uuid;
bIsHighlighted := parameter->>'bIsHighlighted';
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
/*

select * from public.et_fact_update ('{"nFSid":"40b40496-fff6-458f-84a4-97eec5fbba76","nTZid":98,"nFiletype":0,"nStatus":0,"jDate":"{\"type\":207,\"date1\":\"2024-12-26 04:31 PM\",\"date2\":\"\"}","jIssue":"[[\"7287a248-6e81-42af-867e-dcb1d48423c2\",0,0],[\"0d91c10a-c1c1-4ca9-ae8c-8b62a228cd19\",0,0],[\"c0d4e4ef-2bf9-4b02-8d4a-e77d387785ff\",0,0]]","jC":"[]","jT":"[]","jU":"[]","jTexts":"[\"where I indicate to the contrary, the facts and matters contained in this statement are within\\nmy own knowledge and belief. Where the facts are not within my own knowledge, I have identified\\nmy sources of information\"]","jL":"[]","nColorid":"c0d4e4ef-2bf9-4b02-8d4a-e77d387785ff","bIsHighlighted":false,"nMasterid":"3a168b69-1bb8-4c7e-881f-dff78a854f80"}','r1');fetch all in "r1";

*/

-- Get case ID
SELECT "nCaseid" INTO nCaseid FROM "FactMaster" WHERE "nFSid" = nFSid;

nPMid := (select "nPMid"  from "PermissionModule" where "cType" = 'NF' );

update "FactDetail" set "jDate" = jDate,"nFiletype"=nFiletype,"nStatus"=nStatus,
"nTZid"=nTZid,"nColorid"=nColorid ,"jTexts" = jTexts, "bIsHighlighted" = bIsHighlighted
where "nFSid" = nFSid;

-- delete from "FMShared" where "nFSid" = nFSid;
-- insert into "FMShared"("nFSid","nUserid")
-- SELECT nFSid,t::uuid from jsonb_array_elements_text(jU) AS t;

-- Update sharing with notifications
WITH inserted_users AS (
    INSERT INTO "FMShared"("nFSid", "nUserid")
    SELECT nFSid, i.value::uuid
    FROM jsonb_array_elements_text(jU) AS i(value)
    WHERE NOT EXISTS (
        SELECT 1 FROM "FMShared" 
        WHERE "nFSid" = nFSid AND "nUserid" = i.value::uuid
    )
    RETURNING "nUserid"
),
deleted AS (
    DELETE FROM "FMShared" 
    WHERE "nFSid" = nFSid
    AND "nUserid" NOT IN (
        SELECT value::uuid FROM jsonb_array_elements_text(jU) AS i(value)
    )
),
notification_data AS (
    SELECT 
        u."nUserid",
        'Fact shared' as "cTitle",
        cr."cFname" || ' ' || cr."cLname" || ' has shared fact with you' as "cMsg",
        nFSid as "nFSid",
        u."cToken",
        'FS' as "cType",
        nCaseid as "nCaseid"
    FROM "UserMaster" u
    JOIN inserted_users ins ON ins."nUserid" = u."nUserid"
    JOIN "UserMaster" cr ON cr."nUserid" = nMasterid
	left join "UserPermission" up on up."nUserid" = u."nUserid"  and  up."nCaseid" = nCaseid and up."nPMid" = nPMid
	where
	 coalesce(up."nUPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid 
)
SELECT COALESCE(jsonb_agg(t), '[]') INTO jNotify FROM notification_data t;

update "Annotations" set "colorid" = coalesce(nColorid,"colorid") where "nFSid" = nFSid;

--select * from "FMIssue" where "nFSid" = 27

delete from "FMIssue" where "nFSid" = nFSid;
insert into "FMIssue"("nFSid","nIssueid","nImpactid","nRelevanceid")
SELECT nFSid,(t->>0)::uuid,(t->1)::int,(t->2)::int from jsonb_array_elements(jIssue) AS t;

delete from "FMTasks" where "nFSid" = nFSid;
insert into "FMTasks"("nFSid","nTaskid")
SELECT nFSid,t::uuid from jsonb_array_elements_text(jT) AS t;

delete from "FMContact" where "nFSid" = nFSid;
insert into "FMContact"("nFSid","nContactid")
SELECT nFSid,t::uuid from jsonb_array_elements_text(jC) AS t;

--select * from "FMContact"

drop table if exists temp_links;
create temp table temp_links as 
 select (t->>0)::uuid as "nFMLid",(t->>1)::uuid "nBundledetailid", (t->2) "jLinktype",coalesce((t->3),'[]'::jsonb) "highlights",coalesce((t->4),'[]'::jsonb) "jOTexts"
from jsonb_array_elements(jL) AS t;

WITH deleted_rows AS (
delete from "FMLinks" f where "nFSid" = nFSid and 
not exists (select * from temp_links t where t."nFMLid" = f."nFMLid" --t."nBundledetailid" = f."nBundledetailid"
	)
  RETURNING "nFMLid"
)
DELETE FROM "Annotations"
WHERE "nFMLid" IN (SELECT "nFMLid" FROM deleted_rows);

for rec in select *
FROM temp_links t where "nFMLid" IS NULL
LOOP
	 	 INSERT INTO "FMLinks" ("nFSid", "nBundledetailid", "jLinktype","jOTexts")    
		 SELECT nFSid, rec."nBundledetailid", rec."jLinktype",rec."jOTexts"
		 returning "nFMLid" into nFMLid;

	-- select * from "FMLinks"
INSERT INTO "Annotations" (
    "uuid", "type", "rects", "lines", "width","colorid", "page", "nFMLid", "dCreateDt"
)
SELECT  "uuid", "type", COALESCE("rects", '[]'::jsonb), COALESCE("lines", '[]'::jsonb), "width","colorid", "page", nFMLid, NOW()
FROM jsonb_to_recordset(rec.highlights) AS ( "uuid" text, "type" text, "rects" jsonb, "lines" jsonb, "width" int, "colorid" uuid, "page" int
);
end loop;

	
	select "cColor" into Color from "RIssueMaster" where "nIid" = nColorid;

	open ref for select 1 msg,'Updated' as value,nFSid as "nFSid",Color, jNotify "jNotify";
    RETURN ref;
END;
$function$
