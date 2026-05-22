CREATE OR REPLACE FUNCTION public.fsym_on_u_for_pblc_rltmsrvrs_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nRTSid" is null then '' else '"' || replace(replace(cast(new."nRTSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cUrl" is null then '' else '"' || replace(replace(cast(new."cUrl" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nPort" is null then '' else '"' || cast(cast(new."nPort" as numeric) as varchar) || '"' end||','||
          case when new."cName" is null then '' else '"' || replace(replace(cast(new."cName" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnRTSid" is null then '' else '"' || cast(cast(new."ZnRTSid" as numeric) as varchar) || '"' end||','||
          case when new."bIsDefault" is null then '' when new."bIsDefault" then '"1"' else '"0"' end||','||
          case when new."cSessionUnicId" is null then '' else '"' || replace(replace(cast(new."cSessionUnicId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end; 
                                    var_old_data := 
          case when old."nRTSid" is null then '' else '"' || replace(replace(cast(old."nRTSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cUrl" is null then '' else '"' || replace(replace(cast(old."cUrl" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nPort" is null then '' else '"' || cast(cast(old."nPort" as numeric) as varchar) || '"' end||','||
          case when old."cName" is null then '' else '"' || replace(replace(cast(old."cName" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnRTSid" is null then '' else '"' || cast(cast(old."ZnRTSid" as numeric) as varchar) || '"' end||','||
          case when old."bIsDefault" is null then '' when old."bIsDefault" then '"1"' else '"0"' end||','||
          case when old."cSessionUnicId" is null then '' else '"' || replace(replace(cast(old."cSessionUnicId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'RealtimeServers',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      250,                                                                                                                                             
                                      
          case when old."nRTSid" is null then '' else '"' || replace(replace(cast(old."nRTSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'public_realtimeservers',                                                                                                                                                
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
