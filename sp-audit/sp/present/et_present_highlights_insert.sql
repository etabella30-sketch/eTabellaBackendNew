CREATE OR REPLACE FUNCTION present.et_present_highlights_insert(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nPresentid uuid;cuuid text;type text;rects jsonb;lines jsonb;
width int;page int;nAId uuid;nBundledetailid uuid;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;
cuuid := parameter ->>'uuid';
type := parameter ->>'type';
rects := parameter ->>'rects';
lines := parameter ->>'lines';
width := parameter ->>'width';
page := parameter ->>'page';
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
/*
select * from present.et_present_highlights_insert ('{""nPresentid"":88,""nBundledetailid"":1,""uuid"":""427515c0-153e-43cb-a2a9-a60a79bdf013"",""type"":""highlight"",""rects"":""[{\""x\"":116.70753479003906,\""y\"":97.265625,\""width\"":149.2006072998047,\""height\"":12.1875}]"",""lines"":""[[\""76.61\"",\""106.64\""],[\""77.85\"",\""106.64\""]]"",""page"":1,""nMasterid"":366,""jUsers"":""[1,2]""}','r1');fetch all in ""r1"";

select * from ""Annotations"" order by 1 desc limit 1
alter table ""Annotations"" add column ""clr"" character varying(200)
select * from present.""PMHighlights""

select * from ""PMUser""

*/

nAId := (select "nAId" from "Annotations" a where a."nPresentid" = nPresentid and a."uuid" = cuuid limit 1);

if(nAId IS NULL)then
	insert into "Annotations"("uuid","type","rects","lines","width","page","nPresentid","nBDid")
	values(cuuid,type,coalesce(rects,'[]'::jsonb),coalesce(lines,'[]'::jsonb),width,page,nPresentid,nBundledetailid) RETURNING "nAId" INTO nAId;

	--if(jsonb_array_length(coalesce(jUsers,'[]'::jsonb))>0)then
		
		if(nAId IS NOT NULL)then
			insert into present."PMHighlights"("nPresentid","nAId","nUserid")
			select nPresentid,nAId,t."nUserid" from present."PMUser" t
			where "nPresentid" = nPresentid and coalesce("cStatus",'A') = 'A';
			--select nPresentid,nAId,t::int from jsonb_array_elements(jUsers) as t(value);
		end if;

	--end if;

end if;

open ref for 
	select 1 as msg,nAId as "nAId";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
