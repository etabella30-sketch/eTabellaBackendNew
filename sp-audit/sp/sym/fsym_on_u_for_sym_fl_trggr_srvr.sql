CREATE OR REPLACE FUNCTION sym.fsym_on_u_for_sym_fl_trggr_srvr()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."trigger_id" is null then '' else '"' || replace(replace(cast(new."trigger_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."channel_id" is null then '' else '"' || replace(replace(cast(new."channel_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."reload_channel_id" is null then '' else '"' || replace(replace(cast(new."reload_channel_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."base_dir" is null then '' else '"' || replace(replace(cast(new."base_dir" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."recurse" is null then '' else '"' || cast(cast(new."recurse" as numeric) as varchar) || '"' end||','||
          case when new."includes_files" is null then '' else '"' || replace(replace(cast(new."includes_files" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."excludes_files" is null then '' else '"' || replace(replace(cast(new."excludes_files" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."sync_on_create" is null then '' else '"' || cast(cast(new."sync_on_create" as numeric) as varchar) || '"' end||','||
          case when new."sync_on_modified" is null then '' else '"' || cast(cast(new."sync_on_modified" as numeric) as varchar) || '"' end||','||
          case when new."sync_on_delete" is null then '' else '"' || cast(cast(new."sync_on_delete" as numeric) as varchar) || '"' end||','||
          case when new."sync_on_ctl_file" is null then '' else '"' || cast(cast(new."sync_on_ctl_file" as numeric) as varchar) || '"' end||','||
          case when new."delete_after_sync" is null then '' else '"' || cast(cast(new."delete_after_sync" as numeric) as varchar) || '"' end||','||
          case when new."before_copy_script" is null then '' else '"' || replace(replace(cast(new."before_copy_script" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."after_copy_script" is null then '' else '"' || replace(replace(cast(new."after_copy_script" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."create_time" is null then '' when isfinite(new."create_time") then '"' || to_char(new."create_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."last_update_by" is null then '' else '"' || replace(replace(cast(new."last_update_by" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."last_update_time" is null then '' when isfinite(new."last_update_time") then '"' || to_char(new."last_update_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."description" is null then '' else '"' || replace(replace(cast(new."description" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end; 
                                    var_old_data := null; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'sym_file_trigger',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      197,                                                                                                                                             
                                      
          case when old."trigger_id" is null then '' else '"' || replace(replace(cast(old."trigger_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
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
