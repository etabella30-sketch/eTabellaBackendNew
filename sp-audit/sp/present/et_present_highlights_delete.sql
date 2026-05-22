CREATE OR REPLACE FUNCTION present.et_present_highlights_delete(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nPresentid uuid; cuuid text; nAId uuid;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;
cuuid := parameter ->>'uuid';

/*
select * from present.et_present_highlights_delete ('{""nPresentid"":9,""uuid"":""8d71f021-9052-458b-8f3c-710c1bfb8a65"",""type"":""highlight"",""rects"":""[{\""x\"":116.70753479003906,\""y\"":97.265625,\""width\"":149.2006072998047,\""height\"":12.1875}]"",""lines"":""[[\""76.61\"",\""106.64\""],[\""77.85\"",\""106.64\""]]"",""page"":1,""nMasterid"":366,""jUsers"":""[1,2]""}','r1');fetch all in ""r1"";

select * from ""Annotations"" where ""nAId"" = 9853  limit 1

select * from present.""PMHighlights""

select * from ""Annotations""

*/

nAId := (select "nAId" from "Annotations" a where a."nPresentid" = nPresentid and a."uuid" = cuuid limit 1);

if(nAId IS NOT NULL)then

	delete from "Annotations" where "nAId" = nAId;

	delete from present."PMHighlights" where "nAId" = nAId;

end if;

open ref for 
	select 1 as msg,nAId as "nAId";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
