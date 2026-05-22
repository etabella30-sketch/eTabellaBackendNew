CREATE OR REPLACE FUNCTION present.et_present_user_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nPresentid uuid;nUserid uuid;

BEGIN

nMasterid := NULLIF(parameter ->> 'nMasterid', '')::uuid;
nPresentid := NULLIF(parameter ->> 'nPresentid', '')::uuid;
nUserid := NULLIF(parameter ->> 'nUserid', '')::uuid;

-- select * from ""PMUser""

/*
select * From present.et_present_user_list('{""nMasterid"":464,""nPresentid"":253,""nUserid"":464}','r1');fetch all in ""r1"";

select * From ""UserMaster""

select * From present.""PMUser""
select * From present.""PresentationMaster"" order by 1 desc
select * From ""CaseMaster""

*/

    OPEN ref FOR

		
		select p."nUserid" ,pm."cName" ,pm."nCaseid",c."cCasename",
		c."cCaseno",pm."nPresentid",u."cToken",crt."cFname" || ' ' || crt."cLname" as "cCreator",crt."nUserid" as "nRefuserid"
		from present."PMUser" p 
		join present."PresentationMaster" pm on pm."nPresentid" = p."nPresentid"
		join "CaseMaster" c on c."nCaseid" = pm."nCaseid"
		join "UserMaster" u on u."nUserid" = p."nUserid"
		join "UserMaster" crt on crt."nUserid" = pm."nCreateid"  
		where p."nPresentid" = nPresentid and case when nUserid IS NOT NULL then p."nUserid" = nUserid else true end
		and p."nUserid" != pm."nCreateid" and pm."cStatus" not in ('I','B');

    RETURN ref;

	

	 
END;
$function$
