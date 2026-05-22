CREATE OR REPLACE FUNCTION public.et_fact_get_issue_links(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
   DECLARE jFSids jsonb;nMasterid uuid;

   BEGIN
   jFSids := parameter->>'jFSids';
   nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
   
       -- select * from "FMIssue"
       open ref1 for
          
        -- select * from "RIssueMaster"
        -- select * from "IssueCategory"
        select fi."nFSid",issue."nIid",fi."nFMIid",fi."nIssueid",issue."cColor",issue."cIName",fi."nImpactid",
           imp."cCodename" "cImpact",fi."nRelevanceid",rel."cCodename" "cRelevance" ,issue."nICid",ic."cCategory"
           from "FMIssue" fi
       join "RIssueMaster" issue on issue."nIid" = fi."nIssueid"
       left join "IssueCategory" ic on ic."nICid" = issue."nICid"
       left join "Codemaster" imp on imp."nCodeid" = fi."nImpactid"
       left join "Codemaster" rel on rel."nCodeid" = fi."nRelevanceid"
        where jFSids @> to_jsonb(fi."nFSid")
           order by fi."nFMIid";
        
        RETURN NEXT ref1;
        -- select * from "FMLinks" order by 1 desc
        
       open ref2 for   		 
             select b."nBundledetailid",fl."nFSid",fl."nFMLid",b."cTab",b."cFilename",
           "cExhibitno",fl."jLinktype",bm."cBundletag",fl."jOTexts"
            from "FMLinks" fl
       join "BundleDetail" b on b."nBundledetailid" = fl."nBundledetailid"
       left join "BundleMaster" bm on bm."nBundleid" = b."nBundleid"
        where jFSids @> to_jsonb(fl."nFSid");
        
        RETURN NEXT ref2;
   
   -- select * from "BundleMaster" limit 0
        
   END;
   
$function$
