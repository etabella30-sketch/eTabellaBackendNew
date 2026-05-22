CREATE OR REPLACE FUNCTION realtime.et_annottransfer_getdetail_v2(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nSesid uuid;cPageno int;cType text;jIdentities jsonb;
BEGIN
	nSesid := parameter ->>'nSesid';
	cPageno := nullif(parameter ->>'pageno','');
	cType := parameter ->>'cType';
	jIdentities := parameter ->>'jIdentities';

/*
select * from realtime.et_annottransfer_getdetail_v2 ('{"nSesid":"0885f37f-b96a-4982-a45c-3d35b0fa8d84","pageno":"","cType":"I","jIdentities":["22502911684501","22502911684501"]}','r1');fetch all in "r1";
select * from realtime."RHighlightsLog"

select * from "FactMaster"
select * from "FactDetail"

select * from "DocMaster"
select * from "DocDetail"

select * from "RIssueDetail"

alter table "DocDetail" add column "nTLine" int, add column "jOCordinates" jsonb, add column "jTCordinates" jsonb, add column "nTPage" int 

*/
	if  (cType = 'I') then 

		open ref for 
			--SELECT * FROM "RIssueDetail" where "nSessionid" = nSesid and nullif("cPageno",'')::int >= cPageno;
				select f."nFSid" as "nId",f."nUserid", f."cFType" as "cType",d."jOT" as "cONote",
				d."jCordinates",d."jOCordinates",d."jTCordinates"
				from "FactMaster" f 
				join "FactDetail" d on d."nFSid" = f."nFSid"
				where f."nSesid" = nSesid and d."nPage" >= cPageno
				union all
				select d."nDocid" as "nId",d."nUserid",'D' as "cType",dt."jOText" as "cONote",
				dt."jCordinates",dt."jOCordinates",dt."jTCordinates"
				from "DocMaster" d
				join "DocDetail" dt on dt."nDocid" = d."nDocid"
				where d."nSesid" = nSesid  and dt."nPage" >= cPageno;

				
	else
		open ref for 
			SELECT h.*,l."cNote" as "cONote",l."cTime" as "cOTime",coalesce(l."jCordinates",h."jCordinates") as  "jOCordinates"
			FROM "RHighlights" h
			left join realtime."RHighlightsLog" l on l."bIsOrg" = true and l."nHid" = h."nHid"
			where h."nSessionId" = nSesid and nullif(h."cPageno",'')::int >= cPageno --(jIdentities) @> to_jsonb("identity") --
			;

	end if;

	

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
