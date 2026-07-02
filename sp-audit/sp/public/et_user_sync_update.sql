CREATE OR REPLACE FUNCTION public.et_user_sync_update(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;
declare cRaw text;
BEGIN

-- nMasterid comes from the socket handshake (nUserid). A malformed/test client
-- (e.g. nUserid='1') must NOT crash the sync — validate the uuid shape first and
-- no-op on anything that isn't a real uuid instead of raising invalid_text_representation.
cRaw := NULLIF(parameter ->>'nMasterid','');
IF cRaw IS NULL OR cRaw !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    OPEN ref1 FOR select 0 as msg;
    RETURN NEXT ref1;
    RETURN;
END IF;
nMasterid := cRaw::uuid;
/*
select * from et_signout ('{""nMasterid"":2,""cToken"":""234234"",""cJwt"":""fdffff"",""bResponce"":true}','r1');fetch all in ""r1"";
select * from ""UserMaster""  order by 1
*/

    update "UserMaster" set "dSyncdt" = now()
    where "nUserid" = nMasterid;

    
OPEN ref1 FOR 
select 1 as msg;    
        
    RETURN NEXT ref1;
    
    

     
END;
$function$
