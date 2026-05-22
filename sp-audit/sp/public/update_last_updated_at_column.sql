CREATE OR REPLACE FUNCTION public.update_last_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.last_modified_at = NOW();
    RETURN NEW;
END;
$function$
