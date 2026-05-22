CREATE OR REPLACE FUNCTION present.et_present_case_getinfo(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid; nCaseid uuid;

BEGIN

nUserid := NULLIF(parameter ->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

-- select * from et_present_case_getinfo ('{""nCaseid"":1079,""nMasterid"":29}','r1');fetch all in ""r1"";

open ref for 
select 1 as msg,"nCaseid","cCasename","cCaseno", "cDesc"
from "CaseMaster" where "nCaseid" = nCaseid;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
