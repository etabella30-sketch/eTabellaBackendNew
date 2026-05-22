CREATE OR REPLACE FUNCTION sym.fsym_on_i_for_sym_rtr_srvr()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'sym_router',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      188,                                                                                                                                             
                                      
          case when new."router_id" is null then '' else '"' || replace(replace(cast(new."router_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."target_catalog_name" is null then '' else '"' || replace(replace(cast(new."target_catalog_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."target_schema_name" is null then '' else '"' || replace(replace(cast(new."target_schema_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."target_table_name" is null then '' else '"' || replace(replace(cast(new."target_table_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."source_node_group_id" is null then '' else '"' || replace(replace(cast(new."source_node_group_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."target_node_group_id" is null then '' else '"' || replace(replace(cast(new."target_node_group_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."router_type" is null then '' else '"' || replace(replace(cast(new."router_type" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."router_expression" is null then '' else '"' || replace(replace(cast(new."router_expression" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."sync_on_update" is null then '' else '"' || cast(cast(new."sync_on_update" as numeric) as varchar) || '"' end||','||
          case when new."sync_on_insert" is null then '' else '"' || cast(cast(new."sync_on_insert" as numeric) as varchar) || '"' end||','||
          case when new."sync_on_delete" is null then '' else '"' || cast(cast(new."sync_on_delete" as numeric) as varchar) || '"' end||','||
          case when new."use_source_catalog_schema" is null then '' else '"' || cast(cast(new."use_source_catalog_schema" as numeric) as varchar) || '"' end||','||
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
