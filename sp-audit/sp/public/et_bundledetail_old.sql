CREATE OR REPLACE FUNCTION public.et_bundledetail_old(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid            uuid;
    pageNumber           int;
    offsetCount          int;
    perPage              int     DEFAULT 30;
    nSectionid           uuid;
    nBundleid            uuid;
    last_nBundledetailid uuid;
    cFiletype            text;
    cSortby              text;
    cSorttype            text;
    sql_query            text;
    isAdmin              boolean DEFAULT false;
    cFoldertype          text;
BEGIN
    -- Parse parameters
    nMasterid            := (parameter ->> 'nMasterid')::uuid;
    pageNumber           := COALESCE((parameter ->> 'pageNumber')::int, 1);
    offsetCount          := (pageNumber - 1) * perPage;
    nBundleid            := (parameter ->> 'nBundleid')::uuid;
    nSectionid           := (parameter ->> 'nSectionid')::uuid;
    last_nBundledetailid := (parameter ->> 'last_nBundledetailid')::uuid;
    cFiletype            :=  parameter ->> 'cFiletype';
    cSortby              :=  COALESCE((parameter ->> 'cSortby'), 'ASC');
    cSorttype            :=  COALESCE((parameter ->> 'cSorttype'), 'cTab');

    SELECT "isAdmin"
      INTO isAdmin
      FROM "UserMaster"
     WHERE "nUserid" = nMasterid;

    sql_query := '
      /* … entire original SQL building logic … */
    ';

    OPEN ref1 FOR EXECUTE sql_query;
    RETURN NEXT ref1;
END;
$function$
