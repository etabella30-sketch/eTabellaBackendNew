CREATE OR REPLACE FUNCTION present.et_present_toolbar_users(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;nPresentid uuid;cType text;nCaseid uuid;
BEGIN

nMasterid := NULLIF(parameter ->> 'nMasterid','')::uuid;
nPresentid := NULLIF(parameter ->> 'nPresentid','')::uuid;

/*

select * From present.et_present_toolbar_users('{""nMasterid"":366,""nPresentid"":88}','r1','r2');fetch all in ""r1"";fetch all in ""r2"";

select * From ""TeamMaster"" order by 1 
select * From ""UserMaster"" order by 1 

select * From ""PresentationMaster"" 

select * From ""Codemaster"" 

*/

select (c."jOther"->>'type')::text,"nCaseid" into cType,nCaseid 
	from present."PresentationMaster" p 
	join "Codemaster" c on c."nCodeid" = p."nTypeid" 
	where p."nPresentid" = nPresentid limit 1;

	
    OPEN ref1 FOR
		select distinct t."nTeamid",t."cTeamname",t."cFlag",t."cClr" 
		From "TeamMaster" t
		join "TeamRelation" tr on tr."nTeamid" = t."nTeamid"
		where t."nCaseid" = nCaseid and 
			case when coalesce(cType,'G')!='G' then (tr."nUserid" = nMasterid) else true end 
		order by t."cTeamname"

		;
    RETURN NEXT ref1;
    

-- select * from present.""PMUser""

    OPEN ref2 FOR

		select tr."nTeamid",u."nUserid",u."cFname",u."cLname",u."cProfile",p."nPUid",p."cStatus",p."cAStatus",p."dActionDt",p."nControl"
		from "TeamRelation" tr
		join "UserMaster" u on u."nUserid" = tr."nUserid" and u."cStatus" = 'A'
		left join present."PMUser" p on p."nPresentid" = nPresentid and p."nUserid" = u."nUserid"
		where tr."nCaseid" = nCaseid and tr."nUserid"!=nMasterid and case when coalesce(cType,'G') != 'G' then (
			exists (select tr."nTRid" from "TeamRelation" trm where trm."nCaseid" = nCaseid and trm."nUserid" = nMasterid and trm."nTeamid" = tr."nTeamid" )
		) else true end;
		

    RETURN NEXT ref2;

	

	 
END;
$function$
