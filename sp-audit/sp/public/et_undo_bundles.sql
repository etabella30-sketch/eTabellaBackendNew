CREATE OR REPLACE FUNCTION public.et_undo_bundles(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;
jFolders uuid[];jFiles uuid[];
jBnode jsonb; jBDnode jsonb;
type text;nBundleid uuid;nSectionid uuid;

BEGIN
 -- select * from et_copy_bundles('{"nMasterid":59,"jFolders":"{}","jFiles":"{328446}","nSectionid":94,"nBundleid":1342510,"type":"Copy"}','r');fetch all in "r"
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
type:= parameter ->>'type';
if(type = 'Copy') then 
	jFolders := parameter ->>'jFolders';
	jFiles := parameter ->>'jFiles';
else 
	jBnode := replace((parameter ->>'jFolders'),'\\','\');
	jBDnode := parameter ->>'jFiles';
end if;
nBundleid:= NULLIF(parameter ->>'nBundleid','')::uuid;
nSectionid:= NULLIF(parameter ->>'nSectionid','')::uuid;

	if(type ='Copy') then	
		delete from "BundleMaster" bm where bm."nBundleid" = any (jFolders);		
		delete from "BundleDetail" bd where bd."nBundledetailid" = any (jFiles);
		delete from "BDAttributes" bd where bd."nBundledetailid" = any (jFiles);
	end if;
	
	if(type ='Cut') then		
	
		update "BundleMaster" b set "nParentBundleid" = t[1]::uuid from jsonb_array_elements(jBnode) t where "nBundleid" = t[0]::uuid; 
		--jsonb_populate_recordset(null::record,jBnode) as t ("id" int,"pid" int) where "nBundleid" = id;
		update "BundleDetail" b set "nBundleid" = t[1]::uuid from jsonb_array_elements(jBDnode) t where "nBundledetailid" = t[0]::uuid;
	--	update "BundleDetail" b set "nBundleid" = pid from jsonb_populate_recordset(null::record,jBnode) as t ("id" int,"pid" int) where "nBundledetailid" = id; 				
	end if;

open ref for select 1 as msg,'file undo' as value;

 

RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
