CREATE OR REPLACE FUNCTION public.et_admin_case_tickets(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;  -- was integer :contentReference[oaicite:6]{index=6}:contentReference[oaicite:7]{index=7}
    nCaseid   uuid;  -- was int     :contentReference[oaicite:8]{index=8}:contentReference[oaicite:9]{index=9}
BEGIN
    nMasterid := (parameter ->> 'nMasterid')::uuid;
    nCaseid   := (parameter ->> 'nCaseid')::uuid;

    /*
    select * from et_admin_case_tickets('{ "nCaseid":22, "nMasterid":2 }','r');
    fetch all in "r";
    select * from "TicketMaster";
    alter table "TicketMaster" add column "isCleared" boolean default false;
    */
    OPEN ref1 FOR
        SELECT
            t."nTicketid",
            t."nCaseid",
            t."cSession",
            t."cDesc",
            t."cImgname",
            t."cImgpath",
            t."cStatus",
            t."dCreateDt",
            um."cFname",
            um."cLname"
        FROM "TicketMaster" t
        JOIN "UserMaster" um
          ON um."nUserid" = t."nCreateId"
        WHERE t."nCaseid"  = nCaseid
          AND t."isCleared" = false
        ORDER BY "cStatus";

    RETURN NEXT ref1;
END;
$function$
