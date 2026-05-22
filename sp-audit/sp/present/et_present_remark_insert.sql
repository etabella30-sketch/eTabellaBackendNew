CREATE OR REPLACE FUNCTION present.et_present_remark_insert(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nRemarkid int;nPresentid uuid;nBundledetailid uuid;nPRid uuid;nAId uuid;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nRemarkid := parameter ->>'nRemarkid';
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
nAId := NULLIF(parameter ->>'nAId','')::uuid;

/*
select * from present.et_present_remark_insert ('{""nPresentid"":9,""nBundledetailid"":165549,""nAId"":10132,""nRemarkid"":219,""nMasterid"":366}','r1');fetch all in ""r1"";

select * from present.""PMRemarks""

*/

nPRid := (select "nPRid" from present."PMRemarks" where "nPresentid" = nPresentid and "nBundledetailid" = nBundledetailid and "nAId" = nAId limit 1) ;

if(nPRid IS NOT NULL)then
	update present."PMRemarks" set "nRemarkid" = nRemarkid where "nPRid" = nPRid;

else

	insert into  present."PMRemarks"("nBundledetailid","nPresentid","nAId","nRemarkid")
	values(nBundledetailid,nPresentid,nAId,nRemarkid);
		
	
end if;

open ref for 

	select 1 as msg;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
