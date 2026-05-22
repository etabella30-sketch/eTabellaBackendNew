CREATE OR REPLACE FUNCTION public.et_fact_get_links(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nFSid uuid; nMasterid uuid;
-- select * from ""FactMaster"" limit 0
-- select * from ""FMLinks"" order by 1 desc limit 1
-- select * from ""RIssueMaster"" order by 1 desc limit 1
-- update ""FactDetail"" f set ""nColorid"" = a.""colorid"" from ""Annotations"" a where a.""nFSid"" = f.""nFSid""

BEGIN
nFSid := NULLIF(parameter->>'nFSid','')::uuid;
nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;

	
	open ref for
   	
	 -- select * from ""FMIssue""
	select fl."nFSid",fl."nFMLid",b."cFilename",fl."jLinktype","cExhibitno"
		 from "FMLinks" fl
	join "BundleDetail" b on b."nBundledetailid" = fl."nBundledetailid"
	 where fl."nFSid"  = nFSid;
	 
	 
	 RETURN ref;
	 
END;
$function$
