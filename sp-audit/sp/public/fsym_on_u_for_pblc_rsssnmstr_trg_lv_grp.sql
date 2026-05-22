CREATE OR REPLACE FUNCTION public.fsym_on_u_for_pblc_rsssnmstr_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nSesid" is null then '' else '"' || replace(replace(cast(new."nSesid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cName" is null then '' else '"' || replace(replace(cast(new."cName" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dStartDt" is null then '' when isfinite(new."dStartDt") then '"' || to_char(new."dStartDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."nDays" is null then '' else '"' || cast(cast(new."nDays" as numeric) as varchar) || '"' end||','||
          case when new."nLines" is null then '' else '"' || cast(cast(new."nLines" as numeric) as varchar) || '"' end||','||
          case when new."nPageno" is null then '' else '"' || cast(cast(new."nPageno" as numeric) as varchar) || '"' end||','||
          case when new."cUnicuserid" is null then '' else '"' || replace(replace(cast(new."cUnicuserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cStatus" is null then '' else '"' || replace(replace(cast(new."cStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dCreatedt" is null then '' when isfinite(new."dCreatedt") then '"' || to_char(new."dCreatedt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."cNotifytype" is null then '' else '"' || replace(replace(cast(new."cNotifytype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dUpdatedt" is null then '' when isfinite(new."dUpdatedt") then '"' || to_char(new."dUpdatedt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."dDelDt" is null then '' when isfinite(new."dDelDt") then '"' || to_char(new."dDelDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."isTranscript" is null then '' when new."isTranscript" then '"1"' else '"0"' end||','||
          case when new."isUploaded" is null then '' when new."isUploaded" then '"1"' else '"0"' end||','||
          case when new."cTimezone" is null then '' else '"' || replace(replace(cast(new."cTimezone" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cSType" is null then '' else '"' || replace(replace(cast(new."cSType" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cProtocol" is null then '' else '"' || replace(replace(cast(new."cProtocol" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nCaseid" is null then '' else '"' || replace(replace(cast(new."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nRTSid" is null then '' else '"' || replace(replace(cast(new."nRTSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnCaseid" is null then '' else '"' || cast(cast(new."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when new."ZnRTSid" is null then '' else '"' || cast(cast(new."ZnRTSid" as numeric) as varchar) || '"' end||','||
          case when new."ZnSesid" is null then '' else '"' || cast(cast(new."ZnSesid" as numeric) as varchar) || '"' end||','||
          case when new."bRefresh" is null then '' when new."bRefresh" then '"1"' else '"0"' end||','||
          case when new."cSessionUnicId" is null then '' else '"' || replace(replace(cast(new."cSessionUnicId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end; 
                                    var_old_data := 
          case when old."nSesid" is null then '' else '"' || replace(replace(cast(old."nSesid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cName" is null then '' else '"' || replace(replace(cast(old."cName" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dStartDt" is null then '' when isfinite(old."dStartDt") then '"' || to_char(old."dStartDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."nDays" is null then '' else '"' || cast(cast(old."nDays" as numeric) as varchar) || '"' end||','||
          case when old."nLines" is null then '' else '"' || cast(cast(old."nLines" as numeric) as varchar) || '"' end||','||
          case when old."nPageno" is null then '' else '"' || cast(cast(old."nPageno" as numeric) as varchar) || '"' end||','||
          case when old."cUnicuserid" is null then '' else '"' || replace(replace(cast(old."cUnicuserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cStatus" is null then '' else '"' || replace(replace(cast(old."cStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dCreatedt" is null then '' when isfinite(old."dCreatedt") then '"' || to_char(old."dCreatedt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."cNotifytype" is null then '' else '"' || replace(replace(cast(old."cNotifytype" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dUpdatedt" is null then '' when isfinite(old."dUpdatedt") then '"' || to_char(old."dUpdatedt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."dDelDt" is null then '' when isfinite(old."dDelDt") then '"' || to_char(old."dDelDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."isTranscript" is null then '' when old."isTranscript" then '"1"' else '"0"' end||','||
          case when old."isUploaded" is null then '' when old."isUploaded" then '"1"' else '"0"' end||','||
          case when old."cTimezone" is null then '' else '"' || replace(replace(cast(old."cTimezone" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cSType" is null then '' else '"' || replace(replace(cast(old."cSType" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cProtocol" is null then '' else '"' || replace(replace(cast(old."cProtocol" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nCaseid" is null then '' else '"' || replace(replace(cast(old."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nRTSid" is null then '' else '"' || replace(replace(cast(old."nRTSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnCaseid" is null then '' else '"' || cast(cast(old."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when old."ZnRTSid" is null then '' else '"' || cast(cast(old."ZnRTSid" as numeric) as varchar) || '"' end||','||
          case when old."ZnSesid" is null then '' else '"' || cast(cast(old."ZnSesid" as numeric) as varchar) || '"' end||','||
          case when old."bRefresh" is null then '' when old."bRefresh" then '"1"' else '"0"' end||','||
          case when old."cSessionUnicId" is null then '' else '"' || replace(replace(cast(old."cSessionUnicId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'RSessionMaster',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      258,                                                                                                                                             
                                      
          case when old."nSesid" is null then '' else '"' || replace(replace(cast(old."nSesid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'public_rsessionmaster',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
