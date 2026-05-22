CREATE OR REPLACE FUNCTION present.et_present_ongoing(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;
nCaseid uuid;

BEGIN
-- select * from present.et_present_ongoing('{""nCaseid"":1079, ""nMasterid"": 29}','r');fetch all in ""r""
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

		open ref for
			-- select pm.""nPresentid"", pm.""cName"",pm.""cStatus"", cm.""cCodename"" from ""PresentationMaster"" pm 
			-- join ""Codemaster"" cm on cm.""nCodeid"" = pm.""nTypeid"" 
			-- where ""cStatus"" != 'C' and ""nCaseid"" = nCaseid;

		/*
			select * from ""PMUser""
			*/

		/*	select pm.""nPresentid"", pm.""cName"", pm.""cStatus"", pm.""nCreateid"",um.""cFname"", um.""cLname"", cm.""jOther""->'type' ""type"", u.""cAStatus"" as ""cUAStatus""
			from present.""PresentationMaster"" pm 
			join ""Codemaster"" cm on cm.""nCodeid"" = pm.""nTypeid"" 
			join ""UserMaster"" um on um.""nUserid"" = pm.""nCreateid"" 
			left join present.""PMUser"" u on u.""nPresentid"" = pm.""nPresentid"" and u.""nUserid"" = nMasterid
			where (pm.""cStatus"" not in ('C', 'B') and pm.""nCaseid"" = c )
			and (  pm.""nCreateid"" = nMasterid or  u.""nPUid"" is not null
			--exists (select 1 from ""PMUser"" u where u.""nPresentid"" = pm.""nPresentid"" and u.""nUserid"" = nMasterid)
			) ;

		*/
			
			select pm."nPresentid",
			pm."cName",
			pm."cStatus",
			pm."nCreateid",
			um."cFname", um."cLname", cm."jOther"->'type' "type", u."cAStatus" as "cUAStatus",
			t."cTeamname" 
			from present."PresentationMaster" pm 
			join "Codemaster" cm on cm."nCodeid" = pm."nTypeid" 
			join "UserMaster" um on um."nUserid" = pm."nCreateid" 
			JOIN "TeamRelation" tr ON tr."nUserid" = nMasterid
			JOIN "TeamMaster" t ON tr."nTeamid" = t."nTeamid" 
			left join present."PMUser" u on u."nPresentid" = pm."nPresentid" and u."nUserid" = nMasterid
			where (pm."cStatus" not in ('C', 'B') and pm."nCaseid" = nCaseid )
			and (  pm."nCreateid" = nMasterid or  u."nPUid" is not null)
			and t."nCaseid" = nCaseid;
							
 -- Return the cursor to the caller
 RETURN ref;    
END;

$function$
