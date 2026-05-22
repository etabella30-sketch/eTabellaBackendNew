CREATE OR REPLACE FUNCTION public.et_admin_case_getinfo(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid;nCaseid uuid;

BEGIN

nUserid := NULLIF(parameter ->>'nMasterid', '')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid', '')::uuid;
/*
 select * from et_admin_insertupdate_case ('{""cCasename"":""V2- test"",""cCaseno"":""123"",""cDesc"":""9988"",""cIndexheader"":"""",""cClaimant"":"""",""cRespondent"":"""",""nMasterid"":2}','r1');fetch all in ""r1"";
 select * from et_admin_case_getdetail ('{""nCaseid"":0,""cCasename"":""Frod"",""cCaseno"":""67"",""cDesc"":""Emergancy"",""permission"":""N"",""nUserid"":2}','refcursor'); FETCH All in ""refcursor"";

*/

open ref for 
select 1 as msg,"nCaseid","cCasename","cCaseno"
from "CaseMaster" where "nCaseid" = nCaseid;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
