CREATE OR REPLACE FUNCTION public.et_assign_tag_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;jBDids jsonb;
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jBDids := parameter ->>'jBDids';
-- select * from "TagMaster"
open ref for select c."nTagid",c."cTag",c."cClr",c."cDesc",
case when count(sb."nTagid") > 0 then jsonb_agg(sb) else '[]'::jsonb end as "sublist"
from "BDTags" bc
join "TagMaster" c on c."nTagid" = bc."nTagid"
left join lateral (
select "nTagid","cTag","cClr","cDesc","nParenttagid" from "TagMaster" t where t."nParenttagid" = c."nTagid"
) sb on true
where jBDids @> to_jsonb(bc."nBundledetailid"::text) and bc."nUserid" = nMasterid
group by c."nTagid",c."cTag",c."cClr",c."cDesc";
 
RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
