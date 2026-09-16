-- 2026-09-16_user_ui_mode.up.sql
--
-- Per-user UI mode: Essential (core tools) or Advanced (everything). A UI
-- PREFERENCE, not a permission — authorization is unchanged; the client hides
-- Advanced-only tools (canvas, adjacent docs, Full Facts / DocLinks, page
-- scopes, snapshots, analysis cards) for Essential users.
--
-- Two columns on UserMaster:
--   "cUIMode"   varchar(1) NOT NULL DEFAULT 'E'   - 'E' Essential / 'A' Advanced
--   "dUIModeDt" timestamp                          - last explicit switch (NULL = never)
--
-- Backfill (one-shot, only when the column is CREATED): every account that
-- exists today is set to 'A' so nobody loses tools on deploy day; accounts
-- created afterwards start on the column default 'E'.
--
-- SP patches (bodies based on sp-audit/sp/public, live on etabella_tech_uuid):
--   et_signin_responce  - the /auth/signin userDetail row now carries "cUIMode".
--   et_userdetail       - /auth/validate + /auth/userinfo row now carries "cUIMode".
-- New SP:
--   et_user_uimode_set  - POST coreapi team-setup/uimode. Updates ONLY the
--     caller's own row (nMasterid comes from the JWT middleware, never the
--     client); rejects anything but 'E' / 'A'.
--
-- coreapi gains the route + DTO (forbidNonWhitelisted) -> restart coreapi after
-- applying. authapi needs no restart (the SP row passes through untouched).

-- Safety guard: refuse to run against prod by accident (apply to dev etabella_tech_uuid first).
DO $guard$
BEGIN
    IF current_database() = 'etabella.com.uuid' THEN
        RAISE EXCEPTION 'Refusing to run on prod database % - apply via the release runbook', current_database();
    END IF;
END
$guard$;

BEGIN;

--------------------------------------------------------------------------
-- Columns + one-shot backfill
--------------------------------------------------------------------------
DO $cols$
DECLARE
    fresh boolean;
BEGIN
    SELECT NOT EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'UserMaster' AND column_name = 'cUIMode'
    ) INTO fresh;

    IF fresh THEN
        ALTER TABLE "UserMaster"
            ADD COLUMN "cUIMode" character varying(1) NOT NULL DEFAULT 'E',
            ADD COLUMN "dUIModeDt" timestamp without time zone NULL;

        ALTER TABLE "UserMaster"
            ADD CONSTRAINT "UserMaster_cUIMode_check" CHECK ("cUIMode" IN ('E', 'A'));

        -- D1: existing accounts keep every tool they have today.
        UPDATE "UserMaster" SET "cUIMode" = 'A';
    END IF;
END
$cols$;

COMMENT ON COLUMN "UserMaster"."cUIMode" IS
  'UI mode preference: E = Essential (core tools), A = Advanced (all tools). Not a permission.';
COMMENT ON COLUMN "UserMaster"."dUIModeDt" IS
  'When the user last switched cUIMode themselves. NULL = never switched (default / backfill).';

--------------------------------------------------------------------------
-- et_signin_responce: /auth/signin userDetail row + "cUIMode"
--------------------------------------------------------------------------
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
	select "nUserid","cEmail","cFname","cLname","cProfile","isAdmin","cUIMode" from "UserMaster" where "nUserid" = nMasterid
;


    RETURN NEXT ref1;




END;
$function$;

--------------------------------------------------------------------------
-- et_userdetail: /auth/validate + /auth/userinfo row + "cUIMode"
--------------------------------------------------------------------------
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
	select 1 as msg,'User information' as "value","nUserid","cEmail","cFname","cLname","cProfile","isAdmin","cUIMode","cJwt" as "token" from "UserMaster" where "nUserid" = nMasterid
;

    RETURN NEXT ref1;




END;
$function$;

--------------------------------------------------------------------------
-- et_user_uimode_set: the caller switches their OWN mode
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_user_uimode_set(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;
    v_mode    text;
    nRows     integer;
BEGIN
    nMasterid := NULLIF(parameter ->> 'nMasterid', '')::uuid;
    v_mode    := upper(trim(coalesce(parameter ->> 'cUIMode', '')));

    IF nMasterid IS NULL THEN
        OPEN ref FOR SELECT -1 AS msg, 'Not signed in' AS value, NULL::text AS "cUIMode";
        RETURN ref;
    END IF;

    IF v_mode NOT IN ('E', 'A') THEN
        OPEN ref FOR SELECT -1 AS msg, 'Unknown UI mode' AS value, NULL::text AS "cUIMode";
        RETURN ref;
    END IF;

    UPDATE "UserMaster"
       SET "cUIMode"   = v_mode,
           "dUIModeDt" = now(),
           "dUpdateDt" = now(),
           "nUpdateId" = nMasterid
     WHERE "nUserid" = nMasterid;
    GET DIAGNOSTICS nRows = ROW_COUNT;

    IF nRows = 0 THEN
        OPEN ref FOR SELECT -1 AS msg, 'User not found' AS value, NULL::text AS "cUIMode";
        RETURN ref;
    END IF;

    OPEN ref FOR SELECT 1 AS msg, 'UI mode updated' AS value, v_mode AS "cUIMode";
    RETURN ref;
END;
$function$;

COMMIT;
