CREATE OR REPLACE FUNCTION present.et_present_remove_control(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nPresentid uuid;nPresenterid uuid;nUserid uuid;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;

/*

select * from present.et_present_remove_control ('{""nPresentid"":2,""nMasterid"":279}','r1');fetch all in ""r1"";

select * from present."PresentationMaster" order by 1 desc
select * from present."PMUser" where "nPresentid" = 2

*/

nPresenterid := (select "nCreateid"  from present."PresentationMaster" where "nPresentid" = nPresentid);

nUserid := (select "nUserid" from present."PMUser" where "nPresentid" = nPresentid and "nControl" = 1 limit 1);
	

update present."PMUser" set "nControl" = null
where "nPresentid" = nPresentid;

	

open ref for 
	select 1 as msg,nUserid as "nUserid",nPresenterid as "nPresenterid";
	

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
