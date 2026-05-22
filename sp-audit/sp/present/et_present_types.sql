CREATE OR REPLACE FUNCTION present.et_present_types(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nMasterid uuid;

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
-- select * from present.et_present_types('{""nMasterid"":2}','r');fetch all in ""r""

	open ref for 
		select "nCodeid" "nValue","cCodename" "cKey","jOther"
		From "Codemaster" where "nCategoryid" = 18 order by "nSerialno";

    RETURN ref;
END;
$function$
