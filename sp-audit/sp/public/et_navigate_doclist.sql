CREATE OR REPLACE FUNCTION public.et_navigate_doclist(parameter json, ref1 refcursor)
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
    sql_query2 TEXT;
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

/*
select (array (  select distinct m.""nDocid"" 
	From ""DocMaster"" m
	join ""DocDetail"" d on d.""nDocid"" = m.""nDocid""
	left join ""DMLinks"" l on l.""nDocid"" = m.""nDocid"" 
	where (m.""nUserid"" = 2 and m.""nBundledetailid"" = 555364)  and (l.""nBundledetailid"" IN (555364))     ))

select * from et_navigate_doclist ('{""nBundledetailid"":555364,""cSorttype"":""H"",""cSortby"":""D"",""nPageNumber"":1,""jFilter"":""[{\""name\"":\""DOCTITLE\"",\""type\"":\""V\"",\""value\"":[555364]}]"",""nMasterid"":2}','r1');fetch all in ""r1"";

*/

filter_string := (select filter_whereclause(jFilter,'DL'));

sql_query := ('select (array (  select distinct m."nDocid" 
	From "DocMaster" m
	join "DocDetail" d on d."nDocid" = m."nDocid"
	left join "DMLinks" l on l."nDocid" = m."nDocid" 
	left join "DMShared" ds on ds."nDocid" = m."nDocid" 
	where (
	(m."nUserid" = ''' || nMasterid || '''::uuid
	or ds."nUserid" = ''' || nMasterid || '''::uuid
	)
	and
	m."nBundledetailid" = ''' || nBundledetailid || '''::uuid
--	and d."cType" != ''M''
	) ' || (case when filter_string is not null then (' and (' || filter_string || ') ') else '' end) || '    ))');
 --

EXECUTE sql_query INTO docids;

OPEN ref1 FOR 
		
with bgroup as (
select row_number() OVER (order by m."nDocid" desc) AS "nGId",
	jsonb_agg(m."nDocid") as "jDIds",
d."jLinktype" as "grouplink",max(m."dCreateDt") as "dCreateDt",
um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby"
From "DocMaster" m
join "DocDetail" d on d."nDocid" = m."nDocid"
JOIN "UserMaster" um ON um."nUserid" = m."nUserid"
-- where m."nUserid" = nMasterid and m."nBundledetailid" = nBundledetailid and m."nDocid" = ANY(docids)
where m."nDocid" = ANY(docids)
group by d."jLinktype", um."cFname", um."cLname",m."nDocid"
), files as (
select g.*,
	d."nDocid",d."nDMLids",d."jLinktype",d."nBundledetailid",d."jOTexts"
from bgroup g
join "DMLinks" d on "jDIds"  @> to_jsonb(d."nDocid")
),mergeIn as (
	select f.*,'{}'::jsonb as "jIncomming" From files f
	union all 
	select null as "nGId",jsonb_agg(distinct m."nDocid") as "jDIds",d."jLinktype" as "grouplink",
	m."dCreateDt",
	um."cFname" || ' ' || COALESCE(um."cLname", '') AS "cCreateby",
	l."nDocid",l."nDMLids",l."jLinktype",l."nBundledetailid",l."jOTexts",
   jsonb_build_object('cFilename',bd."cFilename",'cTab',bd."cTab",'cExhibitno',bd."cExhibitno",'cBundletag',bd."cBundletag") as "jIncomming"
from "DMLinks" l
join "DocMaster" m on m."nDocid" = l."nDocid"
join "bundlesource" bd on bd."nBundledetailid" = m."nBundledetailid"
join "DocDetail" d on d."nDocid" = m."nDocid"
JOIN "UserMaster" um ON um."nUserid" = m."nUserid"
-- where l."nBundledetailid" = nBundledetailid and m."nBundledetailid" != nBundledetailid and m."nUserid" = nMasterid  and m."nDocid" = ANY(docids)
where m."nBundledetailid" != nBundledetailid and m."nDocid" = ANY(docids)
group by d."jLinktype",m."dCreateDt",
	l."nDocid",l."nDMLids",l."jLinktype",l."nBundledetailid",l."jOTexts",bd."cFilename",bd."cTab",bd."cExhibitno",bd."cBundletag", um."cFname", um."cLname"
),finalrs as (
 select t.* ,bd."cFilename",bd."cTab",bd."cExhibitno",bd."cBundletag"
	From mergeIn t
	join "bundlesource" bd on bd."nBundledetailid" = t."nBundledetailid"
) select * from finalrs  
	order by 
	-- f."dCreateDt" desc; 
	CASE WHEN cSortby = 'asc' THEN "dCreateDt" END ASC,
	CASE WHEN cSortby = 'desc' THEN "dCreateDt" END DESC,
	"dCreateDt" DESC;
   RETURN ref1;

END;
$function$
