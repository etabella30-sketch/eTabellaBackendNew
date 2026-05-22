CREATE OR REPLACE FUNCTION helpcenter.fsym_on_i_for_hlpcntr_sbmdl_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'SubModule',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      261,                                                                                                                                             
                                      
          case when new."nSMid" is null then '' else '"' || replace(replace(cast(new."nSMid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cTitle" is null then '' else '"' || replace(replace(cast(new."cTitle" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cLink" is null then '' else '"' || replace(replace(cast(new."cLink" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cDescription" is null then '' else '"' || replace(replace(cast(new."cDescription" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dCreateDt" is null then '' when isfinite(new."dCreateDt") then '"' || to_char(new."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."jTags" is null then '' else '"' || replace(replace(cast(new."jTags" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nCount" is null then '' else '"' || cast(cast(new."nCount" as numeric) as varchar) || '"' end||','||
          case when new."nMainid" is null then '' else '"' || replace(replace(cast(new."nMainid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnMainid" is null then '' else '"' || cast(cast(new."ZnMainid" as numeric) as varchar) || '"' end||','||
          case when new."ZnSMid" is null then '' else '"' || cast(cast(new."ZnSMid" as numeric) as varchar) || '"' end,                                                                                                                                                      
                                      'helpcenter_submodule',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
