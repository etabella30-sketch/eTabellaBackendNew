CREATE OR REPLACE FUNCTION public.et_combo_codemaster(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nCategoryid int;
BEGIN

nCategoryid := parameter ->>'nCategoryid';

/*
 select * from et_combo_codemaster('{"nCategoryid":"4-uuid-format"}','r1');FETCH All in "r1";
 
 select * From "UserMaster"
 select * From "CodeMaster"
 select * From "UserSetting"
 
*/

OPEN ref1 FOR 

 select "nCodeid" "nValue","cCodename" "cKey","jOther" ,"nSerialno"
 from "Codemaster" Where "nCategoryid" = nCategoryid 
 order by "nSerialno","cCodename";
 
RETURN NEXT ref1;
	 
END;
$function$
