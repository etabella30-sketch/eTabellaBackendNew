CREATE OR REPLACE FUNCTION sym.fsym_on_i_for_sym_tbl_rld_rqst_srvr()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'sym_table_reload_request',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      192,                                                                                                                                             
                                      
          case when new."target_node_id" is null then '' else '"' || replace(replace(cast(new."target_node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."source_node_id" is null then '' else '"' || replace(replace(cast(new."source_node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."trigger_id" is null then '' else '"' || replace(replace(cast(new."trigger_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."router_id" is null then '' else '"' || replace(replace(cast(new."router_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."create_time" is null then '' when isfinite(new."create_time") then '"' || to_char(new."create_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."create_table" is null then '' else '"' || cast(cast(new."create_table" as numeric) as varchar) || '"' end||','||
          case when new."delete_first" is null then '' else '"' || cast(cast(new."delete_first" as numeric) as varchar) || '"' end||','||
          case when new."reload_select" is null then '' else '"' || replace(replace(cast(new."reload_select" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."before_custom_sql" is null then '' else '"' || replace(replace(cast(new."before_custom_sql" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."reload_time" is null then '' when isfinite(new."reload_time") then '"' || to_char(new."reload_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."load_id" is null then '' else '"' || cast(cast(new."load_id" as numeric) as varchar) || '"' end||','||
          case when new."processed" is null then '' else '"' || cast(cast(new."processed" as numeric) as varchar) || '"' end||','||
          case when new."channel_id" is null then '' else '"' || replace(replace(cast(new."channel_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."last_update_by" is null then '' else '"' || replace(replace(cast(new."last_update_by" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."last_update_time" is null then '' when isfinite(new."last_update_time") then '"' || to_char(new."last_update_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end,                                                                                                                                                      
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
