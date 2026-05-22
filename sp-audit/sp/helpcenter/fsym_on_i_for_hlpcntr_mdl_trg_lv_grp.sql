CREATE OR REPLACE FUNCTION helpcenter.fsym_on_i_for_hlpcntr_mdl_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'Module',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      282,                                                                                                                                             
                                      
          case when new."nMainid" is null then '' else '"' || replace(replace(cast(new."nMainid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cTitle" is null then '' else '"' || replace(replace(cast(new."cTitle" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cImage" is null then '' else '"' || replace(replace(cast(new."cImage" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dCreateDt" is null then '' when isfinite(new."dCreateDt") then '"' || to_char(new."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."ZnMainid" is null then '' else '"' || cast(cast(new."ZnMainid" as numeric) as varchar) || '"' end,                                                                                                                                                      
                                      'helpcenter_module',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
