CREATE OR REPLACE FUNCTION realtime.et_marknav_doclinks(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nSesid uuid;nUserid uuid;nBundledetailid uuid;
    sql_query TEXT;
	historyEnabled boolean;
	cSortby text;


	isAdmin boolean default false;
	nRoleid uuid;nTeamid uuid;nCaseid uuid;
	jFilter jsonb;
	nID uuid;
	bIsTranscipt boolean default false;

BEGIN
	nSesid := NULLIF(parameter ->>'nSesid','')::uuid;
	nUserid := parameter ->>'nUserid';
	nBundledetailid := NULLIF(parameter->>'nBundledetailid','')::uuid;
	historyEnabled := COALESCE(parameter ->> 'historyEnabled','false')::boolean;
	cSortby := parameter->>'cSortby';
	jFilter := parameter ->>'jFilter';
	bIsTranscipt := COALESCE(parameter ->> 'bIsTranscipt','false')::boolean;
	
	nID := (case when nSesid  is not distinct from null then nBundledetailid else nSesid end);

/*
select * from realtime.et_marknav_doclinks ('{"nSesid":"ad2ecd86-d0e5-4c0c-8ad2-80f30ca018dd","nUserid":"eb3ec87b-7ece-43fd-919f-a9c7a77de35e"}','r1');fetch all in "r1";

select * from "DocMaster"  order by "dCreateDt" desc
select * from "UserMaster"
select * from "DocDetail"
select * from "DMShared"

0e5c98bb-e83a-4009-8da9-63e24f4da1ec
select * from "FactDetail" where "nFSid" = '66706b55-0250-4947-a54c-f2c07a68cb70'

*/
-- with tbl as (
--     select m."dCreateDt",m."nDocid",
-- 		u."cFname" || ' ' || COALESCE(u."cLname", '') AS "cCreateby",
--     d."jLinktype",d."jOText",d."jTexts",d."nPage",d."nLine",m."nUserid",d."jCordinates"
--     From "DocMaster" m
--     join "UserMaster" u on u."nUserid" = m."nUserid"
--     join "DocDetail" d on d."nDocid" = m."nDocid"
-- 	left join "DMShared" s on s."nDocid" = m."nDocid" and s."nUserid" = nUserid
--     where (m."nSesid" = nSesid or m."nBundledetailid" = nBundledetailid) and (m."nUserid" = nUserid or s."nUserid" = nUserid)
-- ) , links as (
--     select 	l."nDocid",l."nDMLids" ,l."jLinktype",l."nBundledetailid",d.*
-- 	from "DMLinks" l
--     join tbl m on m."nDocid" = l."nDocid"
-- 	join bundlesource d on d."nBundledetailid" = l."nBundledetailid"
-- ) select t.*,
-- 	jsonb_agg(distinct l.*) as "list" from tbl t
-- join "links" l on l."nDocid" = t."nDocid"
-- group by t."dCreateDt",t."nDocid",
-- 	t."cCreateby",
--     t."jLinktype",t."jOText",t."jTexts",t."nPage",t."nLine",t."nUserid",t."jCordinates";

isAdmin := case when exists (  select * from "UserMaster" where "nUserid" = nUserid and "isAdmin" = true )  then true  else false  end;
 	if(nBundledetailid is not null) then
	 	select "nCaseid" into nCaseid from bundlesource where  "nBundledetailid" =  nBundledetailid;
	 else 
		select "nCaseid" into nCaseid from "RSessionMaster" where "nSesid" = nSesid;
	 end if;

	select "nTeamid","nRoleid" into nTeamid,nRoleid  from "TeamRelation" where "nUserid" = nUserid and "nCaseid" = nCaseid limit 1;
	raise notice 'nSesid ,nCaseid , nRoleid %,%,%',nSesid,nCaseid,nRoleid ;
	if(isAdmin = false and (select "nSrno" from "RoleMaster" where "nRoleid" = nRoleid) = 1) then 
		isAdmin := true;
	end if;

sql_query := 'WITH tbl AS (
				SELECT m."dCreateDt",
				m."nDocid",
				u."cFname" || '' '' || COALESCE(u."cLname", '''') AS "cCreateby",
				d."jLinktype",
				d."jOText" as "jOT",
				d."jTexts",
				d."cType",
				m."nBundledetailid",
				-- CASE on bIsTranscipt so the published view picks up nTPage/nTLine
				-- written by run3.py during transferAnnotations. Inline the
				-- boolean since this SELECT is built via string-concat dynamic SQL.
				CASE WHEN '||COALESCE(bIsTranscipt,false)||' THEN d."nTPage" ELSE d."nPage" END AS "nPage",
				CASE WHEN '||COALESCE(bIsTranscipt,false)||' THEN d."nTLine" ELSE d."nLine" END AS "nLine",
				m."nUserid",
				d."jCordinates",
				cmt."total" as "t_comments",count(s."nDMSid") as "t_shared"
				FROM "DocMaster" m
				JOIN "UserMaster" u ON u."nUserid" = m."nUserid"
				JOIN "DocDetail" d ON d."nDocid" = m."nDocid"
			  	left join "TeamRelation" tr ON tr."nTeamid" = '''|| nTeamid ||'''
				LEFT JOIN "DMShared" s ON s."nDocid" = m."nDocid" -- AND s."nUserid" = ' || quote_nullable(nUserid) || ' 
				left join realtime."comments" cmt on cmt."nDocid" = m."nDocid" 
				 '||(
                CASE WHEN historyEnabled = true 
                     THEN 'JOIN realtime.history_marknav('|| quote_nullable(nSesid) ||','|| quote_nullable(nBundledetailid) ||','|| quote_nullable(nUserid) ||',''D'','|| 1 || ') his ON his."id" = m."nDocid"'
                     ELSE '' END
              ) ||'
				WHERE (m."nSesid" = ' || quote_nullable(nSesid) || '
				or  m."nBundledetailid" = ' || quote_nullable(nBundledetailid) || ')
				AND (m."nUserid" = ' || quote_nullable(nUserid)  || '
				or s."nUserid" = ' || quote_nullable(nUserid)  || '  or (case when ''' || isAdmin || '''::boolean = true then  m."nUserid" = tr."nUserid" else false end))
				-- Orphan filter: on the published view, suppress doc-links whose
				-- annotation could not be re-anchored. Mirrors et_marks.sql:48-50.
				AND (
				  '||COALESCE(bIsTranscipt,false)||' = false
				  OR (d."cTransferStatus" IS DISTINCT FROM ''O'' AND d."jTCordinates" IS NOT NULL)
				)
				group by m."dCreateDt", m."nDocid", u."cFname",u."cLname",d."jLinktype", d."jOText", d."jTexts", d."cType", m."nBundledetailid",
				d."nPage", d."nTPage", d."nLine", d."nTLine", m."nUserid", d."jCordinates", cmt."total"
				),
				links AS (
				SELECT l."nDocid",
				l."nDMLids",
				l."jLinktype",
				l."nBundledetailid",
				d.*
				FROM "DMLinks" l
				JOIN tbl m ON m."nDocid" = l."nDocid"
				JOIN bundlesource d ON d."nBundledetailid" = l."nBundledetailid"
				
				)
				SELECT t.*,
					jsonb_agg(DISTINCT l.*) AS "list"
				FROM tbl t
				JOIN links l ON l."nDocid" = t."nDocid"
				where '||(
                CASE WHEN jFilter IS NOT NULL AND jFilter <> '{}'::jsonb
                     THEN ' EXISTS (
                SELECT *
                FROM realtime.filter_marknav(''' || jFilter::text || '''::jsonb,
                                            ' || quote_nullable(nID) || ',
                                            ' || quote_nullable(nUserid) || ',
                                            ''ALL'',' || quote_nullable(nTeamid) || ','|| isAdmin ||') filter
                WHERE  filter."id" = t."nDocid"
            )'
                     ELSE ' true ' END
              ) ||'
				GROUP BY t."dCreateDt",
						t."nDocid",
						t."cCreateby",
						t."jLinktype",
						t."jOT",
						t."jTexts",
						t."cType",
						t."nBundledetailid",
						t."nPage",
						t."nLine",
						t."nUserid",
						t."jCordinates",
						t."t_comments",t.t_shared
						' || 
						(
							CASE 
							WHEN cSortby = 'asc'  THEN ' ORDER BY t."nPage" ASC,t."dCreateDt" ASC'
							WHEN cSortby = 'desc' THEN ' ORDER BY t."nPage" DESC,t."dCreateDt" DESC'
							ELSE '' 
							END
						)
						|| '
						';

		
						
raise notice 'sql_query %',sql_query;
    OPEN ref FOR EXECUTE sql_query;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
