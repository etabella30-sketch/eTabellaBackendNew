CREATE OR REPLACE FUNCTION sym.fsym_on_d_for_sym_xtrct_rqst_srvr()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'sym_extract_request',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      215,                                                                                                                                             
                                      
          case when old."request_id" is null then '' else '"' || cast(cast(old."request_id" as numeric) as varchar) || '"' end||','||
          case when old."source_node_id" is null then '' else '"' || replace(replace(cast(old."source_node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."request_id" is null then '' else '"' || cast(cast(old."request_id" as numeric) as varchar) || '"' end||','||
          case when old."source_node_id" is null then '' else '"' || replace(replace(cast(old."source_node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."node_id" is null then '' else '"' || replace(replace(cast(old."node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."queue" is null then '' else '"' || replace(replace(cast(old."queue" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."status" is null then '' else '"' || replace(replace(cast(old."status" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."start_batch_id" is null then '' else '"' || cast(cast(old."start_batch_id" as numeric) as varchar) || '"' end||','||
          case when old."end_batch_id" is null then '' else '"' || cast(cast(old."end_batch_id" as numeric) as varchar) || '"' end||','||
          case when old."trigger_id" is null then '' else '"' || replace(replace(cast(old."trigger_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."router_id" is null then '' else '"' || replace(replace(cast(old."router_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."load_id" is null then '' else '"' || cast(cast(old."load_id" as numeric) as varchar) || '"' end||','||
          case when old."table_name" is null then '' else '"' || replace(replace(cast(old."table_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."extracted_rows" is null then '' else '"' || cast(cast(old."extracted_rows" as numeric) as varchar) || '"' end||','||
          case when old."extracted_millis" is null then '' else '"' || cast(cast(old."extracted_millis" as numeric) as varchar) || '"' end||','||
          case when old."transferred_rows" is null then '' else '"' || cast(cast(old."transferred_rows" as numeric) as varchar) || '"' end||','||
          case when old."transferred_millis" is null then '' else '"' || cast(cast(old."transferred_millis" as numeric) as varchar) || '"' end||','||
          case when old."last_transferred_batch_id" is null then '' else '"' || cast(cast(old."last_transferred_batch_id" as numeric) as varchar) || '"' end||','||
          case when old."loaded_rows" is null then '' else '"' || cast(cast(old."loaded_rows" as numeric) as varchar) || '"' end||','||
          case when old."loaded_millis" is null then '' else '"' || cast(cast(old."loaded_millis" as numeric) as varchar) || '"' end||','||
          case when old."last_loaded_batch_id" is null then '' else '"' || cast(cast(old."last_loaded_batch_id" as numeric) as varchar) || '"' end||','||
          case when old."total_rows" is null then '' else '"' || cast(cast(old."total_rows" as numeric) as varchar) || '"' end||','||
          case when old."loaded_time" is null then '' when isfinite(old."loaded_time") then '"' || to_char(old."loaded_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."parent_request_id" is null then '' else '"' || cast(cast(old."parent_request_id" as numeric) as varchar) || '"' end||','||
          case when old."extract_thread_id" is null then '' else '"' || cast(cast(old."extract_thread_id" as numeric) as varchar) || '"' end||','||
          case when old."load_thread_id" is null then '' else '"' || cast(cast(old."load_thread_id" as numeric) as varchar) || '"' end||','||
          case when old."last_update_time" is null then '' when isfinite(old."last_update_time") then '"' || to_char(old."last_update_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."create_time" is null then '' when isfinite(old."create_time") then '"' || to_char(old."create_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."bulk_rows_loaded" is null then '' else '"' || cast(cast(old."bulk_rows_loaded" as numeric) as varchar) || '"' end||','||
          case when old."byte_count" is null then '' else '"' || cast(cast(old."byte_count" as numeric) as varchar) || '"' end||','||
          case when old."conflicted_rows" is null then '' else '"' || cast(cast(old."conflicted_rows" as numeric) as varchar) || '"' end,                                                                                                                                                   
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
