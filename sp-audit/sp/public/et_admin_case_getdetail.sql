CREATE OR REPLACE FUNCTION public.et_admin_case_getdetail(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid;nCaseid uuid;
isPresent boolean = false;
nPresentid uuid;
nSesid text;

BEGIN

nUserid := NULLIF(parameter->>'nMasterid','')::uuid;
nCaseid := NULLIF(parameter->>'nCaseid','')::uuid;
/*
 select * from et_admin_insertupdate_case ('{"cCasename":"V2- test","cCaseno":"123","cDesc":"9988","cIndexheader":"","cClaimant":"","cRespondent":"","nMasterid":2}','r1');fetch all in "r1";
 select * from et_admin_case_getdetail('{"nCaseid":"085da82d-1cc8-440a-a918-d0b37d54db1e","cCasename":"Frod","cCaseno":"67","cDesc":"Emergancy","permission":"N","nUserid":2}','refcursor'); FETCH All in "refcursor";
--select * From  "RSessionMaster" order by "dCreatedt" desc 
*/

 select "nSesid"::text into nSesid From "RSessionMaster" where "nCaseid" = nCaseid and "dCreatedt"::date=now()::date and  "cStatus" ='R' order by "dCreatedt" desc limit  1;
	
if exists(select 1 from present."PresentationMaster" p join present."PMUser" pm on pm."nPresentid" = p."nPresentid"
 where "nCaseid" = nCaseid and p."cStatus" = 'L' and "nUserid" = nUserid and pm."cStatus" = 'A') then 
	isPresent = true;
	
	select p."nPresentid" into nPresentid from present."PresentationMaster" p join present."PMUser" pm on pm."nPresentid" = p."nPresentid"
 where "nCaseid" = nCaseid and p."cStatus" = 'L' and "nUserid" = nUserid and pm."cStatus" = 'A';
 end if;

open ref for
select 1 as msg,"nCaseid","cCasename","cCaseno","cClaimant","cRespondent","cTClaimant","cTRespondent","cIndexheader","cDesc","cTranscriptMode","bHideBundleColumn",isPresent "isPresent",nPresentid "nPresentid",nSesid "nSesid"
from "CaseMaster" where "nCaseid" = nCaseid;

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
