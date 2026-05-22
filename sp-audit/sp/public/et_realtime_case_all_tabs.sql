CREATE OR REPLACE FUNCTION public.et_realtime_case_all_tabs(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
Declare nCaseid uuid;cCaseno text;nSesid uuid;
BEGIN
cCaseno := parameter ->>'cCaseno';
nSesid := NULLIF(parameter ->>'nSesid','')::uuid;

    -- select * from et_realtime_case_all_tabs('{"cCaseno":"11/11/11/11"}','r');fetch all in "r"
-- select * from et_realtime_case_all_tabs('{"cCaseno":"CASE NO. 15/2022-2"}','r');fetch all in "r"
-- select * from et_realtime_case_all_tabs('{"nSesid":251}','r');fetch all in "r"
-- select * from "RSessionMaster" where "nCaseid" = 1046

if(nSesid IS NOT NULL)then

    nCaseid = (select "nCaseid" from "RSessionMaster" where "nSesid" = nSesid);
    
else
    nCaseid = (select "nCaseid" from "CaseMaster" where upper("cCaseno") = upper(cCaseno) limit 1);
end if;

    open ref for
select distinct b."cTab"
        from "SectionMaster" j 
        join "BundleDetail" b on b."nSectionid" = j."nSectionid"
        where j."nCaseid" = nCaseid and nullif(b."cTab",'') is not null
    ;

    

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
