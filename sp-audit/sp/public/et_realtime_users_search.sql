CREATE OR REPLACE FUNCTION public.et_realtime_users_search(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;searchText text;

BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
searchText := parameter ->>'cSearch';

/*
select * from et_realtime_users_search('{"nCaseid":152,"cSearch":"Rajendra"}','r');fetch all in "r"

select * from "CaseMaster"
select * from "UserMaster"
select * from "TeamRelation"
*/

open ref for
select um."nUserid",um."cFname",um."cLname" ,um."cProfile"
from  "UserMaster" um 
join "TeamRelation" tm on  tm."nUserid" = um."nUserid"
join "CaseMaster" c on c."nCaseid" = tm."nCaseid"
where tm."nCaseid"!=nCaseid and  (LOWER(c."cCasename") LIKE ANY (ARRAY(SELECT '%' || LOWER(UNNEST(STRING_TO_ARRAY(searchText, ' '))) || '%')) 
OR
LOWER(c."cCaseno") LIKE ANY (ARRAY(SELECT '%' || LOWER(UNNEST(STRING_TO_ARRAY(searchText, ' '))) || '%')) 
OR
LOWER(um."cFname") LIKE ANY (ARRAY(SELECT '%' || LOWER(UNNEST(STRING_TO_ARRAY(searchText, ' '))) || '%')) 
OR
LOWER(um."cLname") LIKE ANY (ARRAY(SELECT '%' || LOWER(UNNEST(STRING_TO_ARRAY(searchText, ' '))) || '%')) 
OR
LOWER(um."cEmail") LIKE ANY (ARRAY(SELECT '%' || LOWER(UNNEST(STRING_TO_ARRAY(searchText, ' '))) || '%')) )

group by um."nUserid",um."cFname",um."cLname" ,um."cProfile"

;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
