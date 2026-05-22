CREATE OR REPLACE FUNCTION present.et_present_shared_link(parameter json, ref1 refcursor, ref2 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
	
declare nMasterid uuid; nPresentid uuid;nBundledetailid uuid;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;

/*
 select * from present.et_present_shared_link('{"nPresentid":9,"nBundledetailid":165549,"nMasterid":366}','r1','r2');FETCH All in "r1"; 
 FETCH All in "r2";

select * from present."PMHighlights"
select * from present."PMDocuments"

select * from "Annotations" order by 1 desc

select * From present."PMLinkShared"
select * From present."PMRemarks"
*/

	
    OPEN ref1 FOR 
	
	select p."nAId",p."isWithLink"
		From present."PMLinkShared" p
		where p."nPresentid" = nPresentid and p."nBundledetailid" = nBundledetailid
		group by p."nAId",p."isWithLink";
		
    RETURN NEXT ref1;
    
	
	
	
	
    OPEN ref2 FOR 
		select "nPRid","nAId","nRemarkid" from present."PMRemarks" where "nBundledetailid" = nBundledetailid and "nPresentid"  = nPresentid;
	
 	RETURN NEXT ref2;
	
	 
END;
$function$
