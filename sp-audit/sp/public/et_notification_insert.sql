CREATE OR REPLACE FUNCTION public.et_notification_insert(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$

declare nUserid uuid;cTitle text;cMsg text;cStatus text;nFSid uuid;nDocid uuid;nWebid uuid;nBundledetailid uuid;cType text;nCaseid uuid;nNTid uuid;nUPid uuid;
nRefuserid uuid;nPresentid uuid;
BEGIN

	nUserid := NULLIF(parameter ->>'nUserid','')::uuid;
	cTitle := parameter ->>'cTitle';
	cMsg := parameter ->>'cMsg';
	cStatus := parameter ->>'cStatus';
	nFSid := NULLIF(parameter ->>'nFSid','')::uuid;
	nDocid := NULLIF(parameter ->>'nDocid','')::uuid;
	nWebid := NULLIF(parameter ->>'nWebid','')::uuid;
	nBundledetailid := NULLIF(parameter ->>'nBundledetailid','')::uuid;
    cType := parameter ->>'cType';
	nCaseid := NULLIF(parameter ->>'nCaseid','')::uuid;
	nUPid := NULLIF(parameter ->>'nUPid','')::uuid;
	nRefuserid:= NULLIF(parameter ->>'nRefuserid','')::uuid;
	nPresentid:= NULLIF(parameter ->>'nPresentid','')::uuid;
/*
	select * from ""Notifications"" order by 1 desc

alter table ""Notifications"" add column ""nPresentid"" int

 select * from et_notification_insert('{""nUserid"":2,""nCaseid"":22,""cTitle"":""My name anthony gonsalfis"",""cMsg"":""Garh bhi hain khali"",""cStatus"":""C"",""nPresentid"":1}','r');fetch all in ""r""

	*/

		insert into "Notifications" ("nUserid","cTitle","cMsg","dDate","cStatus","nFSid","nDocid","nWebid","nBundledetailid","cType","nCaseid","nUPid","nRefuserid","nPresentid")
		values(nUserid,cTitle,cMsg,now(),coalesce(cStatus,'C'),nFSid,nDocid,nWebid,nBundledetailid,cType,nCaseid,nUPid,nRefuserid,nPresentid) 
			returning "nNTid" into nNTid;

open ref for
select 1 as msg,nNTid as "nNTid";

 RETURN ref;                                                       -- Return the cursor to the caller
    END;
$function$
