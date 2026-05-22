CREATE OR REPLACE FUNCTION public.et_realtime_navigate_checkdata(parameter json, ref1 refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nCaseid uuid;nUserid uuid;nSessionid uuid;

isAdmin  boolean default false;
isNavigateion boolean default false;

isQFact boolean default false;
isQMark boolean default false;

BEGIN

nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
nSessionid := NULLIF(parameter ->>'nSessionid','')::uuid;

isAdmin := case when exists (  select * from "UserMaster" where "nUserid" = nUserid and "isAdmin" = true )  then true  else false  end;

-- isFact := case when exists ( select *  from "FactMaster" f
--     left join "FMShared" fs on fs."nFSid" = f."nFSid"
--     left join "BDPermission" bd on bd."nBundledetailid" = f."nBundledetailid" and bd."nUserid" = nMasterid
--     where f."nBundledetailid" = nBundledetailid  and (f."nUserid" = nMasterid or fs."nUserid" = nMasterid)
-- 							  and (isAdmin or "nBDPid" is null) and f."cFType" = 'F'
--   )  then true  else false  end;

isQFact := case when exists (SELECT * FROM "RIssueDetail" rd 
							 JOIN "RIssueMapid" rm ON rm."nIDid" = rd."nIDid"
							 WHERE rd."nCaseid" = nCaseid
							 AND rd."nSessionid" = nSessionid
							 AND rd."nUserid" = nUserid
							 )  then true else false end;

isQMark := case when exists ( SELECT * FROM "RHighlights" rh 
							   JOIN "RHighlightMapid" h ON rh."nHid" = h."nHid"
							   JOIN "RIssueMaster" rmast ON rmast."nIid" = h."nIid"
							   WHERE rh."nCaseid" = nCaseid
							   AND rh."nSessionId" =nSessionid
							   AND rh."nUserid" = nUserid
							 )  then true else false end;

isNavigateion := case when isQFact or isQMark then true else false end;

open ref1 for select 1 msg,isNavigateion,isQFact, isQMark ;

		
   RETURN ref1;

END;
$function$
