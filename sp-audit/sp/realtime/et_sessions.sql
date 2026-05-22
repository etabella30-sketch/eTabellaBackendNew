CREATE OR REPLACE FUNCTION realtime.et_sessions(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid UUID;cSessionUnicId text;nSesid uuid;
BEGIN

nMasterid := (parameter ->>'nUserid')::UUID;
cSessionUnicId := parameter ->>'cSessionUnicId';
nSesid := parameter ->>'nSesid';

/*

select * From "RSessionMaster" 

select * From "CaseMaster"

select * From "RSessionDetail" where "nSesid" = '7441545a-7d3d-4fb7-9f4c-32a02f572a36'
 [
  {
    "nIid": "f0acfec4-c8a9-49c3-b687-c02abbd8f591",
    "serialno": "1"
  }
]
*/

    
    OPEN ref1 FOR 
	select r."cName",r."dStartDt",r."nDays",r."nLines",r."cUnicuserid",r."cStatus",
	r."dCreatedt",r."cProtocol",r."nCaseid",r."nRTSid",r."nSesid" ,s."cUrl",s."nPort",r."nSesid" "nLSesid",
	r."bRefresh",r."isTranscript" "isTrans",r."isTranscript",
	cm."cCaseno"
	from "RSessionMaster" r 
	left join "RealtimeServers" s on s."nRTSid" = r."nRTSid"
	join "CaseMaster" cm on cm."nCaseid" = r."nCaseid"
	where r."dDelDt" is null and r."cSessionUnicId" = cSessionUnicId and
	case when nSesid is not null then r."nSesid" = nSesid else true end order by r."dStartDt" desc
    ;    
        
    RETURN NEXT ref1;
    
    

     
END;
$function$
