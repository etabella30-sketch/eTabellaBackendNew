CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_tskrmndrs_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'TaskReminders',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      283,                                                                                                                                             
                                      
          case when old."nTRid" is null then '' else '"' || replace(replace(cast(old."nTRid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nTRid" is null then '' else '"' || replace(replace(cast(old."nTRid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nm" is null then '' else '"' || replace(replace(cast(old."nm" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."time" is null then '' else '"' || replace(replace(cast(old."time" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."tType" is null then '' else '"' || replace(replace(cast(old."tType" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."value" is null then '' else '"' || replace(replace(cast(old."value" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."error" is null then '' when old."error" then '"1"' else '"0"' end||','||
          case when old."email" is null then '' when old."email" then '"1"' else '"0"' end||','||
          case when old."inapp" is null then '' when old."inapp" then '"1"' else '"0"' end||','||
          case when old."nTaskid" is null then '' else '"' || replace(replace(cast(old."nTaskid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnTRid" is null then '' else '"' || cast(cast(old."ZnTRid" as numeric) as varchar) || '"' end||','||
          case when old."ZnTaskid" is null then '' else '"' || cast(cast(old."ZnTaskid" as numeric) as varchar) || '"' end||','||
          case when old."dReminderDt" is null then '' when isfinite(old."dReminderDt") then '"' || to_char(old."dReminderDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end,                                                                                                                                                   
                                      'public_taskreminders',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
