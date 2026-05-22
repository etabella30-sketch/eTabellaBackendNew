CREATE OR REPLACE FUNCTION public.et_activity_session(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nCaseid uuid;isAdmin boolean;
BEGIN
-- select * from et_activity_casels('{"nMasterid":"367-uuid-format"}','r');fetch all in "r"
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

    
    OPEN ref1 FOR 
    select rs."nSesid",rs."cName","dStartDt"
    FROM "RSessionMaster" rs
    where "nCaseid" = nCaseid
    order by rs."cName";    
        
    RETURN NEXT ref1;
    
    
END;
$function$
