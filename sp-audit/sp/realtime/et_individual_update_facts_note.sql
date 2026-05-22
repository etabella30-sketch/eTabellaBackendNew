CREATE OR REPLACE FUNCTION realtime.et_individual_update_facts_note(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nFSid uuid;jTexts jsonb;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jTexts := parameter ->>'jTexts';
nFSid := NULLIF(parameter ->>'nFSid','')::uuid;

/*
select * from et_individual_update_facts_note ('{"nMasterid":2}','r1');fetch all in "r1";

select * from "FactDetail" order by 1 desc

*/

update "FactDetail" set "jTexts" = jTexts where "nFSid" = nFSid;

open ref for
select 1 as msg;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
