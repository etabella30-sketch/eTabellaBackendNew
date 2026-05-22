CREATE OR REPLACE FUNCTION task.et_hyperlink_runnings(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
	
declare nUserid uuid; nCaseid uuid;

BEGIN
	
    nUserid := NULLIF(parameter ->>'nUserid', '')::uuid;
    nCaseid := NULLIF(parameter ->>'nCaseid', '')::uuid;
/*
  select * from task.et_hyperlink_runnings ('{""nCaseid"":1047,""nMasterid"":366}','r1');fetch all in ""r1"";
 
select *  from task.""HyperlinkMaster""
select *  from task.""TaskMaster""

 
select *  from task.hyperlinksummary
select *  from task.hyperlinkdetail

*/

open ref for 
select h."nTid", h."nHid", h."nCaseid", h."nSectionid", h."nBundleid", h."nBundledetailid", h."dCreateDt"
	from task."HyperlinkMaster" h
	join task."TaskMaster" t on t."nTid" = h."nTid"
	where h."nCaseid" = nCaseid and h."nUserid" = nUserid and t."cStatus" = 'P' and t."nTCatid" = 2;

RETURN ref;                                                       -- Return the cursor to the caller
END;
$function$
