CREATE OR REPLACE FUNCTION public.et_web_link_list(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE 
    jWebids jsonb;
    nMasterid uuid;
    ZeroUUID uuid := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
    -- Apply P-1: Blank string → NULL conversion
    nMasterid := NULLIF(parameter->>'nMasterid', '')::uuid;
    jWebids := parameter->>'jWebids';

    -- Apply P-7: JSON membership tests with UUIDs
    open ref1 for 
        select distinct w."nWebid", wd."cUrl", wd."cTitle", "cNote", "cType", "jLinktype", "cImg", "cFavicon", w."nUserid"
        from "WebMaster" w 
        left join "WebDetail" wd on wd."nWebid" = w."nWebid"
        LEFT join "WMShared" ws on ws."nWebid" = w."nWebid"
        where (w."nWebid")::text IN (SELECT jsonb_array_elements_text(jWebids));
          -- and (w."nUserid" = nMasterid or ws."nUserid" = nMasterid);

    RETURN next ref1;

    open ref2 for 
        select distinct ws."nWebid", ws."nUserid", "cFname", "cLname", "cProfile"
        from "WMShared" ws 
        join "UserMaster" u on u."nUserid" = ws."nUserid"
        where (ws."nWebid")::text IN (SELECT jsonb_array_elements_text(jWebids));
    
    RETURN next ref2;
END;
$function$
