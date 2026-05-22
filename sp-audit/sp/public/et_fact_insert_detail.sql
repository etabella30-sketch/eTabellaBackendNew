CREATE OR REPLACE FUNCTION public.et_fact_insert_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFSid uuid;jText jsonb;nFt integer;nSt integer;
jDate jsonb;cType text;nTZid integer;jOT jsonb;
jAn jsonb;nColorid uuid;jLinktype jsonb;cIsNote text;
bIsHighlighted boolean;
-- select * from "FactDetail" limit 0
BEGIN
nFSid := NULLIF(parameter->>'nFSid','')::uuid;
jText := parameter->>'jT';
nFt := parameter->>'nFt';
nSt := parameter->>'nSt';
jDate:= parameter->>'jDate';
cType := parameter->>'cType';
nTZid := parameter->>'nTZid';
jOT := parameter->>'jOT';
jAn := parameter->>'jAn';
nColorid:= NULLIF(parameter->>'nColorid','')::uuid;
jLinktype := parameter ->> 'jLinktype';
cIsNote := parameter->>'cIsNote';
bIsHighlighted := parameter->>'bIsHighlighted';

-- alter table "FactDetail" add column "cIsNote" character varying(1) default 'N';

/*
select * from et_fact_insert_detail ('{...}','r1');fetch all in "r1";

select * from "FactDetail" order by 1 desc

alter table "FactDetail" add column "cIsNote" character varying(1) default 'N';

*/
-- select * from "Annotations" order by 1 desc

	insert into "FactDetail" ("nFSid","nFiletype","nTZid","jDate","nStatus","cType","jTexts","jOT","nColorid","jLinktype","cIsNote", "bIsHighlighted")
	select nFSid,nFt,nTZid,jDate,nSt,cType,jText,jOT,nColorid,jLinktype,coalesce(cIsNote,'N'),bIsHighlighted;
	
	insert into "Annotations"("uuid","type","rects","lines","colorid","width","page","nFSid","dCreateDt")
	select "uuid","type",coalesce("rects",'[]'::jsonb),coalesce("lines",'[]'::jsonb),nColorid,"width","page",nFSid,now() from jsonb_to_recordset(jAn) as ("uuid" text,"type" text,"rects" jsonb,"lines" jsonb,width int,"colorid" uuid,"page" int);
	
	open ref for select 1 msg;
    RETURN ref;
END;
$function$
