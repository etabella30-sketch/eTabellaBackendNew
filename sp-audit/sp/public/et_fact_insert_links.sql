CREATE OR REPLACE FUNCTION public.et_fact_insert_links(parameter json, ref refcursor)
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
