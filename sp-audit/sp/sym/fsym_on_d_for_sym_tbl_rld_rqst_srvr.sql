CREATE OR REPLACE FUNCTION sym.fsym_on_d_for_sym_tbl_rld_rqst_srvr()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'sym_table_reload_request',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      192,                                                                                                                                             
                                      
          case when old."target_node_id" is null then '' else '"' || replace(replace(cast(old."target_node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."source_node_id" is null then '' else '"' || replace(replace(cast(old."source_node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."trigger_id" is null then '' else '"' || replace(replace(cast(old."trigger_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."router_id" is null then '' else '"' || replace(replace(cast(old."router_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."create_time" is null then '' when isfinite(old."create_time") then '"' || to_char(old."create_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end,                                                                                                                                                      
                                      
          case when old."target_node_id" is null then '' else '"' || replace(replace(cast(old."target_node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."source_node_id" is null then '' else '"' || replace(replace(cast(old."source_node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."trigger_id" is null then '' else '"' || replace(replace(cast(old."trigger_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."router_id" is null then '' else '"' || replace(replace(cast(old."router_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."create_time" is null then '' when isfinite(old."create_time") then '"' || to_char(old."create_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."create_table" is null then '' else '"' || cast(cast(old."create_table" as numeric) as varchar) || '"' end||','||
          case when old."delete_first" is null then '' else '"' || cast(cast(old."delete_first" as numeric) as varchar) || '"' end||','||
          case when old."reload_select" is null then '' else '"' || replace(replace(cast(old."reload_select" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."before_custom_sql" is null then '' else '"' || replace(replace(cast(old."before_custom_sql" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."reload_time" is null then '' when isfinite(old."reload_time") then '"' || to_char(old."reload_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."load_id" is null then '' else '"' || cast(cast(old."load_id" as numeric) as varchar) || '"' end||','||
          case when old."processed" is null then '' else '"' || cast(cast(old."processed" as numeric) as varchar) || '"' end||','||
          case when old."channel_id" is null then '' else '"' || replace(replace(cast(old."channel_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."last_update_by" is null then '' else '"' || replace(replace(cast(old."last_update_by" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."last_update_time" is null then '' when isfinite(old."last_update_time") then '"' || to_char(old."last_update_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end,                                                                                                                                                   
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
