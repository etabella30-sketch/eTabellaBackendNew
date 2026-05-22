CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_rltmsrvrs_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'RealtimeServers',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      250,                                                                                                                                             
                                      
          case when new."nRTSid" is null then '' else '"' || replace(replace(cast(new."nRTSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cUrl" is null then '' else '"' || replace(replace(cast(new."cUrl" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nPort" is null then '' else '"' || cast(cast(new."nPort" as numeric) as varchar) || '"' end||','||
          case when new."cName" is null then '' else '"' || replace(replace(cast(new."cName" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnRTSid" is null then '' else '"' || cast(cast(new."ZnRTSid" as numeric) as varchar) || '"' end||','||
          case when new."bIsDefault" is null then '' when new."bIsDefault" then '"1"' else '"0"' end||','||
          case when new."cSessionUnicId" is null then '' else '"' || replace(replace(cast(new."cSessionUnicId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
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
