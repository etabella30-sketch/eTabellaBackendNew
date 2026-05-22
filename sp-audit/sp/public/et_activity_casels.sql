CREATE OR REPLACE FUNCTION public.et_activity_casels(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;isAdmin boolean;
BEGIN
-- select * from et_activity_casels('{"nMasterid":367}','r')
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
-- select * from "CaseMaster"
select "isAdmin" into isAdmin from "UserMaster" where "nUserid" = nMasterid;
	
    OPEN ref1 FOR 
	select  c."nCaseid",c."cCasename",c."cCaseno",c."dUpdateDt" 
    FROM  "CaseMaster" c
	left join "TeamRelation" t on t."nCaseid" = c."nCaseid" and t."nUserid" = nMasterid
	where "isArchived" = false and case when isAdmin = true then true else t."nRoleid" = '2133ed3e-2878-4083-a597-eedd61307ac4'::uuid end
	group by c."nCaseid",c."cCasename",c."cCaseno",c."dUpdateDt"
	order by c."cCasename";	
		
    RETURN NEXT ref1;
    
	
END;
$function$
