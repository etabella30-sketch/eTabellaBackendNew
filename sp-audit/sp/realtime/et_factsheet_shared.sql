CREATE OR REPLACE FUNCTION realtime.et_factsheet_shared(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nFSid UUID;nMasterid uuid;nCaseid uuid;jPermittedUsers jsonb;
BEGIN

nFSid := (parameter ->>'nFSid')::UUID;
nMasterid := (parameter->>'nMasterid')::uuid;
jPermittedUsers :=parameter->>'jPermittedUsers';

/*
 select * from realtime.et_factsheet_shared ('{"nFSid":"f5812de0-bd2d-481d-b014-8dabfd9ce799"}','r1');fetch all in "r1";
 select * From "FMShared"
isSelected
  select * From "UserMaster"

select * from realtime.et_factsheet_shared ('{"nFSid":"5fc545bb-661b-4413-96f2-892b4c19742d","nMasterid":"400a9554-67ea-4b84-907a-17da829821b7","jPermittedUsers":"[{\"userId\":\"ba561c55-81f5-4180-8934-2ce6dcaa096c\",\"view\":true,\"bCanEdit\":true,\"bCanReshare\":true,\"bCanComment\":true},{\"userId\":\"400a9554-67ea-4b84-907a-17da829821b7\",\"view\":true,\"bCanEdit\":true,\"bCanReshare\":true,\"bCanComment\":true}]"}','r1');fetch all in "r1";
  
*/

	

select "nCaseid" into nCaseid from "FactMaster" where "nFSid" = nFSid;

    OPEN ref1 FOR
	/*select u."nUserid",f."bCanComment",f."bCanEdit",f."bCanReshare", --f."bCanCopy",
	u."cFname",u."cLname",u."cEmail",u."cProfile",f."userId" is not null "isSelected"
	from "UserMaster" u 
    JOIN "TeamRelation" tr ON tr."nCaseid" = nCaseid AND tr."nUserid" = u."nUserid" 
	left join (

   			SELECT * FROM jsonb_to_recordset((jPermittedUsers)::jsonb) AS x(
                "userId" text,
                "view" boolean,
                "bCanEdit" boolean,
                "bCanReshare" boolean,
                "bCanComment" boolean
            )

	) f on f."userId"::uuid = u."nUserid" -- and f."nFSid" = nFSid
	 WHERE "nTeamid" = (
        SELECT "nTeamid" 
        FROM "TeamRelation" 
        WHERE "nCaseid" = nCaseid AND "nUserid" = nMasterid
    ); --and u."nUserid" != nMasterid*/

	
	select u."nUserid",f."bCanComment",f."bCanEdit",f."bCanReshare",
	u."cFname",u."cLname",u."cEmail",u."cProfile",f."nFSid" is not null "isSelected"
	,case when u."isAdmin" or rm."nSrno" = 1 then true else false end  "isAdmin"
	from "UserMaster" u 
    JOIN "TeamRelation" tr ON tr."nCaseid" = nCaseid AND tr."nUserid" = u."nUserid" 
	join "RoleMaster" rm on rm."nRoleid" = tr."nRoleid"
	left join "FMShared" f on f."nUserid" = u."nUserid" and f."nFSid" = nFSid
	 WHERE "nTeamid" = (
        SELECT "nTeamid" 
        FROM "TeamRelation" 
        WHERE "nCaseid" = nCaseid AND "nUserid" = nMasterid
    );
	-- and u."nUserid" != nMasterid;

	
    RETURN NEXT ref1;
    
    
END;
$function$
