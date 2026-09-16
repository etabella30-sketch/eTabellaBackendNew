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

 select "nSesid"::text into nSesid From "RSessionMaster" where "nCaseid" = nCaseid and "dCreatedt"::date=now()::date and  "cStatus" ='R' order by "dCreatedt" desc limit  1;

if exists(select 1 from present."PresentationMaster" p join present."PMUser" pm on pm."nPresentid" = p."nPresentid"
 where "nCaseid" = nCaseid and p."cStatus" = 'L' and "nUserid" = nUserid and pm."cStatus" = 'A') then
    isPresent = true;

    select p."nPresentid" into nPresentid from present."PresentationMaster" p join present."PMUser" pm on pm."nPresentid" = p."nPresentid"
 where "nCaseid" = nCaseid and p."cStatus" = 'L' and "nUserid" = nUserid and pm."cStatus" = 'A';
 end if;

open ref for
select 1 as msg,"nCaseid","cCasename","cCaseno","cClaimant","cRespondent","cTClaimant","cTRespondent","cIndexheader","cDesc","cTranscriptMode","bHideBundleColumn","dHearingDt","cHearingTimezone","nHearingDays",isPresent "isPresent",nPresentid "nPresentid",nSesid "nSesid"
from "CaseMaster" where "nCaseid" = nCaseid;

 RETURN ref;
    END;
$function$
