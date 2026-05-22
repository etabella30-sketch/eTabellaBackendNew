CREATE OR REPLACE FUNCTION transcript.et_update_htmlpath(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare p_transid uuid;
cPath text; cPath4pg text;
BEGIN

	p_transid := parameter->>'cTransid';
	cPath := parameter->>'cPath';
	cPath4pg := parameter->>'cPath4pg';
	-- select * from transcript."Themes" order by 1 desc

	update transcript."Transcripts" set "cHtmlpath" =cPath ,"cHtmlpath4pg" = cPath4pg where "cTransid" = p_transid;
	
    OPEN ref FOR select 1 msg;
	

    RETURN ref;
END;
$function$
