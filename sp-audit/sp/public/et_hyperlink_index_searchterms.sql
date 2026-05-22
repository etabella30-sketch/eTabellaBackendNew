CREATE OR REPLACE FUNCTION public.et_hyperlink_index_searchterms(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    nMasterid UUID;nBundledetailid uuid;nSectionid uuid;cType text;
BEGIN
nMasterid := NULLIF(parameter ->> 'nMasterid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
nSectionid := NULLIF(parameter ->>'nSectionid','')::uuid;
cType = parameter ->>'cType';

/*
select * from et_hyperlink_index_searchterms('{""nBundledetailid"":4688,""nBundleid"":0,""cType"":""T"",""cKeeptype"":""R"",""isDeepscan"":false,""nMasterid"":2}','r','r2');fetch all in ""r"";fetch all in ""r2"";

select * from ""BundleDetail"" limit 0

*/

if(nSectionid IS NULL)then
nSectionid = (select "nSectionid" From "BundleDetail" where "nBundledetailid" = nBundledetailid);
end if;

open ref1 for 
select distinct case when cType = 'T' then b."cTab" else b."cExhibitno" end as "cTerm" 
	from "BundleDetail" b where b."nSectionid" = nSectionid and  b."cStatus" = 'C' 
	and coalesce(b."cIsindex",false) = false and ( case when cType = 'T' then b."cTab" else b."cExhibitno" end) is not null
	and nullif( case when cType = 'T' then b."cTab" else b."cExhibitno" end ,'') is not null;
RETURN next ref1;     

open ref2 for 
select  case when cType = 'T' then b."cTab" else b."cExhibitno" end as "cTerm" ,b."nBundledetailid"
	from "BundleDetail" b where b."nSectionid" = nSectionid and  b."cStatus" = 'C' 
	and coalesce(b."cIsindex",false) = false and ( case when cType = 'T' then b."cTab" else b."cExhibitno" end) is not null
	and nullif( case when cType = 'T' then b."cTab" else b."cExhibitno" end ,'') is not null
	;
RETURN next ref2;

    END;
$function$
