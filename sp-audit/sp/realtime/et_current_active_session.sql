CREATE OR REPLACE FUNCTION realtime.et_current_active_session(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid UUID;nCaseid uuid;nSesid uuid;
BEGIN

nMasterid := (parameter ->>'nUserid')::UUID;
nCaseid := parameter ->>'nCaseid';
nSesid := parameter ->>'nSesid';

/*

select * from "RSessionMaster" 

select * from realtime.et_current_active_session('{"nCaseid":"bc669a9e-6388-42af-9a94-f438e907ea30"}','r');fetch all in "r"

*/  
    OPEN ref1 FOR 
	select r."cName",r."dStartDt",r."nDays",r."nLines",r."cUnicuserid",r."cStatus",
	r."dCreatedt",r."cProtocol",r."nCaseid",r."nRTSid",r."nSesid" ,s."cUrl",s."nPort",r."nSesid" "nLSesid",r."bRefresh",r."isTranscript" "isTrans",r."isTranscript"
	from "RSessionMaster" r 
	left join "RealtimeServers" s on s."nRTSid" = r."nRTSid"
	where case when nSesid is not null then r."nSesid" = nSesid else true end 
	and "nCaseid" = nCaseid  and r."dDelDt" is null
	 and "cStatus" = 'R' order by "dStartDt" desc limit 1
    ;    
        
    RETURN NEXT ref1;
    
END;
$function$
