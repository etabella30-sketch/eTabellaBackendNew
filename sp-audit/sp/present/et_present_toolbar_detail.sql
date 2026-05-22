CREATE OR REPLACE FUNCTION present.et_present_toolbar_detail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nPresentid uuid;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;

/*
select * from present.et_present_toolbar_detail ('{"nPresentid":9,"nMasterid":366}','r1');fetch all in "r1";

select * from "Annotations" limit 1

select * from "PMUser"
select * from "UserMaster"
select * from present."PresentationMaster"

*/

open ref for 
	select p."nPresentid",p."cStatus",p."cName",count(distinct u."nUserid") as "totalusers",um."cFname",um."cLname",um."cProfile",p."nCreateid" as "nPresenterid"
	from present."PresentationMaster" p 
	join "UserMaster" um on um."nUserid" = p."nCreateid"
	left join present."PMUser" u on u."nPresentid" = p."nPresentid" 
	where p."nPresentid" = nPresentid
	group by p."nPresentid",p."cStatus",p."cName",um."cFname",um."cLname",um."cProfile";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
