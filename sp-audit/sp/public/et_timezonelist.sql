CREATE OR REPLACE FUNCTION public.et_timezonelist(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid; nCaseid uuid; nUserid uuid;
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
/*
 select * from et_timezonelist('{"nMasterid":2,"nUserid" : 2,"nCaseid":22}','r1');FETCH All in "r1";
 
 select * From "UserMaster"
 select * From "CodeMaster"
 select * From "UserSetting"
 
*/
	
OPEN ref1 FOR 
 select "nCodeid" "nValue","cCodename" "cKey","jOther" 
 from "Codemaster" Where "nCategoryid" =1 
 order by "cCodename";
 
RETURN NEXT ref1;
	 
END;
$function$
