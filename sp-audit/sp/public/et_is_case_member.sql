-- SEC5 (2026-07-02): one reusable case-membership predicate the whole fleet
-- can call, so per-case authorization stops being re-implemented (or forgotten)
-- endpoint by endpoint. Mirrors the inline pattern already used in
-- et_individual_doc_info.sql: a user is a member of a case iff they have a
-- TeamRelation row for it.
CREATE OR REPLACE FUNCTION public.et_is_case_member(p_nCaseid uuid, p_nUserid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public."TeamRelation"
    WHERE "nCaseid" = p_nCaseid AND "nUserid" = p_nUserid
  );
$function$;
