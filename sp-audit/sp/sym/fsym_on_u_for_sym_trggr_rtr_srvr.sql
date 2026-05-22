CREATE OR REPLACE FUNCTION sym.fsym_on_u_for_sym_trggr_rtr_srvr()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."trigger_id" is null then '' else '"' || replace(replace(cast(new."trigger_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."router_id" is null then '' else '"' || replace(replace(cast(new."router_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."enabled" is null then '' else '"' || cast(cast(new."enabled" as numeric) as varchar) || '"' end||','||
          case when new."initial_load_order" is null then '' else '"' || cast(cast(new."initial_load_order" as numeric) as varchar) || '"' end||','||
          case when new."initial_load_select" is null then '' else '"' || replace(replace(cast(new."initial_load_select" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."initial_load_delete_stmt" is null then '' else '"' || replace(replace(cast(new."initial_load_delete_stmt" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ping_back_enabled" is null then '' else '"' || cast(cast(new."ping_back_enabled" as numeric) as varchar) || '"' end||','||
          case when new."create_time" is null then '' when isfinite(new."create_time") then '"' || to_char(new."create_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."last_update_by" is null then '' else '"' || replace(replace(cast(new."last_update_by" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."last_update_time" is null then '' when isfinite(new."last_update_time") then '"' || to_char(new."last_update_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."description" is null then '' else '"' || replace(replace(cast(new."description" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."data_refresh_type" is null then '' else '"' || replace(replace(cast(new."data_refresh_type" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end; 
                                    var_old_data := null; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'sym_trigger_router',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      202,                                                                                                                                             
                                      
          case when old."trigger_id" is null then '' else '"' || replace(replace(cast(old."trigger_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."router_id" is null then '' else '"' || replace(replace(cast(old."router_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'config',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
