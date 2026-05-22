CREATE OR REPLACE FUNCTION sym.fsym_on_i_for_sym_nd_srvr()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'sym_node',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      203,                                                                                                                                             
                                      
          case when new."node_id" is null then '' else '"' || replace(replace(cast(new."node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."node_group_id" is null then '' else '"' || replace(replace(cast(new."node_group_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."external_id" is null then '' else '"' || replace(replace(cast(new."external_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."sync_enabled" is null then '' else '"' || cast(cast(new."sync_enabled" as numeric) as varchar) || '"' end||','||
          case when new."sync_url" is null then '' else '"' || replace(replace(cast(new."sync_url" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."schema_version" is null then '' else '"' || replace(replace(cast(new."schema_version" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."symmetric_version" is null then '' else '"' || replace(replace(cast(new."symmetric_version" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."config_version" is null then '' else '"' || replace(replace(cast(new."config_version" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."database_type" is null then '' else '"' || replace(replace(cast(new."database_type" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."database_version" is null then '' else '"' || replace(replace(cast(new."database_version" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."database_name" is null then '' else '"' || replace(replace(cast(new."database_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."batch_to_send_count" is null then '' else '"' || cast(cast(new."batch_to_send_count" as numeric) as varchar) || '"' end||','||
          case when new."batch_in_error_count" is null then '' else '"' || cast(cast(new."batch_in_error_count" as numeric) as varchar) || '"' end||','||
          case when new."batch_last_successful" is null then '' when isfinite(new."batch_last_successful") then '"' || to_char(new."batch_last_successful", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."data_rows_to_send_count" is null then '' else '"' || cast(cast(new."data_rows_to_send_count" as numeric) as varchar) || '"' end||','||
          case when new."data_rows_loaded_count" is null then '' else '"' || cast(cast(new."data_rows_loaded_count" as numeric) as varchar) || '"' end||','||
          case when new."oldest_load_time" is null then '' when isfinite(new."oldest_load_time") then '"' || to_char(new."oldest_load_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."most_recent_active_table" is null then '' else '"' || replace(replace(cast(new."most_recent_active_table" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."purge_outgoing_last_run_ms" is null then '' else '"' || cast(cast(new."purge_outgoing_last_run_ms" as numeric) as varchar) || '"' end||','||
          case when new."purge_outgoing_last_finish" is null then '' when isfinite(new."purge_outgoing_last_finish") then '"' || to_char(new."purge_outgoing_last_finish", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."purge_outgoing_average_ms" is null then '' else '"' || cast(cast(new."purge_outgoing_average_ms" as numeric) as varchar) || '"' end||','||
          case when new."routing_last_run_ms" is null then '' else '"' || cast(cast(new."routing_last_run_ms" as numeric) as varchar) || '"' end||','||
          case when new."routing_last_finish" is null then '' when isfinite(new."routing_last_finish") then '"' || to_char(new."routing_last_finish", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."routing_average_run_ms" is null then '' else '"' || cast(cast(new."routing_average_run_ms" as numeric) as varchar) || '"' end||','||
          case when new."sym_data_size" is null then '' else '"' || cast(cast(new."sym_data_size" as numeric) as varchar) || '"' end||','||
          case when new."created_at_node_id" is null then '' else '"' || replace(replace(cast(new."created_at_node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."deployment_type" is null then '' else '"' || replace(replace(cast(new."deployment_type" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."deployment_sub_type" is null then '' else '"' || replace(replace(cast(new."deployment_sub_type" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      'system',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
