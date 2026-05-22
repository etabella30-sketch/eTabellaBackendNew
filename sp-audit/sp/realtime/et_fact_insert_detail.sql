CREATE OR REPLACE FUNCTION realtime.et_fact_insert_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFSid uuid;jText jsonb;nFt integer;nSt integer;
jDate jsonb;cType text;nTZid integer;jOT jsonb;
jAn jsonb;nColorid uuid;jLinktype jsonb;cIsNote text;
bIsHighlighted boolean;
jCordinates jsonb;
nPage int; nLine int;cFFrom text;
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
jCordinates := parameter->>'jCordinates';
nPage := parameter->>'nPage';
nLine := parameter->>'nLine';
cFFrom:= parameter->>'cFFrom';
-- alter table "FactDetail" add column "cIsNote" character varying(1) default 'N';

/*

select * from realtime.et_fact_insert_detail ('{"nSesid":"da4238c4-1630-4586-aba1-899dca410a7c","jCoordinates":"[{\"text\":\"ation of things.  To look at the development \",\"t\":\"13:39:28:07\",\"l\":8,\"p\":42,\"oP\":22,\"oL\":2,\"identity\":\"374926425208602\"},{\"text\":\"      plan as it was executed and t\",\"t\":\"13:39:31:10\",\"l\":9,\"p\":42,\"oP\":22,\"oL\":3,\"identity\":\"374926425208603\"}]","nColorid":"a05df4b6-6091-4390-b7c4-43c214e78fc3","jT":"[\"hello world\"]","jOT":"[\"ation of things.  To look at the development \",\"      plan as it was executed and t\"]","jIssues":"[[\"a05df4b6-6091-4390-b7c4-43c214e78fc3\",22,14]]","cFtype":"QF","cIsNote":"Y","cFFrom":"RT","nCaseid":"bc669a9e-6388-42af-9a94-f438e907ea30","jContacts":"[]","nMasterid":"7ee7a723-d96d-4d63-81c1-4dc4a2be4699","nFSid":"d491a0ca-c6fc-4917-9407-f09e11fc7379"}','r1');fetch all in "r1";
*/
-- select * from "FactDetail" order by 1 desc

	insert into "FactDetail" ("nFSid","nFiletype","nTZid","jDate","nStatus","cType","jTexts","jOT","nColorid","jLinktype","cIsNote", "bIsHighlighted", "jCordinates", "nPage","nLine" )
	select nFSid,nFt,nTZid,jDate,nSt,cType,jText,jOT,nColorid,jLinktype,coalesce(cIsNote,'N'),bIsHighlighted, case when cFFrom = 'I' then null else jCordinates end, nPage, nLine;

	if(cFFrom = 'I') then
		 insert into "Annotations"("uuid","type","rects","lines","colorid","width","page","nFSid","dCreateDt")
		 select "uuid","type",coalesce("rects",'[]'::jsonb),coalesce("lines",'[]'::jsonb),nColorid,"width","page",nFSid,now() from jsonb_to_recordset(jAn) as ("uuid" text,"type" text,"rects" jsonb,"lines" jsonb,width int,"page" int);
	 end if;
	
	open ref for select 1 msg;
    RETURN ref;
END;
$function$
