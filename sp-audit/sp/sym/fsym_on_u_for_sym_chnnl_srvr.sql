CREATE OR REPLACE FUNCTION sym.fsym_on_u_for_sym_chnnl_srvr()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."channel_id" is null then '' else '"' || replace(replace(cast(new."channel_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."processing_order" is null then '' else '"' || cast(cast(new."processing_order" as numeric) as varchar) || '"' end||','||
          case when new."max_batch_size" is null then '' else '"' || cast(cast(new."max_batch_size" as numeric) as varchar) || '"' end||','||
          case when new."max_batch_to_send" is null then '' else '"' || cast(cast(new."max_batch_to_send" as numeric) as varchar) || '"' end||','||
          case when new."max_data_to_route" is null then '' else '"' || cast(cast(new."max_data_to_route" as numeric) as varchar) || '"' end||','||
          case when new."extract_period_millis" is null then '' else '"' || cast(cast(new."extract_period_millis" as numeric) as varchar) || '"' end||','||
          case when new."enabled" is null then '' else '"' || cast(cast(new."enabled" as numeric) as varchar) || '"' end||','||
          case when new."use_old_data_to_route" is null then '' else '"' || cast(cast(new."use_old_data_to_route" as numeric) as varchar) || '"' end||','||
          case when new."use_row_data_to_route" is null then '' else '"' || cast(cast(new."use_row_data_to_route" as numeric) as varchar) || '"' end||','||
          case when new."use_pk_data_to_route" is null then '' else '"' || cast(cast(new."use_pk_data_to_route" as numeric) as varchar) || '"' end||','||
          case when new."reload_flag" is null then '' else '"' || cast(cast(new."reload_flag" as numeric) as varchar) || '"' end||','||
          case when new."file_sync_flag" is null then '' else '"' || cast(cast(new."file_sync_flag" as numeric) as varchar) || '"' end||','||
          case when new."contains_big_lob" is null then '' else '"' || cast(cast(new."contains_big_lob" as numeric) as varchar) || '"' end||','||
          case when new."batch_algorithm" is null then '' else '"' || replace(replace(cast(new."batch_algorithm" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."data_loader_type" is null then '' else '"' || replace(replace(cast(new."data_loader_type" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."description" is null then '' else '"' || replace(replace(cast(new."description" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."queue" is null then '' else '"' || replace(replace(cast(new."queue" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."max_network_kbps" is null then '' else '"' || cast(cast(new."max_network_kbps" as numeric) as varchar) || '"' end||','||
          case when new."data_event_action" is null then '' else '"' || replace(replace(cast(new."data_event_action" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."create_time" is null then '' when isfinite(new."create_time") then '"' || to_char(new."create_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."last_update_by" is null then '' else '"' || replace(replace(cast(new."last_update_by" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."last_update_time" is null then '' when isfinite(new."last_update_time") then '"' || to_char(new."last_update_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end; 
                                    var_old_data := null; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'sym_channel',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      213,                                                                                                                                             
                                      
          case when old."channel_id" is null then '' else '"' || replace(replace(cast(old."channel_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'config',                                                                                                                                                
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
