CREATE OR REPLACE FUNCTION public.et_realtime_defaultvalueupdate(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    declare nSesid uuid;nUserid uuid;cFlag text;jDefault jsonb;nLID uuid;nSDid uuid;
BEGIN

nSesid := NULLIF(parameter ->>'nSesid','')::uuid;
nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
cFlag := parameter ->>'cFlag';
jDefault := parameter ->>'jDefault';
nLID := NULLIF(parameter ->>'nLID','')::uuid;
nSesid := case when nSesid IS NULL then '00000000-0000-0000-0000-000000000000'::uuid else nSesid end;
	
/*
select * from et_realtime_defaultvalueupdate ('{""nSesid"":1,""nUserid"":367,""cFlag"":""I"",""jDefault"":""[{\""nIid\"":280,\""nRelid\"":0,\""nImpactid\"":0,\""serialno\"":\""1\""}]"",""nLID"":280}','r1');fetch all in ""r1"";
select * From "RSessionDetail"  where "nSesid" = 36 and   "nUserid" = 366  "nLIid" is not null
*/
nSDid = (select "nSDid" from "RSessionDetail" where "nSesid" = nSesid and "nUserid" = nUserid limit 1);

if (nSDid IS NULL) then
	insert into "RSessionDetail"("nSesid","nUserid")
	values(nSesid,nUserid)
	returning "nSDid" into nSDid;	
end if;

-- select * From "RSessionDetail" where "nSesid" =1 and "nUserid"=367

if(cFlag = 'I')then

	update "RSessionDetail" set "cDefIssues" = jDefault, "nLIid" = nLID
          WHERE "nSesid" = nSesid AND "nUserid" = nUserid;

elsif(cFlag = 'H') then
    UPDATE RSessionDetail
          SET "cDefHIssues" = jDefault, "nLID" = nLID
          WHERE "nSesid" = nSesid AND "nUserid" = nUserid;
	
end if;

OPEN ref FOR
	select 1 as msg,nSDid;
	
				
		
    RETURN ref;
END;
$function$
