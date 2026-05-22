CREATE OR REPLACE FUNCTION sym.fsym_on_i_for_sym_tgng_rrr_srvr()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'sym_outgoing_error',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      214,                                                                                                                                             
                                      
          case when new."batch_id" is null then '' else '"' || cast(cast(new."batch_id" as numeric) as varchar) || '"' end||','||
          case when new."node_id" is null then '' else '"' || replace(replace(cast(new."node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."failed_row_number" is null then '' else '"' || cast(cast(new."failed_row_number" as numeric) as varchar) || '"' end||','||
          case when new."failed_line_number" is null then '' else '"' || cast(cast(new."failed_line_number" as numeric) as varchar) || '"' end||','||
          case when new."target_catalog_name" is null then '' else '"' || replace(replace(cast(new."target_catalog_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."target_schema_name" is null then '' else '"' || replace(replace(cast(new."target_schema_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."target_table_name" is null then '' else '"' || replace(replace(cast(new."target_table_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."event_type" is null then '' else '"' || replace(replace(cast(new."event_type" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."binary_encoding" is null then '' else '"' || replace(replace(cast(new."binary_encoding" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."column_names" is null then '' else '"' || replace(replace(cast(new."column_names" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."pk_column_names" is null then '' else '"' || replace(replace(cast(new."pk_column_names" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."row_data" is null then '' else '"' || replace(replace(cast(new."row_data" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."old_data" is null then '' else '"' || replace(replace(cast(new."old_data" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cur_data" is null then '' else '"' || replace(replace(cast(new."cur_data" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."resolve_data" is null then '' else '"' || replace(replace(cast(new."resolve_data" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."resolve_ignore" is null then '' else '"' || cast(cast(new."resolve_ignore" as numeric) as varchar) || '"' end||','||
          case when new."conflict_id" is null then '' else '"' || replace(replace(cast(new."conflict_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."create_time" is null then '' when isfinite(new."create_time") then '"' || to_char(new."create_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."last_update_by" is null then '' else '"' || replace(replace(cast(new."last_update_by" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."last_update_time" is null then '' when isfinite(new."last_update_time") then '"' || to_char(new."last_update_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end,                                                                                                                                                      
                                      'system',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
