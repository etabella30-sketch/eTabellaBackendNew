CREATE OR REPLACE FUNCTION public.et_admin_update_bundle_tab(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nUserid uuid;nBundledetailid uuid;bundle jsonb;
nBundleid uuid;nSectionid uuid;
first_tab text;
base_text text;
base_number int;
cTab text;
bisAutoassign boolean;
BEGIN

nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
bundle := parameter ->>'bundle';
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
cTab := parameter ->>'cTab';
bisAutoassign := parameter ->>'bisAutoassign';

if(bisAutoassign) then
with tbl as (
    select ROW_NUMBER() OVER (
        ORDER BY sorted_tab NULLS LAST,
            sorted_name
    ) AS serialno,
 "nBundledetailid" 
    from "BundleDetail" 
    where --case when nullif(nBundledetailid,'') is not null then "nBundledetailid" = nBundledetailid else true end 
    --and 
    "nSectionid" IS NOT NULL AND "nSectionid" = COALESCE(nSectionid, "nSectionid")
    and COALESCE("nBundleid",'00000000-0000-0000-0000-000000000000') = COALESCE(nBundleid, '00000000-0000-0000-0000-000000000000') and "cStatus" = 'C'
),sb as (
    select row_number() over (order by "serialno") as "nSerial","nBundledetailid" from tbl 
    where "serialno" >= (select "serialno" from tbl where "nBundledetailid" = nBundledetailid)
    
),tab as (
select *,case when coalesce(cTab,'') ='' then '' else ((case when cTab ~ '\.' then regexp_replace(cTab, '\.[^.]*$', '') || '.' else SUBSTRING(cTab, '^[A-Za-z]+') end) || CAST(CAST(SUBSTRING(cTab, '\d+$') AS INTEGER) + "nSerial" - 1 AS text)) end AS tab From sb    
) update "BundleDetail" b set "cTab" = t."tab" from tab t where t."nBundledetailid" = b."nBundledetailid"
    ;
else 
    update "BundleDetail" set "cTab" = cTab where "nBundledetailid" = nBundledetailid;
end if;
    

--  update "BundleDetail" b set "cTab" = t."cTab" from (select t.value->>0 "nBundledetailid",t.value->>1 "cTab" from jsonb_array_elements(bundle::jsonb) t) t where  b."nBundledetailid" = t."nBundledetailid"::uuid;
/**/
open ref for 
select 1 as msg,'Updated' as value,bundle;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
