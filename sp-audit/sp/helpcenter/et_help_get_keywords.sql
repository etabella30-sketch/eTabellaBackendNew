CREATE OR REPLACE FUNCTION helpcenter.et_help_get_keywords(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; cKey text; tsQuery TEXT; search_words TEXT[];
search_words2  text;

BEGIN

/* 
select * from helpcenter.et_help_get_keywords('{""cKey"":""view do"", ""nMasterid"": 29}','r');fetch all in ""r""
	SELECT * FROM helpcenter.""SearchKeyWord""
*/

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
cKey := parameter ->>'cKey';

--   IF cKey IS NULL OR trim(cKey) = '' THEN
--         OPEN ref FOR
--             SELECT ""nKeyid"", ""cKey"" 
--             FROM helpcenter.""SearchKeyWord""
--             ORDER BY 1 DESC;
--     ELSE
-- -- tsQuery := replace(cKey, ' ', ' & ');

--  tsQuery := string_agg(word || ':*', ' & ') 
--                FROM unnest(string_to_array(cKey, ' ')) AS word;
  
-- 		-- SELECT ""cKey"" FROM helpcenter.""SearchKeyWord"" WHERE ""cKey"" ILIKE '%' || cKey || '%' ORDER BY 1 DESC;
-- 	open ref for
-- 		SELECT ""nKeyid"",""cKey"" 
-- 		FROM helpcenter.""SearchKeyWord""
-- 		WHERE to_tsvector('english', ""cKey"") @@ to_tsquery('english', tsQuery)
-- 		-- ORDER BY ts_rank(to_tsvector(""cKey""), to_tsquery('english', tsQuery)) DESC;
-- 		ORDER BY ts_rank(to_tsvector('english', ""cKey""), to_tsquery('english', tsQuery)) DESC;
--  	END IF;

  search_words := string_to_array(cKey, ' ');
  search_words2 := replace(trim(cKey),' ',':* & ') || ':*';
  raise notice 'search_word %', search_words2;
	OPEN ref FOR
        -- SELECT ""nSMid"", ""cTitle"", ""cLink""

		/* SELECT *
        FROM helpcenter."SubModule"
        WHERE EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text("jTags") AS tag
            WHERE EXISTS (
                SELECT 1
                FROM unnest(search_words) AS word
                WHERE LOWER(tag) ILIKE  LOWER('%' || word || '%')
            )
        )
        ORDER BY "cTitle" DESC; */

		SELECT "nSMid","cTitle","cLink"
FROM helpcenter."SubModule"
WHERE to_tsvector('simple',"jTags") @@ to_tsquery('simple', search_words2) or to_tsvector('simple',"cTitle") @@ to_tsquery('simple', search_words2);

 -- Return the cursor to the caller
 RETURN ref;    
END;

$function$
