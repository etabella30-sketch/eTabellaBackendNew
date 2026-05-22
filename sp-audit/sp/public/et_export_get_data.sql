CREATE OR REPLACE FUNCTION public.et_export_get_data(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid;nExportid uuid;

BEGIN

/*
select * from public.et_export_get_data ('{"nExportid":"c2b709f2-6fb9-49d2-a609-3dbed95e9bf9","nMasterid":"3a168b69-1bb8-4c7e-881f-dff78a854f80"}','r1');fetch all in "r1";

*/

nExportid := NULLIF(parameter ->>'nExportid','')::uuid;
nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
--nUserid := 59;
open ref for 

select 
 m."nExportid",m."nUserid",m."cType",bd."nBundledetailid",d."nEDid",bd."cPath",
 m."bPagination",m."bDoc",m."bFact",m."bQfact",m."bCoverpg",m."bFitpg",
m."cDsize",m."cFsize",m."cQFsize",m."cOrientation",m."cPgsize",m."jFContact",m."jFIssue",m."jQFContact",m."jQFIssue",m."jPages",
 coalesce(f."allfacts",'[]'::jsonb) as allfacts,
 jsonb_agg(h) filter (where h.id is not null)  "highlights"
 ,case when jsonb_array_length(m."jPages") > 0 then false else true end "isAllpage" from "ExportMaster" m
join "ExportDetail" d on d."nExportid" = m."nExportid"
join "BundleDetail" bd on bd."nBundledetailid" = d."nBDid"
left join lateral (
select jsonb_agg(distinct fs."nFSid") as "allfacts"
from "FactMaster" fs
left join "FMIssue" fi on fi."nFSid"  = fs."nFSid" 
left join "FMContact" fc on fc."nFSid"  = fs."nFSid"
where "nCreateId" = nUserid and  fs."nBundledetailid" = bd."nBundledetailid"
	and case when jsonb_array_length(m."jQFIssue") > 0 then (case fs."cFType" when  'QF' then m."jQFIssue" @> to_jsonb(fi."nIssueid"::text) when 'F' then   m."jFIssue" @> to_jsonb(fi."nIssueid"::text) end ) else true end 
	and case when jsonb_array_length(m."jQFContact") > 0 then (case fs."cFType" when  'QF' then m."jQFContact" @> to_jsonb(fc."nContactid"::text) when 'F' then   m."jFContact" @> to_jsonb(fc."nContactid"::text) end ) else true end 
group by "nBundledetailid"
) f on true
left join lateral(
with tbl as (
	select distinct f."nFSid" as id,f."nFSid",null::uuid as "nDocid",coalesce("cFType",'F') as "linktype"
	from "FactMaster" f
	left join "FMIssue" fi on fi."nFSid"  = f."nFSid"
	left join "FMContact" fc on fc."nFSid"  = f."nFSid"
	where f."nUserid" = nUserid and f."nBundledetailid" = bd."nBundledetailid" 
	and (case when jsonb_array_length(m."jQFIssue") > 0 then (case f."cFType" when  'QF' then m."jQFIssue" @> to_jsonb(fi."nIssueid"::text) when 'F' then   m."jFIssue" @> to_jsonb(fi."nIssueid"::text) end ) else true end 
	or case when jsonb_array_length(m."jQFContact") > 0 then (case f."cFType" when  'QF' then m."jQFContact" @> to_jsonb(fc."nContactid"::text) when 'F' then   m."jFContact" @> to_jsonb(fc."nContactid"::text) end ) else true end)
	union all
	select "nDocid" as id ,null::uuid as  "nFSid", "nDocid",'D' as "linktype"
	from "DocMaster" d
	where d."nUserid" = nUserid and d."nBundledetailid" = bd."nBundledetailid"
) select t.id,a."nAId" ,a."uuid",a."type",a."rects",a."lines",a."width",a."color",a."page",a."nFSid",a."nDocid",t."linktype"
	from tbl t
	join annotations a on a."nFSid" = t."nFSid" or a."nDocid" = t."nDocid" 
) h on true
where m."nExportid" = nExportid
group by  m."nExportid",m."nUserid",bd."nBundledetailid",d."nEDid",bd."cPath", m."bPagination",m."bDoc",m."bFact",m."bQfact",m."bCoverpg",m."bFitpg",
m."cDsize",m."cFsize",m."cQFsize",m."cOrientation",m."cPgsize",m."jFContact",m."jFIssue",m."jQFContact",m."jQFIssue",m."jPages",
f."allfacts";

-- select * from highlights

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
