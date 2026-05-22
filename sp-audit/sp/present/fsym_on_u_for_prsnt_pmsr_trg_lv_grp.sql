CREATE OR REPLACE FUNCTION present.fsym_on_u_for_prsnt_pmsr_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nPUid" is null then '' else '"' || replace(replace(cast(new."nPUid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cStatus" is null then '' else '"' || replace(replace(cast(new."cStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dActionDt" is null then '' when isfinite(new."dActionDt") then '"' || to_char(new."dActionDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."cAStatus" is null then '' else '"' || replace(replace(cast(new."cAStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nControl" is null then '' else '"' || cast(cast(new."nControl" as numeric) as varchar) || '"' end||','||
          case when new."nPresentid" is null then '' else '"' || replace(replace(cast(new."nPresentid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUserid" is null then '' else '"' || replace(replace(cast(new."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnPUid" is null then '' else '"' || cast(cast(new."ZnPUid" as numeric) as varchar) || '"' end||','||
          case when new."ZnPresentid" is null then '' else '"' || cast(cast(new."ZnPresentid" as numeric) as varchar) || '"' end||','||
          case when new."ZnUserid" is null then '' else '"' || cast(cast(new."ZnUserid" as numeric) as varchar) || '"' end; 
                                    var_old_data := 
          case when old."nPUid" is null then '' else '"' || replace(replace(cast(old."nPUid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cStatus" is null then '' else '"' || replace(replace(cast(old."cStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dActionDt" is null then '' when isfinite(old."dActionDt") then '"' || to_char(old."dActionDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."cAStatus" is null then '' else '"' || replace(replace(cast(old."cAStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nControl" is null then '' else '"' || cast(cast(old."nControl" as numeric) as varchar) || '"' end||','||
          case when old."nPresentid" is null then '' else '"' || replace(replace(cast(old."nPresentid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnPUid" is null then '' else '"' || cast(cast(old."ZnPUid" as numeric) as varchar) || '"' end||','||
          case when old."ZnPresentid" is null then '' else '"' || cast(cast(old."ZnPresentid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'PMUser',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      224,                                                                                                                                             
                                      
          case when old."nPUid" is null then '' else '"' || replace(replace(cast(old."nPUid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'present_pmuser',                                                                                                                                                
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
