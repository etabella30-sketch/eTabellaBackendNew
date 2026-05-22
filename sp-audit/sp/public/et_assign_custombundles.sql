CREATE OR REPLACE FUNCTION public.et_assign_custombundles(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;jFiles jsonb;
type text;nBundleid uuid;nSectionid uuid;inserted_ids uuid[];row RECORD;inserted_bids uuid[];

BEGIN
 -- select * from et_assign_custombundles ('{""jFiles"":""[[528593,\""1-16\""]]"",""nSectionid"":865,""nBundleid"":1346042,""nMasterid"":59}','r1');fetch all in ""r1"";
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jFiles := parameter ->>'jFiles';
nBundleid := NULLIF(parameter ->>'nBundleid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
type := parameter ->>'type';

-- select now()

drop table if exists temp_bundledetail;
create temp table temp_bundledetail as
select distinct bd."nBundledetailid",bd."cPath",(file->>1)::text as "cPage"
from "BundleDetail" bd 
,jsonb_array_elements(jFiles) file where bd."nBundledetailid" = (file->>0)::uuid;

			  insert into "BDAssignment" ("nBundleid","nSectionid","nBundledetailid","cPage","nUserid")
			select nBundleid,nSectionid,bd."nBundledetailid",coalesce(t."cPage",bd."cPage"),nMasterid from temp_bundledetail t
			join "BundleDetail" bd on t."nBundledetailid" = bd."nBundledetailid";
	
	
open ref for select 1 as msg,'Assinged' as value,* from temp_bundledetail

;
 
-- select * from et_copy_bundles ('{""jFolders"":""{1687147}"",""jFiles"":""{}"",""type"":""Copy"",""nSectionid"":808,""nBundleid"":1687148,""nMasterid"":59}','r1');fetch all in ""r1"";
 
 

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
