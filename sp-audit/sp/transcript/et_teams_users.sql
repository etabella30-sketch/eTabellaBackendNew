CREATE OR REPLACE FUNCTION transcript.et_teams_users(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid integer;nCaseid uuid;
BEGIN

nMasterid := parameter ->>'nMasterid';
nCaseid := (parameter ->>'nCaseid');
/*
 select * from transcript.et_teams_users('{"nMasterid":2,"pageNumber":1,"nCaseid":22}','r1');FETCH All in "r1"

 select * from "UserMaster" where "cEmail" = 'jatin@gmail.com'
 
*/

	
OPEN ref1 FOR 
	select u."nUserid"
	from "UserMaster" u
	--join "UserSetting" us on us."nCaseid" = nCaseid and us."nUserid" = u."nUserid"
	join "TeamRelation" tr on tr."nCaseid" = nCaseid and tr."nUserid" = u."nUserid"-- and u."nUserid" = 'eb3ec87b-7ece-43fd-919f-a9c7a77de35e'
	;

RETURN NEXT ref1;

	 
END;
$function$
