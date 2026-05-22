CREATE OR REPLACE FUNCTION public.et_fact_highlight_add(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFSid uuid; cText jsonb; cUuid text; type text; rects jsonb; lines jsonb; width smallint; page int;
nColorid uuid; nAId uuid; jLinktype jsonb;
/*
select * from ""Annotations"" limit 0
*/

BEGIN
nFSid := NULLIF(parameter->>'nFSid','')::uuid;
cText := parameter ->>'cText';
cUuid := parameter ->>'uuid';
type := parameter ->>'type';
rects := parameter ->>'rects';
lines := parameter ->>'lines';
width := coalesce(nullif(parameter ->>'width','')::int,0);
page := parameter ->>'page';
jLinktype := parameter ->>'jLinktype';
/*

select * from ""Annotations"" order by 1 desc

select * from et_fact_highlight_add ('{""nFSid"":75,""cText"":""[\""withstanding the basis upon which the Respondent agreed to enter into\\nAddendum No.1, and the undertakings and representations given and made by the\\nClaimant, no further extension of times were given subsequent to Addendum No.1\\nand the additional financing was not forthcom\""]"",""uuid"":""c1150a3a-8623-49c9-b1eb-2ab17b630fba"",""type"":""highlight"",""rects"":""[{\""x\"":157.99118041992188,\""y\"":71.66015625,\""width\"":57.49951171875,\""height\"":10.3125},{\""x\"":215.4931640625,\""y\"":72.59765625,\""width\"":2.5048828125,\""height\"":8.994140625},{\""x\"":215.4931640625,\""y\"":71.66015625,\""width\"":2.5048828125,\""height\"":10.3125},{\""x\"":222.8173828125,\""y\"":72.59765625,\""width\"":14.613418579101562,\""height\"":8.994140625},{\""x\"":222.8173828125,\""y\"":71.66015625,\""width\"":14.613418579101562,\""height\"":10.3125},{\""x\"":237.4072265625,\""y\"":72.59765625,\""width\"":2.5048828125,\""height\"":8.994140625},{\""x\"":237.4072265625,\""y\"":71.66015625,\""width\"":2.5048828125,\""height\"":10.3125},{\""x\"":244.8046875,\""y\"":72.59765625,\""width\"":22.925262451171875,\""height\"":8.994140625},{\""x\"":244.8046875,\""y\"":71.66015625,\""width\"":22.925262451171875,\""height\"":10.3125},{\""x\"":267.7294921875,\""y\"":72.59765625,\""width\"":2.5048828125,\""height\"":8.994140625},{\""x\"":267.7294921875,\""y\"":71.66015625,\""width\"":2.5048828125,\""height\"":10.3125},{\""x\"":274.9951171875,\""y\"":72.59765625,\""width\"":22.593338012695312,\""height\"":8.994140625},{\""x\"":274.9951171875,\""y\"":71.66015625,\""width\"":22.593338012695312,\""height\"":10.3125},{\""x\"":297.6123046875,\""y\"":72.59765625,\""width\"":2.5048828125,\""height\"":8.994140625},{\""x\"":297.6123046875,\""y\"":71.66015625,\""width\"":2.5048828125,\""height\"":10.3125},{\""x\"":304.9365234375,\""y\"":72.59765625,\""width\"":25.968658447265625,\""height\"":8.994140625},{\""x\"":304.9365234375,\""y\"":71.66015625,\""width\"":25.968658447265625,\""height\"":10.3125},{\""x\"":330.908203125,\""y\"":72.59765625,\""width\"":2.5048828125,\""height\"":8.994140625},{\""x\"":330.908203125,\""y\"":71.66015625,\""width\"":2.5048828125,\""height\"":10.3125},{\""x\"":338.291015625,\""y\"":72.59765625,\""width\"":14.721725463867188,\""height\"":8.994140625},{\""x\"":338.291015625,\""y\"":71.66015625,\""width\"":14.721725463867188,\""height\"":10.3125},{\""x\"":352.998046875,\""y\"":72.59765625,\""width\"":2.5048828125,\""height\"":8.994140625},{\""x\"":352.998046875,\""y\"":71.66015625,\""width\"":2.5048828125,\""height\"":10.3125},{\""x\"":360.322265625,\""y\"":72.59765625,\""width\"":53.20729064941406,\""height\"":8.994140625},{\""x\"":360.322265625,\""y\"":71.66015625,\""width\"":53.20729064941406,\""height\"":10.3125},{\""x\"":413.5546875,\""y\"":72.59765625,\""width\"":2.5048828125,\""height\"":8.994140625},{\""x\"":413.5546875,\""y\"":71.66015625,\""width\"":2.5048828125,\""height\"":10.3125},{\""x\"":420.87890625,\""y\"":72.59765625,\""width\"":31.280731201171875,\""height\"":8.994140625},{\""x\"":420.87890625,\""y\"":71.66015625,\""width\"":31.280731201171875,\""height\"":10.3125},{\""x\"":452.1533203125,\""y\"":72.59765625,\""width\"":2.5048828125,\""height\"":8.994140625},{\""x\"":452.1533203125,\""y\"":71.66015625,\""width\"":2.5048828125,\""height\"":10.3125},{\""x\"":459.5361328125,\""y\"":72.59765625,\""width\"":9.06463623046875,\""height\"":8.994140625},{\""x\"":459.5361328125,\""y\"":71.66015625,\""width\"":9.06463623046875,\""height\"":10.3125},{\""x\"":468.5888671875,\""y\"":72.59765625,\""width\"":2.5048828125,\""height\"":8.994140625},{\""x\"":468.5888671875,\""y\"":71.66015625,\""width\"":2.5048828125,\""height\"":10.3125},{\""x\"":475.9130859375,\""y\"":72.59765625,\""width\"":23.86907958984375,\""height\"":8.994140625},{\""x\"":475.9130859375,\""y\"":71.66015625,\""width\"":23.86907958984375,\""height\"":10.3125},{\""x\"":499.7900390625,\""y\"":72.59765625,\""width\"":2.5048828125,\""height\"":8.994140625},{\""x\"":499.7900390625,\""y\"":71.66015625,\""width\"":2.5048828125,\""height\"":10.3125},{\""x\"":506.9970703125,\""y\"":72.59765625,\""width\"":17.21484375,\""height\"":8.994140625},{\""x\"":506.9970703125,\""y\"":71.66015625,\""width\"":17.21484375,\""height\"":10.3125},{\""x\"":141.8994140625,\""y\"":94.4091796875,\""width\"":382.2798156738281,\""height\"":8.994140625},{\""x\"":141.8994140625,\""y\"":93.4716796875,\""width\"":382.2798156738281,\""height\"":10.3125},{\""x\"":141.8994140625,\""y\"":116.30859375,\""width\"":381.8020935058594,\""height\"":8.994140625},{\""x\"":141.8994140625,\""y\"":115.37109375,\""width\"":381.8020935058594,\""height\"":10.3125},{\""x\"":141.8994140625,\""y\"":137.2705078125,\""width\"":208.377685546875,\""height\"":10.3125}]"",""lines"":""[]"",""width"":"""",""page"":8,""nMasterid"":2}','r1');fetch all in ""r1"";

select * from ""FactDetail"" order by 1 desc

*/

update "FactDetail" set "cType" = 'S',"jLinktype" = jLinktype where "nFSid" = nFSid;

if(coalesce(cText,'[]'::jsonb) !=('[]')::jsonb)then
update "FactDetail" set "jOT" = coalesce("jOT",('[]')::jsonb) ||  (coalesce(cText,'[]'::jsonb))  where "nFSid" = nFSid;
end if;

nColorid := (select "nColorid" from "FactDetail" where "nFSid" = nFSid);

insert into "Annotations" ("uuid","type","rects","lines","width","colorid","page","nFSid","dCreateDt")
values(cUuid,type,rects,lines,width,nColorid,page,nFSid,now())
RETURNING "nAId" INTO nAId;

open ref for select 1 msg,nAId as "nAId";
RETURN ref;

END;
$function$
