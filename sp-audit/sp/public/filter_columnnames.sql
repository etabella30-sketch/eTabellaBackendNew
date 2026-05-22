CREATE OR REPLACE FUNCTION public.filter_columnnames(filter_name text, ctype text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    column_name TEXT;
BEGIN
    -- Map filter names to actual column names
    column_name :=
	case when  (ctype = 'FCH' or ctype = 'FCO') then 
	(CASE filter_name
        WHEN 'CLAIM' THEN 'im."nICid"'
        WHEN 'ISSUE' THEN 'i."nIssueid"'
        WHEN 'TYPE' THEN 'd."nFiletype"'
        WHEN 'RELEVANCE' THEN 'i."nRelevanceid"'
        WHEN 'IMPACT' THEN 'i."nImpactid"'
        WHEN 'STATUS' THEN 'd."nStatus"'
        WHEN 'CONTACT' THEN 'c."nContactid"'
		WHEN 'DATE' THEN 'f."dCreateDt"'
        -- Add more mappings as needed
        ELSE NULL
    END)
	when ctype = 'DL' then
	(CASE filter_name
        WHEN 'DOCTITLE' THEN 'l."nBundledetailid"'
        WHEN 'EXHIBITNO' THEN 'l."nBundledetailid"'
        WHEN 'REF' THEN 'l."nBundledetailid"'
        WHEN 'DESTINATION' THEN 'l."nDMLids"'
        WHEN 'INCOMMING' THEN 'l."nBundledetailid"'
        WHEN 'OUTGOING' THEN 'l."nBundledetailid"'
		WHEN 'DATE' THEN 'm."dCreateDt"'
        -- Add more mappings as needed
        ELSE NULL
    END)
	when ctype = 'WL' then
	
	(CASE filter_name
      	WHEN 'CLAIM' THEN 'im."nICid"'
        WHEN 'ISSUE' THEN 'i."nIssueid"'
        WHEN 'TYPE' THEN 'd."nFiletype"'
        WHEN 'RELEVANCE' THEN 'i."nRelevanceid"'
        WHEN 'IMPACT' THEN 'i."nImpactid"'
        WHEN 'STATUS' THEN 'd."nStatus"'
        WHEN 'CONTACT' THEN 'c."nContactid"'
        ELSE NULL
    END)
	when ctype = 'WRK' then 
	(CASE filter_name
        WHEN 'CLAIM' THEN 'im."nICid"'
        WHEN 'ISSUE' THEN 'fi."nIssueid"'
        WHEN 'TYPE' THEN 'd."nFiletype"'
        WHEN 'RELEVANCE' THEN 'fi."nRelevanceid"'
        WHEN 'IMPACT' THEN 'fi."nImpactid"'
        WHEN 'STATUS' THEN 'd."nStatus"'
        WHEN 'CONTACT' THEN 'fc."nContactid"'
		WHEN 'DATE' THEN 'f."dCreateDt"'
        ELSE NULL
    END)
	
	
	when ctype = 'TSK' then 
	(CASE filter_name
        WHEN 'CLAIM' THEN 'im."nICid"'
        WHEN 'ISSUE' THEN 'fi."nIssueid"'
        WHEN 'TYPE' THEN 'd."nFiletype"'
        WHEN 'RELEVANCE' THEN 'fi."nRelevanceid"'
        WHEN 'IMPACT' THEN 'fi."nImpactid"'
        WHEN 'STATUS' THEN 'd."nStatus"'
        WHEN 'CONTACT' THEN 'fc."nContactid"'
        WHEN 'ASSIGNEE' THEN 'ts."nUserid"'
        WHEN 'CREATOR' THEN 'tm."nUserid"'
        ELSE NULL
    END)

	when ctype = 'FILEC' then
        (CASE filter_name
        WHEN 'CLAIM' THEN 'im."nICid"'
        WHEN 'ISSUE' THEN 'fi."nIssueid"'
        WHEN 'TYPE' THEN 'd."nFiletype"'
        WHEN 'RELEVANCE' THEN 'fi."nRelevanceid"'
        WHEN 'IMPACT' THEN 'fi."nImpactid"'
        WHEN 'STATUS' THEN 'd."nStatus"'
        WHEN 'CONTACT' THEN 'bc."nContactid"'
        ELSE NULL
    END)

	when ctype = 'NWL' then
        (CASE filter_name
        WHEN 'TITLE' THEN 'wd."nWebid"'
        WHEN 'DESCRIPTION' THEN 'wd."nWebid"'
        WHEN 'URL' THEN 'wd."nWebid"'
		WHEN 'DATE' THEN 'w."dCreateDt"'
        ELSE NULL
    END)
	
	when ctype = 'FILES' then 

	(CASE filter_name
        WHEN 'CLAIM' THEN 'im."nICid"'
        WHEN 'ISSUE' THEN 'fi."nIssueid"'
        WHEN 'TYPE' THEN 'd."nFiletype"'
        WHEN 'RELEVANCE' THEN 'fi."nRelevanceid"'
        WHEN 'IMPACT' THEN 'fi."nImpactid"'
        WHEN 'STATUS' THEN 'd."nStatus"'
        WHEN 'CONTACT' THEN 'fc."nContactid"'
        WHEN 'ASSIGNEE' THEN 'ts."nUserid"'
        WHEN 'CREATOR' THEN 'tm."nUserid"'
        WHEN 'DATE' THEN 'cr.start_date'
        ELSE NULL
    END)
	
	when ctype = 'FILEC' then 

	(CASE filter_name
        WHEN 'CLAIM' THEN 'im."nICid"'
        WHEN 'ISSUE' THEN 'fi."nIssueid"'
        WHEN 'TYPE' THEN 'd."nFiletype"'
        WHEN 'RELEVANCE' THEN 'fi."nRelevanceid"'
        WHEN 'IMPACT' THEN 'fi."nImpactid"'
        WHEN 'STATUS' THEN 'd."nStatus"'
        WHEN 'CONTACT' THEN 'bc."nContactid"'
        ELSE NULL
    END)
	
	else 
	'NOCLOUMN' 
	end
	
	;
    IF column_name IS NULL THEN
        RAISE NOTICE  'Unknown filter name: %', filter_name;
		RETURN NULL;
    END IF;
    RETURN column_name;
END;
$function$
