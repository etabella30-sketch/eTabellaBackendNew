CREATE OR REPLACE FUNCTION public.et_convert_status(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nID uuid;bIsconvert text;
BEGIN
bIsconvert := parameter->>'bIsconvert';
nID := NULLIF(parameter->>'nID','')::uuid;
-- select * from "BDAttributes" where "nBundledetailid" = 166767
update "BDAttributes" set "bIsconvert"= bIsconvert where "nBundledetailid" = nID;

open ref1 for select 1 msg;

RETURN NEXT ref1;
	 
END;
$function$
