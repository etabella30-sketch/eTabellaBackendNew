CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_tskrmndrs_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'TaskReminders',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      283,                                                                                                                                             
                                      
          case when new."nTRid" is null then '' else '"' || replace(replace(cast(new."nTRid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nm" is null then '' else '"' || replace(replace(cast(new."nm" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."time" is null then '' else '"' || replace(replace(cast(new."time" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."tType" is null then '' else '"' || replace(replace(cast(new."tType" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."value" is null then '' else '"' || replace(replace(cast(new."value" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."error" is null then '' when new."error" then '"1"' else '"0"' end||','||
          case when new."email" is null then '' when new."email" then '"1"' else '"0"' end||','||
          case when new."inapp" is null then '' when new."inapp" then '"1"' else '"0"' end||','||
          case when new."nTaskid" is null then '' else '"' || replace(replace(cast(new."nTaskid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnTRid" is null then '' else '"' || cast(cast(new."ZnTRid" as numeric) as varchar) || '"' end||','||
          case when new."ZnTaskid" is null then '' else '"' || cast(cast(new."ZnTaskid" as numeric) as varchar) || '"' end||','||
          case when new."dReminderDt" is null then '' when isfinite(new."dReminderDt") then '"' || to_char(new."dReminderDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end,                                                                                                                                                      
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
