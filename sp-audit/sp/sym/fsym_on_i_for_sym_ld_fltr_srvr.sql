CREATE OR REPLACE FUNCTION sym.fsym_on_i_for_sym_ld_fltr_srvr()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'sym_load_filter',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      209,                                                                                                                                             
                                      
          case when new."load_filter_id" is null then '' else '"' || replace(replace(cast(new."load_filter_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."load_filter_type" is null then '' else '"' || replace(replace(cast(new."load_filter_type" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."source_node_group_id" is null then '' else '"' || replace(replace(cast(new."source_node_group_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."target_node_group_id" is null then '' else '"' || replace(replace(cast(new."target_node_group_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."target_catalog_name" is null then '' else '"' || replace(replace(cast(new."target_catalog_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."target_schema_name" is null then '' else '"' || replace(replace(cast(new."target_schema_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."target_table_name" is null then '' else '"' || replace(replace(cast(new."target_table_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."filter_on_update" is null then '' else '"' || cast(cast(new."filter_on_update" as numeric) as varchar) || '"' end||','||
          case when new."filter_on_insert" is null then '' else '"' || cast(cast(new."filter_on_insert" as numeric) as varchar) || '"' end||','||
          case when new."filter_on_delete" is null then '' else '"' || cast(cast(new."filter_on_delete" as numeric) as varchar) || '"' end||','||
          case when new."before_write_script" is null then '' else '"' || replace(replace(cast(new."before_write_script" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."after_write_script" is null then '' else '"' || replace(replace(cast(new."after_write_script" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."batch_complete_script" is null then '' else '"' || replace(replace(cast(new."batch_complete_script" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."batch_commit_script" is null then '' else '"' || replace(replace(cast(new."batch_commit_script" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."batch_rollback_script" is null then '' else '"' || replace(replace(cast(new."batch_rollback_script" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."handle_error_script" is null then '' else '"' || replace(replace(cast(new."handle_error_script" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."create_time" is null then '' when isfinite(new."create_time") then '"' || to_char(new."create_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."last_update_by" is null then '' else '"' || replace(replace(cast(new."last_update_by" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."last_update_time" is null then '' when isfinite(new."last_update_time") then '"' || to_char(new."last_update_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."load_filter_order" is null then '' else '"' || cast(cast(new."load_filter_order" as numeric) as varchar) || '"' end||','||
          case when new."fail_on_error" is null then '' else '"' || cast(cast(new."fail_on_error" as numeric) as varchar) || '"' end,                                                                                                                                                      
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
