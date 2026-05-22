CREATE OR REPLACE FUNCTION task.et_pagination_runnings(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
	
declare nUserid uuid;nCaseid uuid;

BEGIN
	
	nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
	nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
/*
  select * from task.et_pagination_runnings ('{"nCaseid":1122,"nMasterid":464}','r1');fetch all in "r1";
 
select *  from task."PaginationMaster"
 
select *  from task.hyperlinksummary
select *  from task.hyperlinkdetail

*/

open ref for 
select p."nTid",p."nPid",p."nCaseid",p."nSectionid",p."nBundleid",p."nBundledetailid",p."dCreateDt"
	from task."PaginationMaster" p
	join task."TaskMaster" t on t."nTid" = p."nTid"
	where p."nCaseid" = nCaseid and p."nUserid" = nUserid and t."cStatus" = 'P' and t."nTCatid" = 1;

 RETURN ref;                                                       -- Return the cursor to the caller
END;
$function$
