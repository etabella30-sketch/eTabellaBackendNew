-- Fact Workspace — persisted saved views.
--
-- A "view" is a named display over the case's fact pool: its filter plus the
-- whole screen state (columns + order, per-column filters, sort, grouping,
-- view type, timeline period). Until now the workspace kept these in memory,
-- so they died on refresh.
--
-- Ownership: a view belongs to the user who saved it and is PRIVATE by
-- default; `bShared` publishes it to everyone on the case. Updates and deletes
-- are owner-only, so a shared view can't be rewritten by a reader.
--
-- Touches: new table "WorkspaceView", new et_workspace_view_{list,save,delete}.
--
-- Apply to dev `etabella_tech_uuid` first; prod `etabella.com.uuid` at deploy.
--
-- ---------------------------------------------------------------------------
-- AUTHORIZATION NOTE — read before editing the list SP.
--
-- `nCaseid` arrives from the client and is NOT validated anywhere upstream:
-- the controller takes it straight off the query string. `nMasterid` IS
-- trustworthy (the JWT middleware overwrites req.query/req.body.nMasterid from
-- the verified token before the DTO is built) but it is NOT guaranteed
-- non-null, because `IsItUUID()` skips validation on a falsy value.
--
-- So these three functions are the ONLY authorization on this route. Two rules
-- follow, and both are easy to undo by accident:
--   1. Never write `nMasterid IS NULL OR ...` into a visibility predicate. A
--      null caller must see NOTHING, not everything.
--   2. The shared branch must check case membership. Without it, any
--      authenticated user can read another case's shared views just by
--      passing that case's id.
-- ---------------------------------------------------------------------------

BEGIN;

-- The migration targets these two databases and nothing else.
DO $guard$
BEGIN
    IF current_database() NOT IN ('etabella_tech_uuid', 'etabella.com.uuid') THEN
        RAISE EXCEPTION 'Wrong database: % — this migration targets etabella_tech_uuid (dev) / etabella.com.uuid (prod)', current_database();
    END IF;
END $guard$;

--------------------------------------------------------------------------
-- 1. The table
--
-- Everything here is schema-qualified on purpose: the connecting role's
-- search_path is `sym, public`, so an unqualified CREATE TABLE would put
-- "WorkspaceView" in the SymmetricDS schema.
--------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."WorkspaceView" (
  "nWVid"      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "nCaseid"    uuid NOT NULL,
  -- The OWNER. `nUserid` is the stored owner column across this schema;
  -- `nMasterid` is only ever the payload key for "the calling user".
  "nUserid"    uuid NOT NULL,
  "cName"      text NOT NULL,
  -- Scope of the view: 'fact' today; the other workspace scopes are not yet
  -- backend-backed, but the column keeps them addressable.
  "cEntity"    text NOT NULL DEFAULT 'fact',
  -- 'table' | 'cards' | 'timeline' | 'overview' | …
  "cViewType"  text NOT NULL DEFAULT 'table',
  -- View-level filter ({assigned, status, cat, issue, side}).
  "jFilter"    jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Everything else on screen: {table:{cols,filters,sort,groupBy}, scope}.
  "jState"     jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- NOT NULL matters on both flags: the client tests `=== true`, so a NULL
  -- would silently un-share a shared view.
  "bShared"    boolean NOT NULL DEFAULT false,
  -- Soft delete, following "SavedSearch" (the direct sibling: per-user,
  -- per-case, named, with its own list/save/delete trio). 'C' live, 'D' gone.
  "cStatus"    character(1) NOT NULL DEFAULT 'C',
  -- No trigger maintains dUpdateDt in this schema; every SP sets it by hand.
  "dCreateDt"  timestamptz NOT NULL DEFAULT now(),
  "dUpdateDt"  timestamptz NOT NULL DEFAULT now()
);

-- The list predicate is an OR of an owner branch and a shared branch; one
-- index for each.
CREATE INDEX IF NOT EXISTS ix_workspaceview_case_user
  ON public."WorkspaceView" USING btree ("nCaseid", "nUserid", "cStatus");
CREATE INDEX IF NOT EXISTS ix_workspaceview_case_shared
  ON public."WorkspaceView" USING btree ("nCaseid", "cStatus", "bShared");

--------------------------------------------------------------------------
-- 2. list — the caller's own views + views shared on a case they are on
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_workspace_view_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
  nMasterid uuid;
  nCaseid   uuid;
