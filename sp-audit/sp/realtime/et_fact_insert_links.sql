CREATE OR REPLACE FUNCTION realtime.et_fact_insert_links(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFSid uuid; jFactLink jsonb; nFMLid uuid;
rec record;

-- select * from "FMLinks" limit 0
BEGIN
nFSid := NULLIF(parameter->>'nFSid','')::uuid;
jFactLink := parameter->>'jFl';

/*
delete from "FMLinks" where "nFSid" = nFSid;
	insert into "FMLinks" ("nFSid","nBundledetailid","jLinktype")	
	SELECT nFSid,(i->>0)::uuid,(i->>1)::jsonb from jsonb_array_elements(jFactLink) AS i;

select * from "FMLinks"

select * from public.et_fact_insert_links_v2 ('{"nColorid":"9ae97717-1a53-4bcc-a917-6983c817acb5","nFt":227,"nSt":235,"jFl":"[[\"4589083f-65d0-43f7-8160-ce974014986c\",{\"type\":\"F\",\"start\":1,\"end\":20,\"pages\":[]},[],[]]]","jIssues":"[[\"f3de7dc9-4509-4583-a192-73db940bead4\",20,16],[\"9ae97717-1a53-4bcc-a917-6983c817acb5\",22,14]]","jContacts":"[\"ea4a4170-26a0-4db5-9254-2cf15f9fc8d8\",\"d6283100-683d-48e4-bc66-7eb13697f926\"]","jTasks":"[\"1d411002-32b8-4c60-a21f-b57a2ce25e2a\",\"3f64b606-48d1-44df-9b83-61edb5329973\"]","jUsers":"[{\"nUserid\":\"5ad06b74-3acc-4dcd-9c71-1613d2f8331f\",\"bCanEdit\":true,\"bCanCopy\":false,\"bCanReshare\":true,\"bCanComment\":false},{\"nUserid\":\"eb3ec87b-7ece-43fd-919f-a9c7a77de35e\",\"bCanEdit\":true,\"bCanCopy\":true,\"bCanReshare\":false,\"bCanComment\":true}]","cFtype":"F","cFFrom":"RT","nCaseid":"e0cd23d4-12fa-4b80-bdc0-88ec4287957b","nMasterid":"7ee7a723-d96d-4d63-81c1-4dc4a2be4699","nFSid":"757ad37b-150c-4e16-a017-b422765ccfdb"}','r1');fetch all in "r1";

*/
	-- 

	 for rec in select (i->>0)::uuid "nBDid", (i->>1)::jsonb "jLinktype",(i->>2)::jsonb annot,(i->>3)::jsonb "jTexts" FROM jsonb_array_elements(jFactLink) i
	  LOOP
	 	 INSERT INTO "FMLinks" ("nFSid", "nBundledetailid", "jLinktype","jOTexts")    
		 SELECT nFSid, rec."nBDid", rec."jLinktype", coalesce(rec."jTexts",'[]'::jsonb)
		 RETURNING "nFMLid" INTO nFMLid;

	-- select * from "FMLinks"
INSERT INTO "Annotations" (
    "uuid", "type", "rects", "lines", "width", "colorid", "page", "nFMLid", "dCreateDt"
)
SELECT  "uuid", "type", COALESCE("rects", '[]'::jsonb), COALESCE("lines", '[]'::jsonb), "width", "colorid", "page", nFMLid, NOW()
FROM jsonb_to_recordset(rec.annot) AS ( "uuid" text, "type" text, "rects" jsonb, "lines" jsonb, "width" int, "colorid" uuid, "page" int
);
		
	end loop;
	
	open ref for select 1 msg;
    RETURN ref;
END;
$function$
