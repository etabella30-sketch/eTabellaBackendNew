CREATE OR REPLACE FUNCTION public.et_get_bundle_links(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$declare nUserid uuid;nBundledetailid uuid;cFlag text;
isAdmin boolean default false; 
	nCaseid uuid; nTeamid uuid;nRoleid uuid;

BEGIN
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
cFlag := parameter ->>'cFlag';

	select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nUserid;
	 	select "nCaseid" into nCaseid from bundlesource where  "nBundledetailid" =  nBundledetailid;
	
	select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nUserid and "nCaseid" = nCaseid limit 1;
	 raise notice 'nCaseid , nRoleid  %,%,% nTeamid &',nCaseid,nRoleid,nTeamid ;
	if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then 
		isAdmin := true;
	end if;

-- select * from "DocDetail" where 
if(cFlag='DL')then

open ref1 for 
select  d."nDocid",dd."jLinktype",
jsonb_agg(distinct jsonb_build_object('nBundledetailid',dl."nBundledetailid",'nDMLid',dl."nDMLids",'jLinktype',dl."jLinktype",
											'cTab',bdl."cTab",'cExhibitno',bdl."cExhibitno",'cFilename',bdl."cFilename",'cBundletag',bm."cBundletag",'cPath',bdl."cPath")) sublist
from "DocMaster" d
join "DocDetail" dd on dd."nDocid" = d."nDocid"
join "DMLinks" dl on dl."nDocid" = d."nDocid"
join "BundleDetail" bd on bd."nBundledetailid" = d."nBundledetailid"
join "BundleDetail" bdl on bdl."nBundledetailid" = dl."nBundledetailid"
left join "DMShared" ds on ds."nDocid" = d."nDocid"  and ds."nUserid" = nUserid
left join "LocationShare" ls on ls."nBundledetailid" = d."nBundledetailid" and ls."nUserid" = nUserid
left join "BundleMaster" bm on bm."nBundleid" = bdl."nBundleid"
left join "TeamRelation" tr ON tr."nTeamid" =  nTeamid 
where d."nBundledetailid" = nBundledetailid  and (d."nUserid" = nUserid or ls."nUserid" = d."nUserid" or ds."nUserid" = nUserid  or (case when  isAdmin = true then  d."nUserid" = tr."nUserid" else false end)) 
group by d."nDocid",dd."jLinktype"
;
elsif(cFlag='FL') then
-- select * from "FactMaster"

open ref1 for 
select f."nFSid",fd."jLinktype",
jsonb_agg(distinct jsonb_build_object('nBundledetailid',fl."nBundledetailid",'nDMLid',fl."nFMLid",'jLinktype',fl."jLinktype",
											'cTab',bd."cTab",'cExhibitno',bd."cExhibitno",'cFilename',bd."cFilename",'cBundletag',bm."cBundletag",'cPath',bd."cPath",'nPage',fd."nPage")) sublist
from "FactMaster" f
join "FactDetail" fd on fd."nFSid" = f."nFSid"
join "FMLinks" fl on fl."nFSid" = f."nFSid"
join "BundleDetail" bd on bd."nBundledetailid" = fl."nBundledetailid"
left join "BundleMaster" bm on bm."nBundleid" = bd."nBundleid"
left join "LocationShare" ls on ls."nBundledetailid" = fl."nBundledetailid" and ls."nUserid" = nUserid
left join "FMShared" fs on fs."nFSid" = f."nFSid"  and fs."nUserid" = nUserid
left join "TeamRelation" tr ON tr."nTeamid" =  nTeamid 
 where  f."nBundledetailid" = nBundledetailid and (f."nUserid" = nUserid or ls."nUserid" = f."nUserid" or fs."nUserid" = nUserid  or (case when  isAdmin = true then  f."nUserid" = tr."nUserid" else false end)) 
 group by f."nFSid",fd."jLinktype";
 elsif(cFlag='WL') then
-- select * from "FactMaster"

open ref1 for 
select w."nWebid",wd."cUrl",wd."cTitle",wd."cNote",wd."cUrl",wd."jLinktype"
from "WebMaster" w
join "WebDetail" wd on wd."nWebid" = w."nWebid"
left join "WMShared" ws on ws."nWebid" = w."nWebid"  and ws."nUserid" = nUserid
 where  w."nBundledetailid" = nBundledetailid  and (w."nUserid" = nUserid or ws."nUserid" = nUserid );

 elsif(cFlag='F') then
-- select "bIsHighlighted",* from "FactDetail"

open ref1 for 
with tm as 
(select f."nFSid",fd."jLinktype",fd."jTexts",fd."cTooltype",fd."jOT",fd."bIsHighlighted",fd."nPage",
jsonb_agg(distinct jsonb_build_object('nIid',im."nIid",'cIName',im."cIName",'cCategory',ic."cCategory",'cColor',im."cColor",'cRel',rl."cCodename",'nImpactid',fi."nImpactid",'nSerialno',rl."nSerialno",'nISerialno',impct."nSerialno")  ) "jIssue"
from "FactMaster" f
join "FactDetail" fd on fd."nFSid" = f."nFSid"
JOIN "FMIssue" fi ON fi."nFSid" = f."nFSid"
JOIN "RIssueMaster" im ON im."nIid" = fi."nIssueid"
JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"
LEFT JOIN "Codemaster" rl ON rl."nCodeid" = fi."nRelevanceid" 
LEFT JOIN "Codemaster" impct ON impct."nCodeid" = fi."nImpactid" 
 left join "FMShared" fs on fs."nFSid" = f."nFSid"  and fs."nUserid" = nUserid
left join "TeamRelation" tr ON tr."nTeamid" =  nTeamid 
left join "LocationShare" ls on ls."nBundledetailid" = f."nBundledetailid" and ls."nUserid" = nUserid
 where  f."nBundledetailid" = nBundledetailid and (f."nUserid" = nUserid  or  ls."nUserid" = f."nUserid" or fs."nUserid" = nUserid or (case when  isAdmin = true then  f."nUserid" = tr."nUserid" else false end))  and f."cFType" = 'F'
 group by f."nFSid",fd."jLinktype",fd."jTexts",fd."jOT",fd."bIsHighlighted",fd."cTooltype",fd."nPage")
select t."nFSid",t."jLinktype",t."jTexts",t."cTooltype",t."jOT",t."bIsHighlighted",t."nPage",jsonb_agg(issue order by issue->>'nSerialno',issue->>'nISerialno') "jIssue" from tm t,jsonb_array_elements(t."jIssue") issue
 group by t."nFSid",t."jLinktype",t."jTexts",t."cTooltype",t."jOT",t."bIsHighlighted",t."nPage"
 ;
 
 
 elsif(cFlag='QF') then
-- select "bIsHighlighted",* from "FactDetail"

open ref1 for 
with tm as 
(select f."nFSid",fd."jLinktype",fd."jTexts",fd."cTooltype",fd."jOT",fd."bIsHighlighted",fd."nPage",
jsonb_agg(distinct jsonb_build_object('nIid',im."nIid",'cIName',im."cIName",'cCategory',ic."cCategory",'cColor',im."cColor",'cRel',rl."cCodename",'nImpactid',fi."nImpactid",'nSerialno',rl."nSerialno",'nISerialno',impct."nSerialno")  ) "jIssue"
from "FactMaster" f
join "FactDetail" fd on fd."nFSid" = f."nFSid"
JOIN "FMIssue" fi ON fi."nFSid" = f."nFSid"
JOIN "RIssueMaster" im ON im."nIid" = fi."nIssueid"
JOIN "IssueCategory" ic ON ic."nICid" = im."nICid"
LEFT JOIN "Codemaster" rl ON rl."nCodeid" = fi."nRelevanceid" 
LEFT JOIN "Codemaster" impct ON impct."nCodeid" = fi."nImpactid" 
left join "TeamRelation" tr ON tr."nTeamid" =  nTeamid 
 where  f."nBundledetailid" = nBundledetailid and (f."nUserid" = nUserid  or (case when  isAdmin = true then  f."nUserid" = tr."nUserid" else false end)) and f."cFType" = 'QF'
 group by f."nFSid",fd."jLinktype",fd."jTexts",fd."jOT",fd."bIsHighlighted",fd."cTooltype",fd."nPage")
select t."nFSid",t."jLinktype",t."jTexts",t."cTooltype",t."jOT",t."bIsHighlighted",t."nPage",jsonb_agg(issue order by issue->>'nSerialno',issue->>'nISerialno') "jIssue" from tm t,jsonb_array_elements(t."jIssue") issue
 group by t."nFSid",t."jLinktype",t."jTexts",t."cTooltype",t."jOT",t."bIsHighlighted",t."nPage"
 ;
 
 
 
 
else

-- select * from "WebDetail"
open ref1 for 
select w."nWebid",w."nBundledetailid" "nId",wd."jLinktype",wd."cUrl",wd."cTitle",wd."cNote",wd."cImg",wd."cFavicon"
from "WebMaster" w
join "WebDetail" wd on wd."nWebid" = w."nWebid"
left join "LocationShare" ls on ls."nBundledetailid" = w."nBundledetailid" and ls."nUserid" = nUserid
left join "BundleDetail" bd on bd."nBundledetailid" = w."nBundledetailid"
left join "BundleMaster" bm on bm."nBundleid" = bd."nBundleid"
 where  w."nBundledetailid" = nBundledetailid  and (w."nUserid" = nUserid or ls."nUserid" = nUserid) 
;
end if;

RETURN next ref1 ; 

open ref2 for select 1 msg;
RETURN next ref2 ; 
-- select * from "bundlelist"

                                                      -- Return the cursor to the caller
    END;$function$
