CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_rsssnmstr_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'RSessionMaster',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      258,                                                                                                                                             
                                      
          case when old."nSesid" is null then '' else '"' || replace(replace(cast(old."nSesid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
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
          case when old."cSessionUnicId" is null then '' else '"' || replace(replace(cast(old."cSessionUnicId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                   
                                      'public_rsessionmaster',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
