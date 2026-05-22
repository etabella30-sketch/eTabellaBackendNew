CREATE OR REPLACE FUNCTION realtime.et_combo_codemaster(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nCategoryid int;
BEGIN
  nCategoryid := parameter->>'nCategoryid';
  OPEN ref1 FOR
    select "nCodeid" "nValue", "cCodename" "cKey", "jOther", "nSerialno"
    from public."Codemaster" WHERE "nCategoryid" = nCategoryid
    order by "nSerialno", "cCodename";
  RETURN NEXT ref1;
END;
$function$
