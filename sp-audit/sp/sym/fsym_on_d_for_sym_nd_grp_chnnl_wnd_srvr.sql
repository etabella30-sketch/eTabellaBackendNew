CREATE OR REPLACE FUNCTION sym.fsym_on_d_for_sym_nd_grp_chnnl_wnd_srvr()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'sym_node_group_channel_wnd',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      204,                                                                                                                                             
                                      
          case when old."node_group_id" is null then '' else '"' || replace(replace(cast(old."node_group_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."channel_id" is null then '' else '"' || replace(replace(cast(old."channel_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."start_time" is null then '' when isfinite(old."start_time") then '"' || to_char(old."start_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."end_time" is null then '' when isfinite(old."end_time") then '"' || to_char(old."end_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end,                                                                                                                                                      
                                      null,                                                                                                                                                   
                                      'config',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
