CREATE OR REPLACE FUNCTION public.et_assign_contact_list(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid uuid;jBDids jsonb;
BEGIN
nMasterid := NULLIF(parameter ->>'nMasterid','')::uuid;
jBDids := parameter ->>'jBDids';
-- select * from "ContactMaster"
open ref for select c."nContactid","cProfile","cFname","cLname","cEmail" from "BDContacts" bc
join "ContactMaster" c on c."nContactid" = bc."nContactid"
where jBDids @> to_jsonb(bc."nBundledetailid"::text) and bc."nUserid" = nMasterid;
 
RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
