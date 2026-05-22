CREATE OR REPLACE FUNCTION public.et_hyperlink_update_documents_index(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare
	nMasterid uuid;nBundledetailid uuid;cStatus text;jAnnotations jsonb;cHyperlinktype text;nHLid uuid;
	cKeeptype text;
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
cStatus := parameter ->>'cStatus';
jAnnotations := parameter ->>'jAnnotations';
cHyperlinktype := parameter ->>'cType';
cKeeptype := parameter ->>'cKeeptype';

 nHLid = (select "nHLid" from "HyperLink" where "nBundledetailid" = nBundledetailid and "cType" = cHyperlinktype);

if(nHLid IS NULL)then

    insert into "HyperLink"("nBundledetailid","nUserid","cStatus","cType")
    values(nBundledetailid,nMasterid,cStatus,cHyperlinktype)
    RETURNING "nHLid" into nHLid;

else

    update "HyperLink" set "cStatus" = cStatus,"dUpdateDt" = now(),"nUpdateid" = nMasterid where "nHLid" = nHLid;

end if;

if(cStatus = 'C')then
			if(coalesce(cKeeptype,'R') = 'R')then
				delete from "Annotations" a where exists (select * from "HyperLink" h where h."nHLid" = a."nHLid" and h."nBundledetailid" = nBundledetailid  );
			else
				delete from "Annotations" a where exists (select * from "HyperLink" h where h."nHLid" = a."nHLid" and h."nBundledetailid" = nBundledetailid and h."cType" = cHyperlinktype  );
			end if;
end if;

delete from "Annotations" a where "nHLid" = nHLid;
-- select * from temp_tbl
drop table if exists temp_tbl;
create temp table temp_tbl as 
	select * from jsonb_to_recordset(jAnnotations) as (page int,type text,uuid text,tab text,rects jsonb);

 insert into "Annotations"("uuid","type","rects","lines","page","dCreateDt","nHLid","isHyperlink")
	select t.uuid,t.type,t.rects,'[]'::jsonb,t.page,now(),nHLid,true  
	 from jsonb_to_recordset(jAnnotations) as t(page int,type text,uuid text,tab text,rects jsonb);

/*
	
 cHyperlinktype := (select coalesce("cHyperlinktype",'T') from "HyperLink" where "nLinkid" = nLinkid);
	
delete from "Annotations" a
where "cAType" = 'HL' and "cHType" = cHyperlinktype  
and "nBundledetailid" = nBundledetailid;
	

insert into "Annotations"("nUserid","nBundledetailid","ant","cAType","cHType")
	select nUserid,nBundledetailid,row_to_json(t),'HL', cHyperlinktype
from jsonb_populate_recordset(null::record,jAnnotations) as t(page int,"type" text,tab text,uuid text,class text,bundledetailid int,color text,rectangles jsonb,hyperlink boolean,"typeid" text);
 
 */ 
open ref for 
select 1 as msg;
 
	
RETURN ref;                                                     
    END;
$function$
