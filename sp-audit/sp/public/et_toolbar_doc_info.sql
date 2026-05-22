CREATE OR REPLACE FUNCTION public.et_toolbar_doc_info(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nBundledetailid uuid;
isAdmin  boolean default false;
isFactlink boolean default false;

BEGIN
nMasterid := (parameter ->>'nMasterid')::uuid;
nBundledetailid := (parameter ->>'nBundledetailid')::uuid;

isAdmin := case when exists (  select * from "UserMaster" where "nUserid" = nMasterid and "isAdmin" = true )  then true  else false  end;

	 isFactlink := case when exists ( select *  from "FMLinks" fl
    join "FactMaster" f on f."nFSid" = fl."nFSid"
    left join "FMShared" fs on fs."nFSid" = f."nFSid"
    left join "BDPermission" bd on bd."nBundledetailid" = f."nBundledetailid" and bd."nUserid" = nMasterid
    where fl."nBundledetailid" = nBundledetailid  and (f."nUserid" = nMasterid or fs."nUserid" = nMasterid)
								  and (isAdmin or "nBDPid" is null)
  )  then true  else false  end;
  
  
open ref for select 1 msg,isFactlink;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
