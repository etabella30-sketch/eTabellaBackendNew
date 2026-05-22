CREATE OR REPLACE FUNCTION sym.fsym_on_d_for_sym_tbl_rld_stts_srvr()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'sym_table_reload_status',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      200,                                                                                                                                             
                                      
          case when old."load_id" is null then '' else '"' || cast(cast(old."load_id" as numeric) as varchar) || '"' end||','||
          case when old."source_node_id" is null then '' else '"' || replace(replace(cast(old."source_node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."load_id" is null then '' else '"' || cast(cast(old."load_id" as numeric) as varchar) || '"' end||','||
          case when old."source_node_id" is null then '' else '"' || replace(replace(cast(old."source_node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."target_node_id" is null then '' else '"' || replace(replace(cast(old."target_node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."start_time" is null then '' when isfinite(old."start_time") then '"' || to_char(old."start_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."end_time" is null then '' when isfinite(old."end_time") then '"' || to_char(old."end_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."completed" is null then '' else '"' || cast(cast(old."completed" as numeric) as varchar) || '"' end||','||
          case when old."cancelled" is null then '' else '"' || cast(cast(old."cancelled" as numeric) as varchar) || '"' end||','||
          case when old."full_load" is null then '' else '"' || cast(cast(old."full_load" as numeric) as varchar) || '"' end||','||
          case when old."start_data_batch_id" is null then '' else '"' || cast(cast(old."start_data_batch_id" as numeric) as varchar) || '"' end||','||
          case when old."end_data_batch_id" is null then '' else '"' || cast(cast(old."end_data_batch_id" as numeric) as varchar) || '"' end||','||
          case when old."setup_batch_count" is null then '' else '"' || cast(cast(old."setup_batch_count" as numeric) as varchar) || '"' end||','||
          case when old."data_batch_count" is null then '' else '"' || cast(cast(old."data_batch_count" as numeric) as varchar) || '"' end||','||
          case when old."finalize_batch_count" is null then '' else '"' || cast(cast(old."finalize_batch_count" as numeric) as varchar) || '"' end||','||
          case when old."setup_batch_loaded" is null then '' else '"' || cast(cast(old."setup_batch_loaded" as numeric) as varchar) || '"' end||','||
          case when old."data_batch_loaded" is null then '' else '"' || cast(cast(old."data_batch_loaded" as numeric) as varchar) || '"' end||','||
          case when old."finalize_batch_loaded" is null then '' else '"' || cast(cast(old."finalize_batch_loaded" as numeric) as varchar) || '"' end||','||
          case when old."table_count" is null then '' else '"' || cast(cast(old."table_count" as numeric) as varchar) || '"' end||','||
          case when old."rows_loaded" is null then '' else '"' || cast(cast(old."rows_loaded" as numeric) as varchar) || '"' end||','||
          case when old."rows_count" is null then '' else '"' || cast(cast(old."rows_count" as numeric) as varchar) || '"' end||','||
          case when old."error_flag" is null then '' else '"' || cast(cast(old."error_flag" as numeric) as varchar) || '"' end||','||
          case when old."error_batch_id" is null then '' else '"' || cast(cast(old."error_batch_id" as numeric) as varchar) || '"' end||','||
          case when old."sql_state" is null then '' else '"' || replace(replace(cast(old."sql_state" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."sql_code" is null then '' else '"' || cast(cast(old."sql_code" as numeric) as varchar) || '"' end||','||
          case when old."sql_message" is null then '' else '"' || replace(replace(cast(old."sql_message" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."last_update_by" is null then '' else '"' || replace(replace(cast(old."last_update_by" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."last_update_time" is null then '' when isfinite(old."last_update_time") then '"' || to_char(old."last_update_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."batch_bulk_load_count" is null then '' else '"' || cast(cast(old."batch_bulk_load_count" as numeric) as varchar) || '"' end||','||
          case when old."row_bulk_load_count" is null then '' else '"' || cast(cast(old."row_bulk_load_count" as numeric) as varchar) || '"' end,                                                                                                                                                   
                                      'monitor',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
