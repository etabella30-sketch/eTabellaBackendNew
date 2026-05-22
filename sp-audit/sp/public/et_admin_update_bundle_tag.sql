CREATE OR REPLACE FUNCTION public.et_admin_update_bundle_tag(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid;nBundleid uuid;cBundletag text;
bisAutoassign boolean;

BEGIN

nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;
cBundletag := parameter ->>'cBundletag';
bisAutoassign:= parameter ->>'bisAutoassign';
/*
 select * from et_admin_update_bundle_tag ('{"cBundletag":"V2- test","nMasterid":2}','r1');fetch all in "r1";

select * from "BundleMaster" where "nBundleid" = 2503
select * from "BundleDetail"
select * from "BDAttributes"

*/

update "BundleMaster" set "cBundletag" = cBundletag where "nBundleid" = nBundleid;

if(bisAutoassign) then

drop table if exists temp_bundlerecord;
create temp table temp_bundlerecord as
SELECT  * FROM get_sorted_hierarchy_bundle(nBundleid);

	update "BundleMaster" b set "cBundletag" = new_tag from 
		     (WITH RECURSIVE bdl_tree AS (
		  SELECT  "cBundletag" new_tag,"nBundleid","nParentBundleid"
			FROM "temp_bundlerecord" c where "nBundleid" = nBundleid 
	        UNION ALL
	        -- Recursive selection for child folders
	        SELECT case when c.level = 2 then 
			case when CAST(NULLIF(SPLIT_PART(SUBSTRING(new_tag FROM '[0-9\.]+'), '.', 1),'') AS bigint) is null then (new_tag || c."nSerial")  else (new_tag || '.'  || c."nSerial") end
			
			else (new_tag || '.'  || c."nSerial") end,c."nBundleid",c."nParentBundleid"
			FROM "temp_bundlerecord" c
	        JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"
		) select * from bdl_tree) t where b."nBundleid" = t."nBundleid";
-- select * from et_admin_update_bundle_tag ('{"nBundleid":2503,"cBundletag":"P","nMasterid":497}','r1');fetch all in "r1";
	 update "BundleDetail" b set "cTab" =case when CAST(NULLIF(SPLIT_PART(SUBSTRING(bm."cBundletag" FROM '[0-9\.]+'), '.', 1),'') AS bigint) is null then (bm."cBundletag" || f."nSerial")  else (bm."cBundletag" || '.' || f."nSerial") end from temp_bundlerecord t
	join "BundleMaster" bm on bm."nBundleid" = t."nBundleid"
	join get_sorted_hierarchy_file(t."nBundleid") f on bm."nBundleid" = t."nBundleid"
	where f."nBundledetailid" = b."nBundledetailid";

--	drop table if exists temp_bundlerecord;
/* 	
	else
	update "BundleDetail" b set "cTab" = case when CAST(NULLIF(SPLIT_PART(SUBSTRING(bm."cBundletag" FROM '[0-9\.]+'), '.', 1),'') AS bigint) is null then (bm."cBundletag" || "nSerial")  else (bm."cBundletag" || '.' || "nSerial") end  from get_sorted_hierarchy_file(nBundleid) t
	join "BundleMaster" bm on bm."nBundleid" = t."nBundleid"
	where t."nBundledetailid" = b."nBundledetailid";
	*/
end if;

open ref for 
select 1 as msg,'Updated' as value;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
