CREATE OR REPLACE FUNCTION sym.fsym_on_i_for_sym_trggr_srvr()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'sym_trigger',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      212,                                                                                                                                             
                                      
          case when new."trigger_id" is null then '' else '"' || replace(replace(cast(new."trigger_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."source_catalog_name" is null then '' else '"' || replace(replace(cast(new."source_catalog_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."source_schema_name" is null then '' else '"' || replace(replace(cast(new."source_schema_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."source_table_name" is null then '' else '"' || replace(replace(cast(new."source_table_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."channel_id" is null then '' else '"' || replace(replace(cast(new."channel_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."reload_channel_id" is null then '' else '"' || replace(replace(cast(new."reload_channel_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."sync_on_update" is null then '' else '"' || cast(cast(new."sync_on_update" as numeric) as varchar) || '"' end||','||
          case when new."sync_on_insert" is null then '' else '"' || cast(cast(new."sync_on_insert" as numeric) as varchar) || '"' end||','||
          case when new."sync_on_delete" is null then '' else '"' || cast(cast(new."sync_on_delete" as numeric) as varchar) || '"' end||','||
          case when new."sync_on_incoming_batch" is null then '' else '"' || cast(cast(new."sync_on_incoming_batch" as numeric) as varchar) || '"' end||','||
          case when new."name_for_update_trigger" is null then '' else '"' || replace(replace(cast(new."name_for_update_trigger" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."name_for_insert_trigger" is null then '' else '"' || replace(replace(cast(new."name_for_insert_trigger" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."name_for_delete_trigger" is null then '' else '"' || replace(replace(cast(new."name_for_delete_trigger" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."sync_on_update_condition" is null then '' else '"' || replace(replace(cast(new."sync_on_update_condition" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."sync_on_insert_condition" is null then '' else '"' || replace(replace(cast(new."sync_on_insert_condition" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."sync_on_delete_condition" is null then '' else '"' || replace(replace(cast(new."sync_on_delete_condition" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."custom_before_update_text" is null then '' else '"' || replace(replace(cast(new."custom_before_update_text" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."custom_before_insert_text" is null then '' else '"' || replace(replace(cast(new."custom_before_insert_text" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."custom_before_delete_text" is null then '' else '"' || replace(replace(cast(new."custom_before_delete_text" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."custom_on_update_text" is null then '' else '"' || replace(replace(cast(new."custom_on_update_text" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."custom_on_insert_text" is null then '' else '"' || replace(replace(cast(new."custom_on_insert_text" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."custom_on_delete_text" is null then '' else '"' || replace(replace(cast(new."custom_on_delete_text" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."external_select" is null then '' else '"' || replace(replace(cast(new."external_select" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."tx_id_expression" is null then '' else '"' || replace(replace(cast(new."tx_id_expression" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."channel_expression" is null then '' else '"' || replace(replace(cast(new."channel_expression" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."excluded_column_names" is null then '' else '"' || replace(replace(cast(new."excluded_column_names" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."included_column_names" is null then '' else '"' || replace(replace(cast(new."included_column_names" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."sync_key_names" is null then '' else '"' || replace(replace(cast(new."sync_key_names" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."use_stream_lobs" is null then '' else '"' || cast(cast(new."use_stream_lobs" as numeric) as varchar) || '"' end||','||
          case when new."use_capture_lobs" is null then '' else '"' || cast(cast(new."use_capture_lobs" as numeric) as varchar) || '"' end||','||
          case when new."use_capture_old_data" is null then '' else '"' || cast(cast(new."use_capture_old_data" as numeric) as varchar) || '"' end||','||
          case when new."use_handle_key_updates" is null then '' else '"' || cast(cast(new."use_handle_key_updates" as numeric) as varchar) || '"' end||','||
          case when new."stream_row" is null then '' else '"' || cast(cast(new."stream_row" as numeric) as varchar) || '"' end||','||
          case when new."time_based_column_name" is null then '' else '"' || replace(replace(cast(new."time_based_column_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."create_time" is null then '' when isfinite(new."create_time") then '"' || to_char(new."create_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."last_update_by" is null then '' else '"' || replace(replace(cast(new."last_update_by" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."last_update_time" is null then '' when isfinite(new."last_update_time") then '"' || to_char(new."last_update_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."description" is null then '' else '"' || replace(replace(cast(new."description" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."capture_changes_only" is null then '' else '"' || cast(cast(new."capture_changes_only" as numeric) as varchar) || '"' end,                                                                                                                                                      
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