BEGIN
  nMasterid := NULLIF(parameter ->> 'nMasterid', '')::uuid;
  nCaseid   := NULLIF(parameter ->> 'nCaseid', '')::uuid;

  -- Deliberately no RAISE on a missing parameter. db.service.ts turns any
  -- exception into {success:false}, which the client renders as an empty
  -- sidebar — indistinguishable from "no views", but noisy in the query log.
  -- The predicate below is null-safe, so a missing parameter returns 0 rows.
  OPEN ref FOR
    SELECT
      v."nWVid",
      v."nCaseid",
      v."nUserid",
      v."cName",
      v."cEntity",
      v."cViewType",
      v."jFilter",
      v."jState",
      v."bShared",
      -- IS TRUE, so this is a real boolean and never NULL: the client treats
      -- `bIsOwner !== false` as "mine", and would offer a delete that the
      -- delete SP then refuses.
      (v."nUserid" = nMasterid) IS TRUE AS "bIsOwner",
      btrim(COALESCE(um."cFname", '') || ' ' || COALESCE(um."cLname", '')) AS "cCreateby",
      v."dCreateDt",
      v."dUpdateDt"
    FROM public."WorkspaceView" v
    LEFT JOIN public."UserMaster" um ON um."nUserid" = v."nUserid"
    WHERE v."nCaseid" = nCaseid
      AND v."cStatus" = 'C'
      AND (
            -- My own views. Self-scoped, so a null caller matches nothing.
            v."nUserid" = nMasterid
         OR (
              -- Shared with the case — and only to someone actually on it.
              v."bShared" = true
              AND EXISTS (
                    SELECT 1
                    FROM public."TeamRelation" tr
                    WHERE tr."nCaseid" = v."nCaseid"
                      AND tr."nUserid" = nMasterid
                      AND tr."cStatus" = 'A'
                  )
            )
          )
    -- The client re-sorts by name after every save; without this the sidebar
    -- visibly reshuffles the first time a view is saved.
    ORDER BY v."cName" ASC, v."nWVid" ASC;

  RETURN ref;
END;
$function$;

ALTER FUNCTION public.et_workspace_view_list(parameter json, ref refcursor) OWNER TO vultradmin;

