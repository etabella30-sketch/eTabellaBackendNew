CREATE OR REPLACE FUNCTION public.et_navigate_weblinks(parameter json, ref1 refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid uuid;
    nBundledetailid uuid;
    isAdmin boolean;
    cSortby text;
    cSorttype text;
    pageNumber int;
    offsetCount int;
    perPage int := 10;
    docids uuid[];
    sql_query TEXT;
	jFilter jsonb;
	filter_string text default null;
BEGIN
    -- Extract parameters
    nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
    nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;
    cSorttype := parameter->>'cSorttype';
    cSortby := parameter->>'cSortby';
    pageNumber := COALESCE((parameter->>'nPageNumber')::int, 1);
    offsetCount := (pageNumber - 1) * perPage;
	jFilter := parameter ->>'jFilter';

    -- Check if user is admin (moved outside the subquery for better performance)

/*
select * from et_navigate_weblinks ('{""nBundledetailid"":555372,""cSorttype"":""H"",""cSortby"":""D"",""nPageNumber"":1,""jFilter"":""[]"",""nMasterid"":2}','r1');fetch all in ""r1"";

*/

filter_string := (select filter_whereclause(jFilter,'NWL'));

sql_query := ('select  distinct w."nWebid",wd."cUrl",wd."cTitle","cNote","cType","jLinktype","cImg","cFavicon",w."nUserid", w."dCreateDt",
	  um."cFname" || '' '' || COALESCE(um."cLname", '''') AS "cCreateby"
	from "WebMaster" w 
	JOIN "UserMaster" um ON um."nUserid" = w."nUserid" 
	left join "WebDetail" wd on wd."nWebid" = w."nWebid"
	LEFT join "WMShared" ws on ws."nWebid" = w."nWebid"
	where (
	w."nBundledetailid" = '''|| nBundledetailid ||'''::uuid
	and (w."nUserid" = ''' || nMasterid || '''::uuid or ws."nUserid" = ''' || nMasterid || '''::uuid )
	and wd."cType" != ''M''
	) ' ||  (case when filter_string is not null then (' and (' || filter_string || ') ') else '' end)
    || '
    ORDER BY w."dCreateDt" ' || 
        CASE 
            WHEN cSortby = 'asc' THEN 'ASC'
            WHEN cSortby = 'desc' THEN 'DESC'
            ELSE 'DESC'
        END)
	;

	
    OPEN ref1 FOR 
		
EXECUTE sql_query
;

   RETURN ref1;

END;
$function$
