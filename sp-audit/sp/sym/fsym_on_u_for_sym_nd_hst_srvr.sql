CREATE OR REPLACE FUNCTION sym.fsym_on_u_for_sym_nd_hst_srvr()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."node_id" is null then '' else '"' || replace(replace(cast(new."node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."host_name" is null then '' else '"' || replace(replace(cast(new."host_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."instance_id" is null then '' else '"' || replace(replace(cast(new."instance_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ip_address" is null then '' else '"' || replace(replace(cast(new."ip_address" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."os_user" is null then '' else '"' || replace(replace(cast(new."os_user" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."os_name" is null then '' else '"' || replace(replace(cast(new."os_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."os_arch" is null then '' else '"' || replace(replace(cast(new."os_arch" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."os_version" is null then '' else '"' || replace(replace(cast(new."os_version" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."available_processors" is null then '' else '"' || cast(cast(new."available_processors" as numeric) as varchar) || '"' end||','||
          case when new."free_memory_bytes" is null then '' else '"' || cast(cast(new."free_memory_bytes" as numeric) as varchar) || '"' end||','||
          case when new."total_memory_bytes" is null then '' else '"' || cast(cast(new."total_memory_bytes" as numeric) as varchar) || '"' end||','||
          case when new."max_memory_bytes" is null then '' else '"' || cast(cast(new."max_memory_bytes" as numeric) as varchar) || '"' end||','||
          case when new."java_version" is null then '' else '"' || replace(replace(cast(new."java_version" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."java_vendor" is null then '' else '"' || replace(replace(cast(new."java_vendor" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jdbc_version" is null then '' else '"' || replace(replace(cast(new."jdbc_version" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."symmetric_version" is null then '' else '"' || replace(replace(cast(new."symmetric_version" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."timezone_offset" is null then '' else '"' || replace(replace(cast(new."timezone_offset" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."heartbeat_time" is null then '' when isfinite(new."heartbeat_time") then '"' || to_char(new."heartbeat_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."last_restart_time" is null then '' when isfinite(new."last_restart_time") then '"' || to_char(new."last_restart_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."create_time" is null then '' when isfinite(new."create_time") then '"' || to_char(new."create_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end; 
                                    var_old_data := null; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'sym_node_host',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      217,                                                                                                                                             
                                      
          case when old."node_id" is null then '' else '"' || replace(replace(cast(old."node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."host_name" is null then '' else '"' || replace(replace(cast(old."host_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'heartbeat',                                                                                                                                                
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
