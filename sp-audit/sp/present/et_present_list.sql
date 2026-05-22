CREATE OR REPLACE FUNCTION present.et_present_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;
nCaseid uuid;
nTypeid int;nSubtypeid int;

BEGIN
-- select * from present.et_present_list ('{""nCaseid"":1126,""nTypeid"":217,""nSubtypeid"":214,""nMasterid"":367}','r1');fetch all in ""r1"";
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nTypeid := parameter ->>'nTypeid';
nSubtypeid:= parameter ->>'nSubtypeid';

	
open ref for
select   ptm."cName",cm."cCodename"  "cType", max("dCreateDt") "dCreateDt", JSON_AGG(distinct pm."nUserid") AS "jUsers"
	FROM present."PresentationMaster" ptm
	JOIN present."PMUser" pm ON ptm."nPresentid" = pm."nPresentid"
	join "Codemaster" cm on cm."nCodeid" = ptm."nTypeid"
	WHERE ptm."nCaseid" = nCaseid and  ptm."nCreateid" =  nMasterid 
	and ptm."nTypeid" = nTypeid and case when nSubtypeid > 0 then ptm."nSubtypeid" = nSubtypeid else true end
	-- (
	-- ptm."nTypeid" = (select cm."nCodeid" from "Codemaster" cm where cm."jOther"->>'type' = 'P'AND cm."nCategoryid" = 18)
	-- or
	-- ptm."nSubtypeid" = ( select cm."nCodeid" from "Codemaster" cm where cm."jOther"->>'type' = 'F' AND cm."nCategoryid" =  19)
	-- )
	GROUP BY 
	    ptm."cName", cm."cCodename"
	order by "cName" asc;
 
 -- Return the cursor to the caller
 RETURN ref;    
END;

$function$
