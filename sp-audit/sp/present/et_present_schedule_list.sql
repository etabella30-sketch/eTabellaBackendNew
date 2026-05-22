CREATE OR REPLACE FUNCTION present.et_present_schedule_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nMasterid uuid;
nCaseid uuid;

BEGIN
-- select * from present.et_present_schedule_list('{""nCaseid"":1079, ""nMasterid"": 29}','r');fetch all in ""r""
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
	-- select * from "PMContact"
open ref for

	SELECT   pm."nPresentid",   pmc."nPCid", pmc."nContactid", cm."cFname", cm."cLname"
		from present."PMContact" pmc
		join present."PresentationMaster" pm on pm."nPCid" = pmc."nPCid"
		join  "ContactMaster" cm on cm."nContactid" =  pmc."nContactid"
		where pmc."nCaseid" = nCaseid  and pmc."nCreateid" = nMasterid and pmc."dDelDt" is null and pm."cStatus" in ('B','I')
		order by pmc."dCreateDt" desc;

 -- Return the cursor to the caller
 RETURN ref;    
END;

$function$
