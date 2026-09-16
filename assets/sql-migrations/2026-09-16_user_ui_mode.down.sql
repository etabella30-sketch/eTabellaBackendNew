-- 2026-09-16_user_ui_mode.down.sql
-- Restores the pre-migration SP bodies (as in sp-audit/sp/public on
-- 2026-09-16), drops et_user_uimode_set and the two UserMaster columns.

-- Safety guard: refuse to run against prod by accident (apply to dev etabella_tech_uuid first).
DO $guard$
BEGIN
    IF current_database() = 'etabella.com.uuid' THEN
        RAISE EXCEPTION 'Refusing to run on prod database % - apply via the release runbook', current_database();
    END IF;
END
$guard$;

BEGIN;

DROP FUNCTION IF EXISTS public.et_user_uimode_set(json, refcursor);

CREATE OR REPLACE FUNCTION public.et_signin_responce(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;cToken text;cJwt text;bResponce boolean;
BEGIN

nMasterid := (nullif(parameter ->>'nMasterid',''))::uuid;
cToken := parameter ->>'cToken';
cJwt := parameter ->>'cJwt';
bResponce := parameter ->>'bResponce';
/*
select * from et_signin_responce ('{"nMasterid":2,"cToken":"234234","cJwt":"fdffff","bResponce":true}','r1');fetch all in "r1";
select * from "UserMaster"  order by 1
*/

if(bResponce=true)then

	update "UserMaster" set "dLastlogindt" = now(),"cToken" = cToken,"cJwt" = cJwt
	where "nUserid" = nMasterid;
end if;



OPEN ref1 FOR
	select "nUserid","cEmail","cFname","cLname","cProfile","isAdmin" from "UserMaster" where "nUserid" = nMasterid
;


    RETURN NEXT ref1;




END;
$function$;

CREATE OR REPLACE FUNCTION public.et_userdetail(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
/*
select * from et_userdetail ('{"nMasterid":"0"}','r1');fetch all in "r1";
select * from "UserMaster"  order by 1
*/


OPEN ref1 FOR
	select 1 as msg,'User information' as "value","nUserid","cEmail","cFname","cLname","cProfile","isAdmin","cJwt" as "token" from "UserMaster" where "nUserid" = nMasterid
;

    RETURN NEXT ref1;




END;
$function$;

ALTER TABLE "UserMaster" DROP CONSTRAINT IF EXISTS "UserMaster_cUIMode_check";
ALTER TABLE "UserMaster"
    DROP COLUMN IF EXISTS "cUIMode",
    DROP COLUMN IF EXISTS "dUIModeDt";

COMMIT;
