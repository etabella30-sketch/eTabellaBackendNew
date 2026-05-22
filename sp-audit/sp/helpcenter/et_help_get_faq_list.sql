CREATE OR REPLACE FUNCTION helpcenter.et_help_get_faq_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; cQType text;

BEGIN
/*  select * from helpcenter.et_help_get_faq_list('{"nMasterid": "29", "cQType": "S"}','r');fetch all in "r"
	select * from helpcenter."FaqQuestion"
	select * from helpcenter."FaqAnswer"
*/

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
cQType := parameter ->>'cQType';

	open ref for
		select fq."nFaqid", fq."cQuestion", fa."cAnswer",fq."cQType" from helpcenter."FaqQuestion" fq 
		join helpcenter."FaqAnswer" fa on fq."nFaqid" = fa."nFaid"
		 where fq."cQType" = cQType;
 
 -- Return the cursor to the caller
 RETURN ref;    
END;

$function$
