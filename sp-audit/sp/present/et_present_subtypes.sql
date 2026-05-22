CREATE OR REPLACE FUNCTION present.et_present_subtypes(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE nMasterid uuid;nCaseid uuid;
nPresentid uuid;bIsHaveSchedules boolean default false; 

BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

/*
 select * from present.et_present_subtypes('{"nMasterid":2,"nCaseid":1079}','r');fetch all in "r"

select * from "Codemaster" order by 1 desc

select * From "PresentationMaster" order by 1 desc

*/
nPresentid := (select "nPresentid" 
					from present."PresentationMaster" p 
					join "Codemaster" c on c."nCodeid" = p."nSubtypeid" and (c."jOther"->>'type')::text = 'C' 
					where p."nCaseid" = nCaseid and p."nCreateid" = nMasterid and p."cStatus" in ('B','I') order by "nPresentid" desc limit 1);

if exists (
			select "nPresentid" 
					from present."PresentationMaster" p 
					join "Codemaster" c on c."nCodeid" = p."nSubtypeid" and (c."jOther"->>'type')::text = 'W' 
					where p."nCaseid" = nCaseid and p."nCreateid" = nMasterid and p."cStatus" in ('B','I') order by "nPresentid" desc limit 1
)then
bIsHaveSchedules := true;
end if;

	

	open ref for 
		select "nCodeid" "nValue","cCodename" "cKey","jOther",nPresentid as "nPresentid",bIsHaveSchedules as "bIsHaveSchedules"
		From "Codemaster" where "nCategoryid" = 19 order by "nSerialno";

    RETURN ref;
END;
$function$
