CREATE OR REPLACE FUNCTION helpcenter.fsym_on_u_for_hlpcntr_sbmdl_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nSMid" is null then '' else '"' || replace(replace(cast(new."nSMid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cTitle" is null then '' else '"' || replace(replace(cast(new."cTitle" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cLink" is null then '' else '"' || replace(replace(cast(new."cLink" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cDescription" is null then '' else '"' || replace(replace(cast(new."cDescription" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dCreateDt" is null then '' when isfinite(new."dCreateDt") then '"' || to_char(new."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."jTags" is null then '' else '"' || replace(replace(cast(new."jTags" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nCount" is null then '' else '"' || cast(cast(new."nCount" as numeric) as varchar) || '"' end||','||
          case when new."nMainid" is null then '' else '"' || replace(replace(cast(new."nMainid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnMainid" is null then '' else '"' || cast(cast(new."ZnMainid" as numeric) as varchar) || '"' end||','||
          case when new."ZnSMid" is null then '' else '"' || cast(cast(new."ZnSMid" as numeric) as varchar) || '"' end; 
                                    var_old_data := 
          case when old."nSMid" is null then '' else '"' || replace(replace(cast(old."nSMid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cTitle" is null then '' else '"' || replace(replace(cast(old."cTitle" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cLink" is null then '' else '"' || replace(replace(cast(old."cLink" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cDescription" is null then '' else '"' || replace(replace(cast(old."cDescription" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dCreateDt" is null then '' when isfinite(old."dCreateDt") then '"' || to_char(old."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."jTags" is null then '' else '"' || replace(replace(cast(old."jTags" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nCount" is null then '' else '"' || cast(cast(old."nCount" as numeric) as varchar) || '"' end||','||
          case when old."nMainid" is null then '' else '"' || replace(replace(cast(old."nMainid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnMainid" is null then '' else '"' || cast(cast(old."ZnMainid" as numeric) as varchar) || '"' end||','||
          case when old."ZnSMid" is null then '' else '"' || cast(cast(old."ZnSMid" as numeric) as varchar) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'SubModule',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      261,                                                                                                                                             
                                      
          case when old."nSMid" is null then '' else '"' || replace(replace(cast(old."nSMid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'helpcenter_submodule',                                                                                                                                                
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
