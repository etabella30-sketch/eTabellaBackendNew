CREATE OR REPLACE FUNCTION present.et_present_highlights_shared(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nPresentid uuid;nBundledetailid uuid;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
/*
select * from present.et_present_highlights_shared ('{""nPresentid"":9,""nBundledetailid"":165549,""nMasterid"":366}','r1');fetch all in ""r1"";

select * from present.""PMHighlights""
select * from present.""PMDocuments""

select * from ""Annotations"" order by 1 desc

select * From present.""PMLinkShared""

*/

open ref for 

	select a."nAId" ,a."uuid",a."type",a."rects",a."lines",a."width",a."color",a."page" ,
	case when p."isWithLink" = true then
		coalesce(nullif(a."nFSid",'00000000-0000-0000-0000-000000000000'::uuid), (coalesce(nullif(a."nDocid",'00000000-0000-0000-0000-000000000000'::uuid), a."nWebid" )) )
	else '00000000-0000-0000-0000-000000000000'::uuid end as "id",

	case when p."isWithLink" = true then
		case 
			when a."nFSid" IS NOT NULL then 'F' 
			when a."nDocid" IS NOT NULL then 'D'
			when a."nWebid" IS NOT NULL then 'W'
		else
			'P' 
		end
	else 'P' end as "linktype"
	
	from present."PMLinkShared" p
	join "annotations" a on a."nAId" = p."nAId"
	
	where p."nPresentid" = nPresentid and p."nBundledetailid" = nBundledetailid and p."nUserid" = nMasterid;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
