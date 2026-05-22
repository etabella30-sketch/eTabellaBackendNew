CREATE OR REPLACE FUNCTION present.et_present_remark_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
/*
select * from present.et_present_shared_link ('{""nPresentid"":9,""nBundledetailid"":165549,""nMasterid"":366}','r1');fetch all in ""r1"";

select * from present."PMHighlights"
select * from present."PMDocuments"

select * from "Annotations" order by 1 desc

select * From present."PMLinkShared"

*/

open ref for 

	select "nCodeid","cCodename","jOther" 
		from "Codemaster" c where c."nCategoryid" = 20 order by "nSerialno";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
