CREATE OR REPLACE FUNCTION public.get_livesession_bycase(ncaseid uuid)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
       result uuid;
	
BEGIN

	-- select  get_livesession_bycase('81765ff6-8040-4081-af51-be37c588727d')

select "nSesid" into result 
From "RSessionMaster" 
where "nCaseid" = ncaseid and "cStatus" = 'R' and "dDelDt" is null order by "dStartDt" desc limit 1;

-- select get_livesession()

    RETURN result;

END;
$function$
