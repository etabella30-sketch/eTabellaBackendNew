CREATE OR REPLACE FUNCTION public.et_realtime_demo_issues_delete(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nSesid uuid;nUserid uuid;nCaseid uuid; nICid uuid;

BEGIN

-- nSesid := parameter ->> 'nSesid';
nUserid := NULLIF(parameter ->> 'nUserid','')::uuid;
nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;

-- select * from et_realtime_demo_issues_delete ('{""nSesid"":1,""nUserid"":300,""nCaseid"":1093}','r1');fetch all in ""r1"";
-- select * From "RSessionMaster" order by 1 desc

	nSesid = (select "nSesid" from "RSessionMaster" where "nCaseid" = nCaseid and "cSType" = 'D' limit 1);

	if(nSesid IS NOT NULL)then
		-- update "RSessionMaster" set "cStatus" = 'C' where "nCaseid" = nCaseid and "cUnicuserid" = nUserid::text and "cSType" = 'D';

		delete from "RIssueDetail" where "nUserid" = nUserid and "nSessionid" =nSesid;
		-- select * From "RHighlights"
		delete from "RHighlights" where "nUserid" = nUserid and "nSessionId" =nSesid;
		
	else
		insert into "RSessionMaster" ("cName","dStartDt","nDays","nLines","nPageno","nCaseid","cUnicuserid","cStatus","dCreatedt","nRTSid","cNotifytype","cSType")
		values('Demo session',now(),1,25,1,nCaseid,nUserid::text,'C',now(),1,'O','D')
		returning "nSesid" into nSesid;
	end if;
		
/*

select * From "RSessionMaster"

delete from "RIssueDetail" where "nUserid" = nUserid and (""nSessionid"" =nSesid  or ""nSessionid"" =1);
-- select * From "RHighlights"
delete from "RHighlights" where "nUserid" = nUserid and (""nSessionId"" =nSesid  or ""nSessionId"" =1);

*/

if not exists (select * from "RIssueMaster" where "nUserid" = '00000000-0000-0000-0000-000000000000'::uuid and "cIName" = 'Unassigned' and "nCaseid" = nCaseid)then

	nICid = (select "nICid" from "IssueCategory" where "nCaseid" = nCaseid and "nUserid" = '00000000-0000-0000-0000-000000000000'::uuid and "cICtype" = 'U' limit 1);

	if(nICid IS NULL)then
		insert into "IssueCategory"("nCaseid","cCategory","nUserid","dCreateDt","cICtype")
		values(nCaseid,'Unassigned','00000000-0000-0000-0000-000000000000'::uuid,now(),'U')
		RETURNING "nICid" INTO nICid;

	end if;

	insert into "RIssueMaster" ("cIName","cColor","nICid","nUserid","dCreatedt","nCaseid")
	values('Unassigned','e9e90e',nICid,'00000000-0000-0000-0000-000000000000'::uuid,now(),nCaseid);

end if;

 open ref for select 1 as msg,nSesid as "nSesid";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
