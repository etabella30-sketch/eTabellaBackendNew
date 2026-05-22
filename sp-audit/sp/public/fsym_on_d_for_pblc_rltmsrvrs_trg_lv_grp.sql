CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_rltmsrvrs_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'RealtimeServers',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      250,                                                                                                                                             
                                      
          case when old."nRTSid" is null then '' else '"' || replace(replace(cast(old."nRTSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nRTSid" is null then '' else '"' || replace(replace(cast(old."nRTSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cUrl" is null then '' else '"' || replace(replace(cast(old."cUrl" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nPort" is null then '' else '"' || cast(cast(old."nPort" as numeric) as varchar) || '"' end||','||
          case when old."cName" is null then '' else '"' || replace(replace(cast(old."cName" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnRTSid" is null then '' else '"' || cast(cast(old."ZnRTSid" as numeric) as varchar) || '"' end||','||
          case when old."bIsDefault" is null then '' when old."bIsDefault" then '"1"' else '"0"' end||','||
          case when old."cSessionUnicId" is null then '' else '"' || replace(replace(cast(old."cSessionUnicId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                   
                                      'public_realtimeservers',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
