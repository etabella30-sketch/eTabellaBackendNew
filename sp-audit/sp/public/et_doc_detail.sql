CREATE OR REPLACE FUNCTION public.et_doc_detail(parameter json, ref1 refcursor, ref2 refcursor, ref3 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE jDocids jsonb;
nMasterid uuid;
BEGIN
jDocids := parameter->>'jDocids';
nMasterid := NULLIF(parameter->>'nMasterid','')::uuid;

/*
 select * from et_doc_detail('{""jDocids"":""[24,35]""}','r','r2','r3');fetch all in ""r"";
fetch all in ""r2"";fetch all in ""r3""

 select * from ""DocDetail""
alter table ""DocDetail"" add column ""jOText"" jsonb

select * From ""FactDetail""
 select * from ""DocMaster""
 select * from ""DMShared""
 select * from ""UserMaster""
*/
	 
	open ref1 for select d."nDocid",d."nBundledetailid",d."nUserid",d."dCreateDt",
	dd."cType",dd."jLinktype",dd."jOText"
	from "DocMaster" d
	join "DocDetail" dd on dd."nDocid" = d."nDocid"
	where jDocids @> to_jsonb(d."nDocid"::text);

    RETURN Next ref1;
	
	open ref2 for 
	select d."nDocid",d."nDMLids",d."jLinktype",d."nBundledetailid",bd."cFilename",bd."cExhibitno",bd."cTab",bm."cBundletag"
	from "DMLinks" d
	join "BundleDetail" bd on bd."nBundledetailid" = d."nBundledetailid"	
	left join "BundleMaster" bm on bd."nBundleid" = bm."nBundleid"	
	where jDocids @> to_jsonb(d."nDocid"::text);
	
    RETURN Next ref2;

	open ref3 for 
		select jsonb_agg(d."nDocid") as "docids",u."nUserid",u."cFname",u."cLname",u."cProfile"
		From "DocMaster" d
		join "DMShared"  s on s."nDocid" = d."nDocid"
		join "UserMaster" u on u."nUserid" = s."nUserid"
		where jDocids @> to_jsonb(d."nDocid"::text)
		group by u."nUserid",u."cFname",u."cLname",u."cProfile";
		
    RETURN Next ref3;
	
END;
$function$
