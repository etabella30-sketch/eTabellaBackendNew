CREATE OR REPLACE FUNCTION public.et_insert_funlogs(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    fun_name text;fun_query text;fun_res text;
   

BEGIN
    fun_name := (parameter ->> 'cFunname');
	fun_query := (parameter ->> 'cQuery');
	fun_res := (parameter ->> 'cRes');
    
	insert into fun_logs (funname,fquery ,fres )
	select fun_name,fun_query,fun_res;
	open ref for select 1 msg, 'inserted' value1;
    RETURN ref;
END;
$function$
