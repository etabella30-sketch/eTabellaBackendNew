Output format is unaligned.
CREATE OR REPLACE FUNCTION public.et_log_insert(parameter jsonb, OUT ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
 STRICT COST 1
AS $function$
DECLARE
  v_nLCatid      int;
  v_functionname text;
  v_logid        uuid;
  v_msg          text;
BEGIN
  RAISE NOTICE 'param=%', parameter;
  RAISE NOTICE 'nLCatid(raw)=%', parameter->>'nLCatid';
  RAISE NOTICE 'nMasterid(raw)=%', parameter->>'nMasterid';

  v_nLCatid := NULLIF(parameter->>'nLCatid','')::int;
  RAISE NOTICE 'v_nLCatid(after cast)=%', v_nLCatid;

  IF v_nLCatid IS NOT NULL THEN
    SELECT "function" INTO v_functionname
    FROM "LogCategory"
    WHERE "nLCatid" = v_nLCatid;

    RAISE NOTICE 'Resolved function name=%', v_functionname;

    IF v_functionname IS NULL THEN
      RAISE EXCEPTION 'Function not found for nLCatid %', v_nLCatid;
    END IF;

    -- IMPORTANT: capture the UUID returned by the inner function
    BEGIN
      EXECUTE format('SELECT %I($1::jsonb)', v_functionname)
        INTO v_logid
        USING parameter;

      RAISE NOTICE 'Returned nLogid=%', v_logid;

      OPEN ref FOR
        SELECT *
        FROM public."UserLog"
        WHERE "nLogid" = v_logid;

      RETURN;   -- (OUT ref)
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
      RAISE NOTICE 'Inner EXECUTE failed: %', v_msg;
      RAISE;
    END;

  ELSE
    RAISE NOTICE 'v_nLCatid is NULL, skipping function call.';
  END IF;

  OPEN ref FOR SELECT 1;
  RETURN;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.et_log_insert(parameter jsonb, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
 STRICT COST 1
AS $function$
DECLARE
    v_nLCatid int;
    v_functionname text := '';
BEGIN
    BEGIN
        v_nLCatid := (parameter->>'nLCatid')::int;

        IF v_nLCatid IS NOT NULL AND v_nLCatid::text <> '00000000-0000-0000-0000-000000000000' THEN
            SELECT "function" INTO v_functionname FROM "LogCategory" WHERE "nLCatid" = v_nLCatid;

            IF v_functionname IS NULL THEN
                RAISE EXCEPTION 'Function not found for nLCatid %', v_nLCatid;
            END IF;

            EXECUTE format('SELECT %I($1::jsonb)', v_functionname) USING parameter;
        END IF;

    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error occurred in et_log_insert: %', SQLERRM;
        -- You can optionally log the error to a table here if needed
    END;

    OPEN ref FOR SELECT 1;
    RETURN ref;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.et_signin(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid UUID;email text;password text;
BEGIN

nMasterid := (parameter ->>'nMasterid')::UUID;
email := parameter ->>'cEmail';

/*
select * from et_signin ('{"email":"rajendra@gmail.com","password":"1234"}','r1');fetch all in "r1";
select * from et_signin ('{"cEmail":"rp06438@gmail.com","password":"123"}','r1');fetch all in "r1";
select * from "UserMaster" 
*/

    
    OPEN ref1 FOR 
    select 1 as msg ,"nUserid","cJwt","cPassword","isAdmin" --,"isAdmin","cFname","cLname","cProfile" 
    from "UserMaster" where upper(trim("cEmail")) = upper(trim(email))  and "cStatus" = 'A'
    ;    
        
    RETURN NEXT ref1;
    
    

     
END;
$function$
;

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
$function$
;

CREATE OR REPLACE FUNCTION public.et_signout(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;
BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
/*
select * from et_signout ('{"nMasterid":2,"cToken":"234234","cJwt":"fdffff","bResponce":true}','r1');fetch all in "r1";
select * from "UserMaster"  order by 1
*/

	update "UserMaster" set "dLastoutdt" = now()
	where "nUserid" = nMasterid; 

	
OPEN ref1 FOR 
select 1 as msg;	
		
    RETURN NEXT ref1;
    
	

	 
END;
$function$
;

