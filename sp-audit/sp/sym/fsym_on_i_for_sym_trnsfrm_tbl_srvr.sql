CREATE OR REPLACE FUNCTION sym.fsym_on_i_for_sym_trnsfrm_tbl_srvr()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'sym_transform_table',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      189,                                                                                                                                             
                                      
          case when new."transform_id" is null then '' else '"' || replace(replace(cast(new."transform_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."source_node_group_id" is null then '' else '"' || replace(replace(cast(new."source_node_group_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."target_node_group_id" is null then '' else '"' || replace(replace(cast(new."target_node_group_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."transform_point" is null then '' else '"' || replace(replace(cast(new."transform_point" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."source_catalog_name" is null then '' else '"' || replace(replace(cast(new."source_catalog_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."source_schema_name" is null then '' else '"' || replace(replace(cast(new."source_schema_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."source_table_name" is null then '' else '"' || replace(replace(cast(new."source_table_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."target_catalog_name" is null then '' else '"' || replace(replace(cast(new."target_catalog_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."target_schema_name" is null then '' else '"' || replace(replace(cast(new."target_schema_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."target_table_name" is null then '' else '"' || replace(replace(cast(new."target_table_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."update_first" is null then '' else '"' || cast(cast(new."update_first" as numeric) as varchar) || '"' end||','||
          case when new."update_action" is null then '' else '"' || replace(replace(cast(new."update_action" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."delete_action" is null then '' else '"' || replace(replace(cast(new."delete_action" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."transform_order" is null then '' else '"' || cast(cast(new."transform_order" as numeric) as varchar) || '"' end||','||
          case when new."column_policy" is null then '' else '"' || replace(replace(cast(new."column_policy" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."create_time" is null then '' when isfinite(new."create_time") then '"' || to_char(new."create_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."last_update_by" is null then '' else '"' || replace(replace(cast(new."last_update_by" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."last_update_time" is null then '' when isfinite(new."last_update_time") then '"' || to_char(new."last_update_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."description" is null then '' else '"' || replace(replace(cast(new."description" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
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
