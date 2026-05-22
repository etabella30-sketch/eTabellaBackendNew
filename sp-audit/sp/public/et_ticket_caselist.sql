CREATE OR REPLACE FUNCTION public.et_ticket_caselist(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;

	
    OPEN ref1 FOR
	select t."nCaseid",t."cCasename",t."cCaseno"
	From "CaseMaster" t 
	join "TeamRelation" tr on tr."nCaseid" = t."nCaseid" 
	where tr."nUserid" = nMasterid order by "cCasename";
	
    RETURN NEXT ref1;
    
	
	
	 
END;
$function$
