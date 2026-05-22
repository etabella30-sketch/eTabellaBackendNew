CREATE OR REPLACE FUNCTION public.et_upload_replacefile(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nUDid uuid; cName text; cSize text; cType text;
nBundledetailid uuid; cStatus text;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nUDid := NULLIF(parameter ->>'nUDid','')::uuid;
cName := parameter ->>'cName';
cSize := parameter ->>'cSize';
cType := parameter ->>'cType';
cStatus := parameter ->>'cStatus';
/*

select * from et_upload_replacefile ('{""nCaseid"":265,""nMasterid"":2}','r1');fetch all in ""r1"";

select * From ""UploadDetail""

*/

update "UploadDetail" set "cStatus" = 'F',"cName" = cName,"cSize" = cSize ,"cType"=cType where "nUDid" = nUDid;

nBundledetailid := (select "nBundledetailid" from "UploadDetail" where "nUDid" = nUDid);

if(nBundledetailid IS NOT NULL and cStatus = 'CF') then
	update "BundleDetail" set "cStatus" = 'F' where "nBundledetailid" = nBundledetailid;
end if;

open ref for
select 1 as msg;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
