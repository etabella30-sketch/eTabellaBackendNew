CREATE OR REPLACE FUNCTION public.et_bundles_permissions(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid; nBundleid uuid; nBundledetailid uuid;
BEGIN

nMasterid := (parameter ->> 'nMasterid')::uuid;
nBundleid := (parameter ->> 'nBundleid')::uuid;
nBundledetailid := (parameter ->>'nBundledetailid')::uuid;

/*
 select * from et_bundles_permissions('{"nMasterid":2,"nBundleid":1809,"nBundledetailid":328445}','r1');FETCH All in "r1"
 
 
*/

if(nBundledetailid IS NOT NULL) then

OPEN ref1 FOR 

select "nUserid" 
from "BDPermission" where "nBundledetailid" = nBundledetailid;

else

OPEN ref1 FOR 

select "nUserid" 
from "BMPermission" where "nBundleid" = nBundleid;

end if;

RETURN NEXT ref1;

     
END;
$function$
