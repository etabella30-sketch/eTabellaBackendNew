CREATE OR REPLACE FUNCTION realtime.et_doc_insert(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nDocid uuid;
nBundledetailid uuid;
nMasterid uuid;
cDFrom text;

cType text;jLinktype jsonb;jAn jsonb;
jTeams jsonb;
jDocLink jsonb;rec record;nDMLids uuid;jOT jsonb;nCaseid uuid;jNotify jsonb;
nPMid int;
nSesid uuid;
jCordinates jsonb;
jTexts jsonb;
nPage int; nLine int;

BEGIN
nSesid := NULLIF(parameter->>'nSesid','')::uuid;
nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
cType := parameter->>'cType';
jLinktype := parameter->>'jLT';
jAn := parameter->>'jAn';
jTeams:= parameter->>'jUsers';
jDocLink := parameter->>'jDl';
jOT := parameter ->>'jOT';
nCaseid := NULLIF(parameter->>'nCaseid','')::uuid;
cDFrom := parameter->>'cDFrom';
jTexts := parameter->>'jT';
jCordinates := parameter->>'jCordinates';
nPage := parameter->>'nPage';
nLine := parameter->>'nLine';

	-- select * from "DMLinks"

/*

select * from public.et_doc_insert ('{"nBDid":"51c4f72f-a203-46ec-b0a5-d9bd386d10c1","jLT":"{\"type\":\"H\",\"start\":1,\"end\":26,\"pages\":[3]}","jAn":"[{\"isTemp\":true,\"id\":null,\"linktype\":\"F\",\"type\":\"strikeout1\",\"color\":\"#0066FF\",\"uuid\":\"6fc27cdc-1807-4fe4-9ab4-1ea041910a02\",\"page\":3,\"rects\":[{\"x\":174.22247314453125,\"y\":188.58984375,\"width\":57.537689208984375,\"height\":12}]}]","jDl":"[[\"a6fb9b76-a97d-420b-936d-f303fd60fe48\",{\"type\":\"F\",\"start\":1,\"end\":9,\"pages\":[]},[],[]]]","jOT":"[\"Abu Dhabi \"]","jUsers":"[\"4337e269-a052-4e83-9a09-8d889e9c97df\"]","cType":"S","nMasterid":"c67fea37-4c67-4ea4-89eb-f9d0441142a0"}','r1');fetch all in "r1";

*/

-- nCaseid := (select s."nCaseid" from "SectionMaster" s join "BundleDetail" d on d."nSectionid" = s."nSectionid" where d."nBundledetailid" = nBundledetailid limit 1);

nPMid := (select "nPMid"  from "PermissionModule" where "cType" = 'NF' );

	insert into "DocMaster" ("nSesid","nUserid","dCreateDt","nCaseid", "cDFrom","nBundledetailid")
	values(nSesid,nMasterid,now(),nCaseid, cDFrom,nBundledetailid)
	RETURNING "nDocid" INTO nDocid;
	
	insert into "DocDetail" ("nDocid","cType","jLinktype","jOText", "jCordinates", "jTexts",  "nPage","nLine" )
	values(nDocid,cType,jLinktype,jOT, jCordinates,jTexts, nPage, nLine);
	if(cDFrom ='I') then
		insert into "Annotations"("uuid","type","rects","lines","width","page","nDocid","dCreateDt")
		select "uuid","type",coalesce("rects",'[]'::jsonb),coalesce("lines",'[]'::jsonb),"width","page",nDocid,now() 
			from jsonb_to_recordset(jAn) as ("uuid" text,"type" text,"rects" jsonb,"lines" jsonb,width int,"colorid" uuid,"page" int);
	end if;
	
        -- Example conditional update
     for rec in select NULLIF(i->>0,'')::uuid "nBDid", (i->>1)::jsonb "jLinktype",(i->>2)::jsonb annot,(i->>3)::jsonb "jTexts"   FROM jsonb_array_elements(jDocLink) i
	  LOOP
	 	 INSERT INTO "DMLinks" ("nDocid", "nBundledetailid", "jLinktype","jOTexts")    
		 SELECT nDocid, rec."nBDid", rec."jLinktype",coalesce(rec."jTexts",'[]'::jsonb)
		 RETURNING "nDMLids" INTO nDMLids;
	
	-- select * from "Annotations"
	-- INSERT INTO "Annotations" (
	--     "uuid", "type", "rects", "lines", "width","colorid", "page", "nDMLinkid", "dCreateDt"
	-- )
	-- SELECT  "uuid", "type", COALESCE("rects", '[]'::jsonb), COALESCE("lines", '[]'::jsonb), "width","colorid", "page", nDMLids, NOW()
	-- FROM jsonb_to_recordset(rec.annot) AS ( "uuid" text, "type" text, "rects" jsonb, "lines" jsonb, "width" int, "colorid" uuid, "page" int
	-- );
		
	end loop;
	
	insert into "DMShared" (
	"nDocid",
	"nUserid",
	"bCanEdit",
	"bCanCopy",
    "bCanReshare",
    "bCanComment"
	)	
	SELECT
	nDocid,
	(team->>'nUserid')::uuid,
	(team->>'bCanEdit')::boolean,
	(team->>'bCanCopy')::boolean,
	(team->>'bCanReshare')::boolean,
	(team->>'bCanComment')::boolean
	FROM jsonb_array_elements(jTeams) AS team;

	with tbl as (select u."nUserid",'Doc shared' as "cTitle",
		cr."cFname" || ' ' || cr."cLname"  || ' has shared doclink with you' as "cMsg",
		s."nDocid",u."cToken",'DS' as "cType",nCaseid as "nCaseid"
		from "UserMaster" u
		join "DMShared" s on s."nUserid" = u."nUserid"
		join "DocMaster" fm on fm."nDocid" = s."nDocid"
		join "UserMaster" cr on cr."nUserid" = fm."nUserid"
		left join "UserPermission" up on up."nUserid" = u."nUserid"  and  up."nCaseid" = nCaseid and up."nPMid" = nPMid
		where s."nDocid" = nDocid -- and nullif(u."cToken",'') is not null
		and coalesce(up."nUPid",'00000000-0000-0000-0000-000000000000'::uuid) = '00000000-0000-0000-0000-000000000000'::uuid 

		)	select jsonb_agg(t) into jNotify from tbl t;

	open ref for select 1 msg,nDocid "nDocid",coalesce(jNotify,'[]'::jsonb) as "jNotify";
    RETURN ref;
END;
$function$
