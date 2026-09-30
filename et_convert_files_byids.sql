--
-- PostgreSQL database dump
--

\restrict 9iJWjGfW6cvPKMikXg7l0kIXPreYgVLdm9XqRECrHRWvrvDhEflIbyAn6PJh6Z9

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: et_convert_files_byids(json, refcursor); Type: FUNCTION; Schema: public; Owner: vultradmin
--

CREATE FUNCTION public.et_convert_files_byids(parameter json, ref1 refcursor) RETURNS SETOF refcursor
    LANGUAGE plpgsql
    AS $$
declare nMasterid uuid;
jBids uuid[];
jBDids uuid[];
jFtypes jsonb;
nSectionid uuid;
bundles uuid[];
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jBids := (parameter ->>'jBids')::uuid[];
jBDids := (parameter ->>'jBDids')::uuid[];
jFtypes:= (parameter ->>'jFtypes');
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
-- cFiletype := coalesce((parameter ->>'cFiletype'),'ALL');

-- select * from public.et_get_filetypes ('{"nSectionid":"8844","jBids":"{4054}","jBDids":"{}","nMasterid":"367"}','r1');fetch all in "r1";
bundles := (array (
		WITH RECURSIVE bdl_tree AS (
            SELECT bm."nBundleid", bm."nParentBundleid"
            FROM "BundleMaster" bm
			join "SectionMaster" sm on sm."nSectionid" = bm."nSectionid"
            WHERE  bm."nBundleid" = ANY(jBids)  AND bm."nSectionid" = nSectionid
            UNION ALL
            SELECT c."nBundleid", c."nParentBundleid"
            FROM "BundleMaster" c
            JOIN bdl_tree p ON c."nParentBundleid" = p."nBundleid"			
        )
		select "nBundleid" from "bdl_tree"));

open ref1 for select distinct "cPath" as "cPath","cPage","cRefpage","cFiletype","cFilename" ,"nBundledetailid","nBundledetailid" identifier,"nSectionid","nBundleid" from "BundleDetail"  where "nSectionid" = nSectionid  and "cStatus" = 'C' 
and ("nBundledetailid" = any(jBDids) or "nBundleid" = any(bundles))
and  jFtypes @> to_jsonb(upper("cFiletype"))
;

RETURN NEXT ref1;
	 
END;
$$;


ALTER FUNCTION public.et_convert_files_byids(parameter json, ref1 refcursor) OWNER TO vultradmin;

--
-- PostgreSQL database dump complete
--

\unrestrict 9iJWjGfW6cvPKMikXg7l0kIXPreYgVLdm9XqRECrHRWvrvDhEflIbyAn6PJh6Z9

