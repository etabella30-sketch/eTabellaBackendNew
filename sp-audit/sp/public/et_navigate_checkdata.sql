CREATE OR REPLACE FUNCTION public.et_navigate_checkdata(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

-- select * from et_navigate_checkdata ('{"nBundledetailid":555364,"nMasterid":59,"nCaseid":29}','refcursor'); FETCH All in "refcursor";
declare nMasterid uuid; nBundledetailid uuid;nCaseid uuid;
isAdmin  boolean default false;
isNavigateion boolean default false;
isAllLinks boolean default false;

isContact boolean default false;
isFact boolean default false;
isQFact boolean default false;
isDoclink boolean default false;
isFactlink boolean default false;
isWeblink boolean default false;
isFacttask boolean default false;
isFiletask boolean default false;

begin

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
-- select * from "FMShared"

isAdmin := case when exists (  select * from "UserMaster" where "nUserid" = nMasterid and "isAdmin" = true )  then true  else false  end;

isContact := case when exists ( select *  from "FactMaster" f
    join "FMContact" fc on fc."nFSid" = f."nFSid"
    left join "FMShared" fs on fs."nFSid" = f."nFSid"
    left join "BDPermission" bd on bd."nBundledetailid" = f."nBundledetailid" and bd."nUserid" = nMasterid
    where f."nBundledetailid" = nBundledetailid  and (f."nUserid" = nMasterid or fs."nUserid" = nMasterid)
							   and (isAdmin or "nBDPid" is null)
  )  then true  else false  end;

isFact := case when exists ( select *  from "FactMaster" f
    left join "FMShared" fs on fs."nFSid" = f."nFSid"
    left join "BDPermission" bd on bd."nBundledetailid" = f."nBundledetailid" and bd."nUserid" = nMasterid
    where f."nBundledetailid" = nBundledetailid  and (f."nUserid" = nMasterid or fs."nUserid" = nMasterid)
							  and (isAdmin or "nBDPid" is null) and f."cFType" = 'F'
  )  then true  else false  end;

isQFact := case when exists ( select *  from "FactMaster" f
    left join "FMShared" fs on fs."nFSid" = f."nFSid"
    left join "BDPermission" bd on bd."nBundledetailid" = f."nBundledetailid" and bd."nUserid" = nMasterid
    where f."nBundledetailid" = nBundledetailid  and (f."nUserid" = nMasterid or fs."nUserid" = nMasterid)
							  and (isAdmin or "nBDPid" is null) and f."cFType" = 'QF'
  )  then true  else false  end;
  
-- isFactlink := case when exists ( select *  from "FactMaster" f
--     join "FMLinks" fl on fl."nFSid" = f."nFSid"
--     left join "FMShared" fs on fs."nFSid" = f."nFSid"
--     left join "BDPermission" bd on bd."nBundledetailid" = f."nBundledetailid" and bd."nUserid" = nMasterid
--     where f."nBundledetailid" = nBundledetailid  and (f."nUserid" = nMasterid or fs."nUserid" = nMasterid)
-- 								  and (isAdmin or "nBDPid" is null)
--   )  then true  else false  end;

  isFactlink := case when exists ( select *  from "FMLinks" fl
    join "FactMaster" f on f."nFSid" = fl."nFSid"
    left join "FMShared" fs on fs."nFSid" = f."nFSid"
    left join "BDPermission" bd on bd."nBundledetailid" = f."nBundledetailid" and bd."nUserid" = nMasterid
    where fl."nBundledetailid" = nBundledetailid  and (f."nUserid" = nMasterid or fs."nUserid" = nMasterid)
								  and (isAdmin or "nBDPid" is null)
  )  then true  else false  end;
  
  
  -- select * from "DMShared"
isDoclink := case when exists ( select *  from "DocMaster" d
    left join "DMShared" ds on ds."nDocid" = d."nDocid"
    left join "BDPermission" bd on bd."nBundledetailid" = d."nBundledetailid" and bd."nUserid" = nMasterid
    where d."nBundledetailid" = nBundledetailid  and (d."nUserid" = nMasterid or ds."nUserid" = nMasterid)
							     and (isAdmin or "nBDPid" is null)
  )  then true  else false  end;
  
  
isWeblink := case when exists ( select * from "WebMaster" w
    left join "WMShared" ws on ws."nWebid" = w."nWebid"
    left join "BDPermission" bd on bd."nBundledetailid" = w."nBundledetailid" and bd."nUserid" = nMasterid
    where w."nBundledetailid" = nBundledetailid  and (w."nUserid" = nMasterid or ws."nUserid" = nMasterid)
							      and (isAdmin or "nBDPid" is null)
  )  then true  else false  end;

isFacttask := case when exists ( select *  from "FactMaster" f
    join "FMTasks" ft on ft."nFSid" = f."nFSid"
	join "TaskMaster" tm on tm."nTaskid" = ft."nTaskid" 
    left join "FMShared" fs on fs."nFSid" = f."nFSid"
	left join "TaskShared" ts on ts."nTaskid" = tm."nTaskid" and ts."nUserid" = nMasterid
    left join "BDPermission" bd on bd."nBundledetailid" = f."nBundledetailid" and bd."nUserid" = nMasterid
    where f."nBundledetailid" = nBundledetailid  and (f."nUserid" = nMasterid or fs."nUserid" = nMasterid)
								and (tm."nUserid" = nMasterid or ts."nUserid" = nMasterid)
								   and (isAdmin or "nBDPid" is null)
  )  then true  else false  end;
  
  -- select * from "TaskMaster"
  -- select * from "BDPermission"
  
isFiletask := case when exists ( select *  from "TaskMaster" tm
	join "BDTasks" bt on bt."nTaskid" = tm."nTaskid"
	left join "TaskShared" ts on ts."nTaskid" = tm."nTaskid" and ts."nUserid" = nMasterid
    left join "BDPermission" bd on bd."nBundledetailid" = bt."nBundledetailid"  and bt."nUserid" = nMasterid
    where bt."nBundledetailid" = nBundledetailid  and (tm."nUserid" = nMasterid or ts."nUserid" = nMasterid)
				 and (isAdmin or "nBDPid" is null)
  )  then true  else false  end;
  
isNavigateion := case when isContact or isFact or isQFact or isDoclink or isFactlink or isWeblink or isFacttask or isFiletask then true else false end;

isAllLinks := case when isDoclink or isFactlink or isWeblink then true else false end;

open ref for select 1 msg,isNavigateion,isContact,isFact,isQFact, isDoclink,isFactlink,isWeblink,isFacttask,isFiletask, isAllLinks;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
