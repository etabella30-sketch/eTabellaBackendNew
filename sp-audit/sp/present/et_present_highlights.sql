CREATE OR REPLACE FUNCTION present.et_present_highlights(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid; nPresentid uuid;cuuid text;nAId uuid;cColor text;nBundledetailid uuid;

BEGIN

nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nPresentid := NULLIF(parameter ->>'nPresentid','')::uuid;
cuuid := parameter ->>'uuid';
cColor := parameter ->>'cColor';
nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
/*
select * from present.et_present_highlights ('{""nPresentid"":9,""nBundledetailid"":165549,""nMasterid"":366}','r1');fetch all in ""r1"";

select * from ""Annotations"" limit 0 where ""nAId"" = 9854  limit 1

279
366

select * From ""UserMaster"" where ""nUserid"" = 279

select * from present.""PMHighlights""
select * from present.""PMDocuments""

select * from ""Annotations"" order by 1 desc

alter table ""Annotations"" add column ""nBDid"" int
select * from present.""PresentationMaster"" order by 1 desc

*/

open ref for 
	select 
	0 as id,a."nAId" ,a."uuid",a."type",a."rects",a."lines",a."width",a."clr" as "color",a."page",'P' as "linktype"
	from "Annotations" a
	join present."PresentationMaster" p on p."nPresentid" = a."nPresentid"
	left join present."PMHighlights" u on u."nAId" = a."nAId" and u."nPresentid" = nPresentid and u."nUserid" = nMasterid
	where a."nPresentid" = nPresentid and case when p."nCreateid" = nMasterid then true else u."nPMHid" is not null end 
	and a."nBDid" = nBundledetailid
	;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
