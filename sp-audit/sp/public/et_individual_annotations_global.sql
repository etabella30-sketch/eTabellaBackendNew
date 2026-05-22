CREATE OR REPLACE FUNCTION public.et_individual_annotations_global(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;nBundledetailid uuid;

-- select * from et_individual_annotations_global('{"nBundledetailid":555364,"nMasterid":2}','r');fetch all in "r"
-- select * from "BundleDetail" order by 1 desc
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;

open ref for

-- select * from "FactMaster"
--select * from "LocationShare"
	--- truncate table "LocationShare" restart identity
-- CREATE INDEX idx_locationgroup_nbundledetailid_nshareby ON "LocationShare" ("nBundledetailid", "nShareby");
-- CREATE INDEX idx_locationgroup_nuserid ON "LocationShare" ("nUserid");

	
	with tbl as (
select coalesce(jsonb_agg(distinct f."nFSid"),'[]'::jsonb) as id,'F' as "type"
from "FactMaster" f
join "FactDetail" d on d."nFSid" = f."nFSid"
	left join "FMShared" s on s."nFSid" = f."nFSid"
	left join "LocationShare" ls on ls."nShareby" = f."nUserid" and ls."nBundledetailid" = nBundledetailid 
where d."cType" = 'M' and (f."nUserid" = nMasterid or s."nUserid" = nMasterid or ls."nUserid" = nMasterid) and f."nBundledetailid" = nBundledetailid
union all
select coalesce(jsonb_agg(distinct d."nDocid"),'[]'::jsonb) as id,'D' as "type"
From "DocMaster" d
join "DocDetail" dd on dd."nDocid" = d."nDocid"
	left join "DMShared" s on s."nDocid" = d."nDocid"
	left join "LocationShare" ls on ls."nShareby" = d."nUserid" and ls."nBundledetailid" = nBundledetailid 
where dd."cType" = 'M' and (d."nUserid" = nMasterid or s."nUserid" = nMasterid  or ls."nUserid" = nMasterid) and d."nBundledetailid" = nBundledetailid
union all
select coalesce(jsonb_agg(distinct w."nWebid"),'[]'::jsonb) as id,'W' as "type"
from "WebMaster" w 
join "WebDetail" wd on wd."nWebid" = w."nWebid"
	left join "WMShared" s on s."nWebid" = w."nWebid"
	left join "LocationShare" ls on ls."nShareby" = w."nUserid" and ls."nBundledetailid" = nBundledetailid 
where wd."cType" = 'M' and (w."nUserid" = nMasterid or s."nUserid" = nMasterid  or ls."nUserid" = nMasterid) and w."nBundledetailid" = nBundledetailid and false
	) select * from tbl where jsonb_array_length(id) > 0;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
