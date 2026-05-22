CREATE OR REPLACE FUNCTION public.et_allusers(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare 
    nMasterid uuid;
    pageNumber int;
    offsetCount int;
    perPage int default 20;
    nCaseid uuid;
    nTeamid uuid;
    searchText text;
    cLname text;
    isAdmin boolean default false;
BEGIN

nMasterid := (parameter ->>'nMasterid')::uuid;
pageNumber := coalesce((parameter ->>'pageNumber')::int, 1);
offsetCount := (pageNumber - 1) * perPage;
nCaseid := (parameter ->>'nCaseid')::uuid;
nTeamid := (parameter ->>'nTeamid')::uuid;
searchText := parameter->>'searchText';
cLname := coalesce((parameter->>'cLname')::text,'');
/*
 select * from et_allusers('{"nMasterid":"2f6c5572-5e2d-42e9-a90d-4a0b6d528042","pageNumber":1,"nCaseid":"83a1f4f4-9e0b-4e04-828a-5db04da8eeef","nTeamid":"af5d7c36-1028-4ac4-bca6-c7e213c9e0e7","searchText":""}','r1');FETCH All in "r1";
 
 select * From "TeamMaster"
 select * From "UserSetting"
*/
	
-- select * from et_allusers ('{"nCaseid":"83a1f4f4-9e0b-4e04-828a-5db04da8eeef","pageNumber":1,"nTeamid":null,"searchText":"Roshan patel","cLname":"All","nMasterid":"2f6c5572-5e2d-42e9-a90d-4a0b6d528042"}','r1');fetch all in "r1";

select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nMasterid;

OPEN ref1 FOR 

select u."nUserid",
       u."cFname",
       u."cLname",
	   u."cEmail",
       u."cProfile" --,t."nTeamid",t."nRoleid"
From "UserMaster" u
left join "TeamRelation" t on t."nCaseid" = nCaseid and t."nUserid" = u."nUserid"
left join "RoleMaster" r on r."nRoleid" = t."nRoleid"
left join "TeamMaster" tm on tm."nTeamid" = t."nTeamid"
WHERE u."nUserid" != nMasterid and case when coalesce(searchText,'') != '' then(
    LOWER(u."cFname") LIKE ANY (ARRAY(SELECT '%' || LOWER(UNNEST(STRING_TO_ARRAY(searchText, ' '))) || '%')) --LIKE LOWER('%'|| REPLACE(searchText, ' ', '') ||'%')
    OR LOWER(u."cLname") LIKE ANY (ARRAY(SELECT '%' || LOWER(UNNEST(STRING_TO_ARRAY(searchText, ' '))) || '%')) -- LOWER('%'|| REPLACE(searchText, ' ', '') ||'%') 
    OR LOWER(u."cEmail") LIKE ANY (ARRAY(SELECT '%' || LOWER(UNNEST(STRING_TO_ARRAY(searchText, ' '))) || '%')) -- LOWER('%'|| REPLACE(searchText, ' ', '') ||'%')
    OR LOWER(r."cRole") LIKE ANY (ARRAY(SELECT '%' || LOWER(UNNEST(STRING_TO_ARRAY(searchText, ' '))) || '%')) -- LOWER('%'|| REPLACE(searchText, ' ', '') ||'%')
)else true end
and case when coalesce(isAdmin,false) = false then t."nCaseid" = nCaseid else true end
 
ORDER BY 
	
	/*case when nullif(searchText,'') is not null then 
	(trim(upper(u."cFname" || ' ' || u."cFname"))  like '%'|| trim(upper(searchText)) ||'%') = true then 0 else 1 end)
	else true end,*/
	    CASE 
        WHEN trim(LOWER(u."cFname" || ' ' || u."cFname"))  LIKE ('%'|| trim(upper(searchText)) ||'%') THEN 0
        WHEN LOWER(u."cEmail") = LOWER(searchText) THEN 0
        ELSE 1 
    END,
	
CASE WHEN nTeamid IS NOT NULL and t."nTeamid" = nTeamid THEN 0 ELSE 1 END,CASE WHEN nTeamid IS NOT NULL THEN "cTeamname" ELSE null END,
case when cLname != '' and upper(u."cLname") LIKE (upper(cLname) || '%') then 1 else 2 end, 
t."nTeamid", u."cFname"
LIMIT perPage
OFFSET offsetCount
;

RETURN NEXT ref1;

	 
END;
$function$
