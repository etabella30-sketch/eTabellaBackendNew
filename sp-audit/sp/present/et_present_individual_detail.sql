CREATE OR REPLACE FUNCTION present.et_present_individual_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;
nPresentid uuid;isHost boolean default false;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;

/*
select * from present.et_present_individual_detail('{""nPresentid"":1,""nMasterid"": 366}','r');fetch all in ""r""
select p.""nPresentid"",(p.""nCreateid"" = nMasterid) as ""isHost"",p.""nCreateid"" as ""nPresenterid"",p.""cStatus"",u.""cStatus"" as ""cUStatus"",u.""cAStatus"" as ""cUAStatus"" 
		from ""PresentationMaster"" p,""PMUser"" u
	where p.""nPresentid"" = 176 and  u.""nPresentid"" = 176 and u.""nUserid"" = 464;
select * from ""PresentationMaster""  where ""nPresentid"" = 88

select * from present.""PMUser""   where ""nPresentid"" = 176

alter table present.""PMUser"" add column ""nControl"" smallint

null | 0 | 1 | 2

select * from present.""PMUser"" where ""nControl"" = 1

*/

open ref for
	with tbl as (
		select p."nPresentid",(p."nCreateid" = nMasterid) as "isHost",p."nCreateid" as "nPresenterid",p."cStatus", cm."jOther"->>'type' as "cSubType",
		p."nTypeid",case when (pu."nPUid" is not null and (p."nCreateid" = nMasterid)) then true else false end "isInControl"
		from present."PresentationMaster" p
		left join "Codemaster" cm on cm."nCodeid" =  p."nSubtypeid"
		left join present."PMUser" pu on pu."nPresentid" = p."nPresentid" and pu."nControl" = 1
		where p."nPresentid" = nPresentid 

	),usr as (
		select u."nPresentid",u."cStatus" as "cUStatus",u."cAStatus" as "cUAStatus",u."nControl"
		from present."PMUser" u
	where  u."nPresentid" = nPresentid and u."nUserid" = nMasterid

	) select * from tbl 
	left join usr on usr."nPresentid" = tbl."nPresentid"

		/*select p.""nPresentid"",(p.""nCreateid"" = nMasterid) as ""isHost"",p.""nCreateid"" as ""nPresenterid"",p.""cStatus"",u.""cStatus"" as ""cUStatus"",u.""cAStatus"" as ""cUAStatus"" 
		from ""PresentationMaster"" p,""PMUser"" u
	where p.""nPresentid"" = nPresentid and  u.""nPresentid"" = nPresentid and u.""nUserid"" = nMasterid*/
	;

 RETURN ref;    
END;
$function$
