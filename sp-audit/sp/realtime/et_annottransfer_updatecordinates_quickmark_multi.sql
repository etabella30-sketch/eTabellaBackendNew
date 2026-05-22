CREATE OR REPLACE FUNCTION realtime.et_annottransfer_updatecordinates_quickmark_multi(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare jList jsonb;

BEGIN

jList := (parameter->>'jList')::jsonb;

drop table if exists temp_data_mark;
	create temp table temp_data_mark as
	select *
	From jsonb_to_recordset(jList) as 
	("cPageno" text,"cLineno" text,"cTime" text,"nHid" uuid,"cNote" text,"identity" text,"nRefresh" int,
	"cOLDPageno" text,"cOLDLineno" text, "cOLDTime" text, "cOLDNote" text, "oldidentity" text, "jCordinates" jsonb,"jOCordinates" jsonb)
;

-- select * from "RHighlights" limit 10

	update "RHighlights" r set "cOPageno" = t."cOLDPageno","cOLineno" = t."cOLDLineno"
	from temp_data_mark t where t."nHid" = r."nHid" and r."cOPageno" is null;

	insert into realtime."RHighlightsLog" ("nHid","cPageno","cLineno","nRefresh","cTime","cNote","identity","jCordinates")
	select "nHid","cOLDPageno","cOLDLineno","nRefresh","cOLDTime","cOLDNote","oldidentity",t."jOCordinates"
	from temp_data_mark t 
	where not exists (select * from realtime."RHighlightsLog" r where r."nHid" = t."nHid" );

insert into realtime."RHighlightsLog" ("nHid","cPageno","cLineno","nRefresh","cTime","cNote","identity","jCordinates")
	select "nHid","cPageno","cLineno","nRefresh","cTime","cNote","identity",t."jCordinates"
	from temp_data_mark t ;

update "RHighlights" r set "cPageno" = t."cPageno","cLineno" = t."cLineno", "cTime" = t."cTime","cNote" = t."cNote", "identity" =  t."identity" , 
	"jCordinates" = t."jCordinates"
from temp_data_mark t
where r."nHid" = t."nHid";

/*
update "RHighlights" set "cOPageno" = cOLDPageno,"cOLineno" = cOLDLineno  where "nHid" = nHid  and "cOPageno" is null;

if not exists (select * from realtime."RHighlightsLog" where "nHid" = nHid)then 

	insert into realtime."RHighlightsLog" ("nHid","cPageno","cLineno","nRefresh","cTime","cNote","identity")
	values(nHid,cOLDPageno,cOLDLineno,nRefresh,cOLDTime,cOLDNote,oldidentity);

end if;

	insert into realtime."RHighlightsLog" ("nHid","cPageno","cLineno","nRefresh","cTime","cNote","identity")
	values(nHid,cPageno,cLineno,nRefresh,cTime,cNote,cIdentity);

update "RHighlights" set "cPageno" = cPageno,"cLineno" = cLineno, "cTime" = cTime,"cNote" = cNote, "identity" =  cIdentity 
where "nHid" = nHid;*/

	open ref for select 1 as msg,'Annotations updated' as value;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
