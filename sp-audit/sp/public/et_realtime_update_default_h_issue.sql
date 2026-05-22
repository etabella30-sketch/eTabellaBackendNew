CREATE OR REPLACE FUNCTION public.et_realtime_update_default_h_issue(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nSessionid uuid;nUserid uuid;cDefHIssues jsonb;nLID uuid;jHids jsonb;nSDid uuid;
BEGIN
nSessionid := NULLIF(parameter->>'nSessionid','')::uuid;
nUserid := NULLIF(parameter->>'nUserid','')::uuid;
cDefHIssues := parameter->>'cDefHIssues';
nLID := NULLIF(parameter->>'nLID','')::uuid;
jHids := parameter->>'jHids';

/*

 select * from public.et_realtime_update_default_h_issue ('{"nSessionid":"05f03702-dad9-48c1-bb47-2e5ed02d4dc8","nUserid":"3a168b69-1bb8-4c7e-881f-dff78a854f80","nCaseid":"53b4e221-421a-4950-8176-60bd89db8e9f","cDefHIssues":[{"nIid":"c0d4e4ef-2bf9-4b02-8d4a-e77d387785ff","serialno":"1"},{"nIid":"c90f35a0-bd0d-4346-8e01-5f1cb1fad4fd","serialno":"2"}],"nLID":"c0d4e4ef-2bf9-4b02-8d4a-e77d387785ff","jHids":"[\"c3a946cb-32c5-4d28-8df1-b571726f3627\",\"82288892-cd67-435c-ab79-a33948270e7f\"]"}','r1');fetch all in "r1";

 
*/

    if(jsonb_array_length(jHids)>0)then 
    
        delete from "RHighlightMapid" where jHids @> to_jsonb("nHid");
    
        INSERT INTO "RHighlightMapid" ("nHid", "nIid")    
        SELECT f::uuid, i."nIid" from jsonb_array_elements_text(jHids) f, jsonb_to_recordset(cDefHIssues) as i("nIid" uuid);

        update "RHighlights" set "nLID" = nLID where jHids @> to_jsonb("nHid");

    else

        nSDid = (select "nSDid" from "RSessionDetail" where "nSesid" = nSessionid and "nUserid" = nUserid limit 1);

        if (nSDid is null) then --coalesce(nSDid,0) = 0
            insert into "RSessionDetail"("nSesid","nUserid","cDefHIssues","nLID")
            values(nSessionid,nUserid,cDefHIssues,nLID)
            returning "nSDid" into nSDid;    
        else
            update "RSessionDetail" set "cDefHIssues" = cDefHIssues,"nLID" = nLID
            where "nSDid" = nSDid;
        end if;
    end if;
    
    OPEN ref FOR
        select 1 msg,'Highlight Issues Updated' message,nSessionid,nSessionid s1,nUserid;

    RETURN ref;
END;
$function$
