CREATE OR REPLACE FUNCTION present.et_present_teamusers(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nCaseid uuid;cType text;
BEGIN

nMasterid := NULLIF(parameter ->> 'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->> 'nCaseid','')::uuid;
cType := parameter ->> 'cType';

/*

select * From present.et_present_teamusers('{"nMasterid":366,"nCaseid":1106,"cType":"G"}','r1','r2','r3');fetch all in "r1";fetch all in "r2";

select * from present.et_present_teamusers('{"cType":"P","nCaseid":1106,"nMasterid":366}','r1','r2');fetch all in "r1";fetch all in "r2"

select * From "TeamMaster" order by 1 
select * From "UserMaster" order by 1 
*/

	
    OPEN ref1 FOR
		select distinct t."nTeamid",t."cTeamname",t."cFlag",t."cClr" 
		From "TeamMaster" t
		join "TeamRelation" tr on tr."nTeamid" = t."nTeamid"
		where t."nCaseid" = nCaseid and 
			case when coalesce(cType,'G')!='G' then (tr."nUserid" = nMasterid) else true end order by t."cTeamname"
		/*
		case when coalesce(cType,'G')!='G' then (
			exists (select tr."nTRid" from "TeamRelation" tr where tr."nCaseid" = nCaseid and tr."nUserid" = nMasterid and tr."nTeamid" = t."nTeamid")
		) else true end*/
		;
    RETURN NEXT ref1;
    
	
    OPEN ref2 FOR

		select tr."nTeamid",u."nUserid",u."cFname",u."cLname",u."cProfile"
		from "TeamRelation" tr
		join "UserMaster" u on u."nUserid" = tr."nUserid" and u."cStatus" = 'A' and u."nUserid" != nMasterid
		where tr."nCaseid" = nCaseid and case when coalesce(cType,'G') != 'G' then (
			exists (select tr."nTRid" from "TeamRelation" trm where trm."nCaseid" = nCaseid and trm."nUserid" = nMasterid and trm."nTeamid" = tr."nTeamid" )
		) else true end;
		

    RETURN NEXT ref2;

	

	 
END;
$function$
