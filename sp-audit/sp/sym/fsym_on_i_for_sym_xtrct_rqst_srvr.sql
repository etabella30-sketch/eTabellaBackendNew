CREATE OR REPLACE FUNCTION sym.fsym_on_i_for_sym_xtrct_rqst_srvr()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'sym_extract_request',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      215,                                                                                                                                             
                                      
          case when new."request_id" is null then '' else '"' || cast(cast(new."request_id" as numeric) as varchar) || '"' end||','||
          case when new."source_node_id" is null then '' else '"' || replace(replace(cast(new."source_node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."node_id" is null then '' else '"' || replace(replace(cast(new."node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."queue" is null then '' else '"' || replace(replace(cast(new."queue" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."status" is null then '' else '"' || replace(replace(cast(new."status" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."start_batch_id" is null then '' else '"' || cast(cast(new."start_batch_id" as numeric) as varchar) || '"' end||','||
          case when new."end_batch_id" is null then '' else '"' || cast(cast(new."end_batch_id" as numeric) as varchar) || '"' end||','||
          case when new."trigger_id" is null then '' else '"' || replace(replace(cast(new."trigger_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."router_id" is null then '' else '"' || replace(replace(cast(new."router_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."load_id" is null then '' else '"' || cast(cast(new."load_id" as numeric) as varchar) || '"' end||','||
          case when new."table_name" is null then '' else '"' || replace(replace(cast(new."table_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."extracted_rows" is null then '' else '"' || cast(cast(new."extracted_rows" as numeric) as varchar) || '"' end||','||
          case when new."extracted_millis" is null then '' else '"' || cast(cast(new."extracted_millis" as numeric) as varchar) || '"' end||','||
          case when new."transferred_rows" is null then '' else '"' || cast(cast(new."transferred_rows" as numeric) as varchar) || '"' end||','||
          case when new."transferred_millis" is null then '' else '"' || cast(cast(new."transferred_millis" as numeric) as varchar) || '"' end||','||
          case when new."last_transferred_batch_id" is null then '' else '"' || cast(cast(new."last_transferred_batch_id" as numeric) as varchar) || '"' end||','||
          case when new."loaded_rows" is null then '' else '"' || cast(cast(new."loaded_rows" as numeric) as varchar) || '"' end||','||
          case when new."loaded_millis" is null then '' else '"' || cast(cast(new."loaded_millis" as numeric) as varchar) || '"' end||','||
          case when new."last_loaded_batch_id" is null then '' else '"' || cast(cast(new."last_loaded_batch_id" as numeric) as varchar) || '"' end||','||
          case when new."total_rows" is null then '' else '"' || cast(cast(new."total_rows" as numeric) as varchar) || '"' end||','||
          case when new."loaded_time" is null then '' when isfinite(new."loaded_time") then '"' || to_char(new."loaded_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."parent_request_id" is null then '' else '"' || cast(cast(new."parent_request_id" as numeric) as varchar) || '"' end||','||
          case when new."extract_thread_id" is null then '' else '"' || cast(cast(new."extract_thread_id" as numeric) as varchar) || '"' end||','||
          case when new."load_thread_id" is null then '' else '"' || cast(cast(new."load_thread_id" as numeric) as varchar) || '"' end||','||
          case when new."last_update_time" is null then '' when isfinite(new."last_update_time") then '"' || to_char(new."last_update_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."create_time" is null then '' when isfinite(new."create_time") then '"' || to_char(new."create_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."bulk_rows_loaded" is null then '' else '"' || cast(cast(new."bulk_rows_loaded" as numeric) as varchar) || '"' end||','||
          case when new."byte_count" is null then '' else '"' || cast(cast(new."byte_count" as numeric) as varchar) || '"' end||','||
          case when new."conflicted_rows" is null then '' else '"' || cast(cast(new."conflicted_rows" as numeric) as varchar) || '"' end,                                                                                                                                                      
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
