CREATE OR REPLACE FUNCTION sym.fsym_on_u_for_sym_nd_scrty_srvr()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."node_id" is null then '' else '"' || replace(replace(cast(new."node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."node_password" is null then '' else '"' || replace(replace(cast(new."node_password" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."registration_enabled" is null then '' else '"' || cast(cast(new."registration_enabled" as numeric) as varchar) || '"' end||','||
          case when new."registration_time" is null then '' when isfinite(new."registration_time") then '"' || to_char(new."registration_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."registration_not_before" is null then '' when isfinite(new."registration_not_before") then '"' || to_char(new."registration_not_before", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."registration_not_after" is null then '' when isfinite(new."registration_not_after") then '"' || to_char(new."registration_not_after", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."initial_load_enabled" is null then '' else '"' || cast(cast(new."initial_load_enabled" as numeric) as varchar) || '"' end||','||
          case when new."initial_load_time" is null then '' when isfinite(new."initial_load_time") then '"' || to_char(new."initial_load_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."initial_load_end_time" is null then '' when isfinite(new."initial_load_end_time") then '"' || to_char(new."initial_load_end_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."initial_load_id" is null then '' else '"' || cast(cast(new."initial_load_id" as numeric) as varchar) || '"' end||','||
          case when new."initial_load_create_by" is null then '' else '"' || replace(replace(cast(new."initial_load_create_by" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."partial_load_time" is null then '' when isfinite(new."partial_load_time") then '"' || to_char(new."partial_load_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."partial_load_end_time" is null then '' when isfinite(new."partial_load_end_time") then '"' || to_char(new."partial_load_end_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."partial_load_id" is null then '' else '"' || cast(cast(new."partial_load_id" as numeric) as varchar) || '"' end||','||
          case when new."partial_load_create_by" is null then '' else '"' || replace(replace(cast(new."partial_load_create_by" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."rev_initial_load_enabled" is null then '' else '"' || cast(cast(new."rev_initial_load_enabled" as numeric) as varchar) || '"' end||','||
          case when new."rev_initial_load_time" is null then '' when isfinite(new."rev_initial_load_time") then '"' || to_char(new."rev_initial_load_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."rev_initial_load_id" is null then '' else '"' || cast(cast(new."rev_initial_load_id" as numeric) as varchar) || '"' end||','||
          case when new."rev_initial_load_create_by" is null then '' else '"' || replace(replace(cast(new."rev_initial_load_create_by" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."failed_logins" is null then '' else '"' || cast(cast(new."failed_logins" as numeric) as varchar) || '"' end||','||
          case when new."created_at_node_id" is null then '' else '"' || replace(replace(cast(new."created_at_node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end; 
                                    var_old_data := null; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'sym_node_security',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      207,                                                                                                                                             
                                      
          case when old."node_id" is null then '' else '"' || replace(replace(cast(old."node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'system',                                                                                                                                                
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
