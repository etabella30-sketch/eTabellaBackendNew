CREATE OR REPLACE FUNCTION present.et_present_highlights_update_color(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nPresentid uuid;cuuid text;nAId uuid;cColor text;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;
cuuid := parameter ->>'uuid';
cColor := parameter ->>'cColor';
/*
select * from present.et_present_highlights_update_color ('{""nPresentid"":9,""uuid"":""8adf38d5-4434-41ba-b15e-639377447e88"",""cColor"":""#0066ff"",""type"":""highlight"",""rects"":""[{\""x\"":116.70753479003906,\""y\"":97.265625,\""width\"":149.2006072998047,\""height\"":12.1875}]"",""lines"":""[[\""76.61\"",\""106.64\""],[\""77.85\"",\""106.64\""]]"",""page"":1,""nMasterid"":366,""jUsers"":""[1,2]""}','r1');fetch all in ""r1"";
select * from present.et_present_highlights_update_color ('{""nPresentid"":9,""uuid"":""25288419-8841-41d1-aaf7-d1f99c19cb83"",""cColor"":""#646eff"",""nMasterid"":366}','r1');fetch all in ""r1"";
select * from ""Annotations"" where ""nAId"" = 9854  limit 1

select * from present.""PMHighlights""

select * from ""Annotations"" order by 1 desc

*/

nAId := (select "nAId" from "Annotations" a where a."nPresentid" = nPresentid and a."uuid" = cuuid limit 1);

if(nAId IS NOT NULL)then

	update "Annotations" set "clr" = cColor where "nAId" = nAId;

end if;

open ref for 
	select 1 as msg,nAId as "nAId";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