--------------------------------------------------------------------------
-- 3. save — insert when nWVid is absent, else update; owner-only
--
-- Returns THE SAVED ROW, not {msg, value}. The client reads nWVid off the
-- response and rolls its optimistic insert back when it is missing — so a
-- bare {msg:1} makes a successful save report "could not be saved" while the
-- row is in fact persisted, and the user retries into duplicates.
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_workspace_view_save(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
  nMasterid uuid;
  nCaseid   uuid;
  nWVid     uuid;
  cName     text;
  cEntity   text;
  cViewType text;
  jFilter   jsonb;
  jState    jsonb;
  bShared   boolean;
  vOwner    uuid;
  vId       uuid;
BEGIN
  nMasterid := NULLIF(parameter ->> 'nMasterid', '')::uuid;
  nCaseid   := NULLIF(parameter ->> 'nCaseid', '')::uuid;
  nWVid     := NULLIF(parameter ->> 'nWVid', '')::uuid;
  cName     := NULLIF(btrim(parameter ->> 'cName'), '');
  cEntity   := COALESCE(NULLIF(parameter ->> 'cEntity', ''), 'fact');
  cViewType := COALESCE(NULLIF(parameter ->> 'cViewType', ''), 'table');
  -- NULLIF before the cast: ''::jsonb raises, and the query builder sends ''
  -- for an absent key.
  jFilter   := COALESCE(NULLIF(parameter ->> 'jFilter', '')::jsonb, '{}'::jsonb);
  jState    := COALESCE(NULLIF(parameter ->> 'jState', '')::jsonb, '{}'::jsonb);
  bShared   := COALESCE((parameter ->> 'bShared')::boolean, false);

  -- Both must be OBJECTS. The client's reader rejects an array and yields {},
  -- which would open the view unfiltered over the whole pool under a name
  -- that promises a narrowing.
  IF jsonb_typeof(jFilter) IS DISTINCT FROM 'object' THEN jFilter := '{}'::jsonb; END IF;
  IF jsonb_typeof(jState)  IS DISTINCT FROM 'object' THEN jState  := '{}'::jsonb; END IF;

  IF nMasterid IS NULL OR nCaseid IS NULL OR cName IS NULL THEN
    OPEN ref FOR SELECT -1 AS msg, 'nCaseid, nMasterid and cName are required' AS value;
    RETURN ref;
  END IF;

  -- `nCaseid` is client-supplied and unchecked upstream: without this gate any
  -- authenticated user could plant a view in any case.
  IF NOT EXISTS (
        SELECT 1
        FROM public."TeamRelation" tr
        WHERE tr."nCaseid" = nCaseid
          AND tr."nUserid" = nMasterid
          AND tr."cStatus" = 'A'
      ) THEN
    OPEN ref FOR SELECT -1 AS msg, 'You do not have a permission for this case' AS value;
    RETURN ref;
  END IF;

  IF nWVid IS NOT NULL THEN
    SELECT "nUserid" INTO vOwner
    FROM public."WorkspaceView"
    WHERE "nWVid" = nWVid
      AND "nCaseid" = nCaseid
      AND "cStatus" = 'C';

    -- Not mine — someone else's shared view, or gone, or a different case.
    -- A shared view stays the author's: a reader saving over it gets their own
    -- copy instead of rewriting the team's.
    IF vOwner IS DISTINCT FROM nMasterid THEN
      nWVid   := NULL;   -- routes to the INSERT below
      -- A fork is born private. The dialog pre-fills its toggle from the view
      -- being saved, so without this a reader pressing Save on a shared view
      -- would republish a same-named duplicate to the whole case.
      bShared := false;
    END IF;
  END IF;

  IF nWVid IS NULL THEN
    INSERT INTO public."WorkspaceView"
      ("nCaseid", "nUserid", "cName", "cEntity", "cViewType", "jFilter", "jState", "bShared")
    VALUES
      (nCaseid, nMasterid, cName, cEntity, cViewType, jFilter, jState, bShared)
    RETURNING "nWVid" INTO vId;
  ELSE
    UPDATE public."WorkspaceView"
       SET "cName"     = cName,
           "cEntity"   = cEntity,
           "cViewType" = cViewType,
           "jFilter"   = jFilter,
           "jState"    = jState,
           "bShared"   = bShared,
           "dUpdateDt" = now()
     WHERE "nWVid"   = nWVid
       AND "nUserid" = nMasterid
       AND "cStatus" = 'C'
    RETURNING "nWVid" INTO vId;
  END IF;

  IF vId IS NULL THEN
    OPEN ref FOR SELECT -1 AS msg, 'Save failed' AS value;
    RETURN ref;
  END IF;

  OPEN ref FOR
    SELECT
      v."nWVid",
      v."nCaseid",
      v."nUserid",
      v."cName",
      v."cEntity",
      v."cViewType",
      v."jFilter",
      v."jState",
      v."bShared",
      true AS "bIsOwner",
      btrim(COALESCE(um."cFname", '') || ' ' || COALESCE(um."cLname", '')) AS "cCreateby",
      v."dCreateDt",
      v."dUpdateDt",
      1 AS msg
    FROM public."WorkspaceView" v
    LEFT JOIN public."UserMaster" um ON um."nUserid" = v."nUserid"
    WHERE v."nWVid" = vId;

  RETURN ref;
END;
$function$;

ALTER FUNCTION public.et_workspace_view_save(parameter json, ref refcursor) OWNER TO vultradmin;

--------------------------------------------------------------------------
-- 4. delete — soft delete, owner-only
--
-- No nCaseid is sent on this route and none is needed: "nUserid" = nMasterid
-- is the whole gate, and a row can only be owned by someone who was on the
-- case when it was created. The client tests Number(msg) === 1.
--------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.et_workspace_view_delete(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
  nMasterid uuid;
  nWVid     uuid;
  vRows     integer;
BEGIN
  nMasterid := NULLIF(parameter ->> 'nMasterid', '')::uuid;
  nWVid     := NULLIF(parameter ->> 'nWVid', '')::uuid;

  IF nWVid IS NULL OR nMasterid IS NULL THEN
    OPEN ref FOR SELECT -1 AS msg, 'nWVid is required' AS value;
    RETURN ref;
  END IF;

  UPDATE public."WorkspaceView"
     SET "cStatus"   = 'D',
         "dUpdateDt" = now()
   WHERE "nWVid"   = nWVid
     AND "nUserid" = nMasterid
     AND "cStatus" = 'C';

  GET DIAGNOSTICS vRows = ROW_COUNT;

  IF vRows > 0 THEN
    OPEN ref FOR SELECT 1 AS msg, 'Deleted' AS value, nWVid AS "nWVid";
  ELSE
    OPEN ref FOR SELECT -1 AS msg, 'You do not have a permission for delete' AS value;
  END IF;

  RETURN ref;
END;
$function$;

ALTER FUNCTION public.et_workspace_view_delete(parameter json, ref refcursor) OWNER TO vultradmin;

COMMIT;
