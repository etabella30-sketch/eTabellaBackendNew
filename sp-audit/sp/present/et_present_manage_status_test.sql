CREATE OR REPLACE FUNCTION present.et_present_manage_status_test(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid  uuid;
    nPresentid uuid;
    cStatus    text;
    nTypeid    int;
    nCaseid    uuid;
BEGIN
    nMasterid  := (parameter ->> 'nMasterid')::uuid;
    nPresentid := (parameter ->> 'nPresentid')::uuid;
    cStatus    := parameter ->> 'cStatus';
    nTypeid    := (parameter ->> 'nTypeid')::int;
    nCaseid    := (parameter ->> 'nCaseid')::uuid;

    IF NOT EXISTS (
        SELECT 1 FROM present."PresentationMaster"
         WHERE "nTypeid" = nTypeid
           AND "cStatus" IN ('L','P')
           AND "nCaseid" = nCaseid
           AND "nPresentid" <> nPresentid
    ) THEN
        UPDATE present."PresentationMaster"
           SET "cStatus" = COALESCE(cStatus,'L')
         WHERE "nPresentid" = nPresentid;
        OPEN ref FOR SELECT 1 AS msg;
    ELSE
        OPEN ref FOR SELECT -1 AS msg, 'Another Presentation is Already Live!' AS value;
    END IF;

    RETURN ref;
END;
$function$
