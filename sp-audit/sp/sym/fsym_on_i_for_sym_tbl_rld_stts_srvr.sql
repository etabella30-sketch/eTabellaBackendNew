CREATE OR REPLACE FUNCTION sym.fsym_on_i_for_sym_tbl_rld_stts_srvr()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'sym_table_reload_status',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      200,                                                                                                                                             
                                      
          case when new."load_id" is null then '' else '"' || cast(cast(new."load_id" as numeric) as varchar) || '"' end||','||
          case when new."source_node_id" is null then '' else '"' || replace(replace(cast(new."source_node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."target_node_id" is null then '' else '"' || replace(replace(cast(new."target_node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."start_time" is null then '' when isfinite(new."start_time") then '"' || to_char(new."start_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."end_time" is null then '' when isfinite(new."end_time") then '"' || to_char(new."end_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."completed" is null then '' else '"' || cast(cast(new."completed" as numeric) as varchar) || '"' end||','||
          case when new."cancelled" is null then '' else '"' || cast(cast(new."cancelled" as numeric) as varchar) || '"' end||','||
          case when new."full_load" is null then '' else '"' || cast(cast(new."full_load" as numeric) as varchar) || '"' end||','||
          case when new."start_data_batch_id" is null then '' else '"' || cast(cast(new."start_data_batch_id" as numeric) as varchar) || '"' end||','||
          case when new."end_data_batch_id" is null then '' else '"' || cast(cast(new."end_data_batch_id" as numeric) as varchar) || '"' end||','||
          case when new."setup_batch_count" is null then '' else '"' || cast(cast(new."setup_batch_count" as numeric) as varchar) || '"' end||','||
          case when new."data_batch_count" is null then '' else '"' || cast(cast(new."data_batch_count" as numeric) as varchar) || '"' end||','||
          case when new."finalize_batch_count" is null then '' else '"' || cast(cast(new."finalize_batch_count" as numeric) as varchar) || '"' end||','||
          case when new."setup_batch_loaded" is null then '' else '"' || cast(cast(new."setup_batch_loaded" as numeric) as varchar) || '"' end||','||
          case when new."data_batch_loaded" is null then '' else '"' || cast(cast(new."data_batch_loaded" as numeric) as varchar) || '"' end||','||
          case when new."finalize_batch_loaded" is null then '' else '"' || cast(cast(new."finalize_batch_loaded" as numeric) as varchar) || '"' end||','||
          case when new."table_count" is null then '' else '"' || cast(cast(new."table_count" as numeric) as varchar) || '"' end||','||
          case when new."rows_loaded" is null then '' else '"' || cast(cast(new."rows_loaded" as numeric) as varchar) || '"' end||','||
          case when new."rows_count" is null then '' else '"' || cast(cast(new."rows_count" as numeric) as varchar) || '"' end||','||
          case when new."error_flag" is null then '' else '"' || cast(cast(new."error_flag" as numeric) as varchar) || '"' end||','||
          case when new."error_batch_id" is null then '' else '"' || cast(cast(new."error_batch_id" as numeric) as varchar) || '"' end||','||
          case when new."sql_state" is null then '' else '"' || replace(replace(cast(new."sql_state" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."sql_code" is null then '' else '"' || cast(cast(new."sql_code" as numeric) as varchar) || '"' end||','||
          case when new."sql_message" is null then '' else '"' || replace(replace(cast(new."sql_message" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."last_update_by" is null then '' else '"' || replace(replace(cast(new."last_update_by" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."last_update_time" is null then '' when isfinite(new."last_update_time") then '"' || to_char(new."last_update_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."batch_bulk_load_count" is null then '' else '"' || cast(cast(new."batch_bulk_load_count" as numeric) as varchar) || '"' end||','||
          case when new."row_bulk_load_count" is null then '' else '"' || cast(cast(new."row_bulk_load_count" as numeric) as varchar) || '"' end,                                                                                                                                                      
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
