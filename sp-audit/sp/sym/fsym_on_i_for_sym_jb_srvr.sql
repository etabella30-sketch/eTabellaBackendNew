CREATE OR REPLACE FUNCTION sym.fsym_on_i_for_sym_jb_srvr()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'sym_job',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      201,                                                                                                                                             
                                      
          case when new."job_name" is null then '' else '"' || replace(replace(cast(new."job_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."job_type" is null then '' else '"' || replace(replace(cast(new."job_type" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."requires_registration" is null then '' else '"' || cast(cast(new."requires_registration" as numeric) as varchar) || '"' end||','||
          case when new."job_expression" is null then '' else '"' || replace(replace(cast(new."job_expression" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."description" is null then '' else '"' || replace(replace(cast(new."description" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."default_schedule" is null then '' else '"' || replace(replace(cast(new."default_schedule" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."default_auto_start" is null then '' else '"' || cast(cast(new."default_auto_start" as numeric) as varchar) || '"' end||','||
          case when new."node_group_id" is null then '' else '"' || replace(replace(cast(new."node_group_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."is_clustered" is null then '' else '"' || cast(cast(new."is_clustered" as numeric) as varchar) || '"' end||','||
          case when new."create_by" is null then '' else '"' || replace(replace(cast(new."create_by" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."create_time" is null then '' when isfinite(new."create_time") then '"' || to_char(new."create_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."last_update_by" is null then '' else '"' || replace(replace(cast(new."last_update_by" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."last_update_time" is null then '' when isfinite(new."last_update_time") then '"' || to_char(new."last_update_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end,                                                                                                                                                      
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
