CREATE OR REPLACE FUNCTION sym.fsym_on_u_for_sym_trnsfrm_clmn_srvr()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."transform_id" is null then '' else '"' || replace(replace(cast(new."transform_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."include_on" is null then '' else '"' || replace(replace(cast(new."include_on" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."target_column_name" is null then '' else '"' || replace(replace(cast(new."target_column_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."source_column_name" is null then '' else '"' || replace(replace(cast(new."source_column_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."pk" is null then '' else '"' || cast(cast(new."pk" as numeric) as varchar) || '"' end||','||
          case when new."transform_type" is null then '' else '"' || replace(replace(cast(new."transform_type" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."transform_expression" is null then '' else '"' || replace(replace(cast(new."transform_expression" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."transform_order" is null then '' else '"' || cast(cast(new."transform_order" as numeric) as varchar) || '"' end||','||
          case when new."create_time" is null then '' when isfinite(new."create_time") then '"' || to_char(new."create_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."last_update_by" is null then '' else '"' || replace(replace(cast(new."last_update_by" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."last_update_time" is null then '' when isfinite(new."last_update_time") then '"' || to_char(new."last_update_time", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."description" is null then '' else '"' || replace(replace(cast(new."description" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end; 
                                    var_old_data := null; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'sym_transform_column',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      198,                                                                                                                                             
                                      
          case when old."transform_id" is null then '' else '"' || replace(replace(cast(old."transform_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."include_on" is null then '' else '"' || replace(replace(cast(old."include_on" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."target_column_name" is null then '' else '"' || replace(replace(cast(old."target_column_name" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
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
