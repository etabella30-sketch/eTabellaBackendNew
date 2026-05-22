CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_tskshrd_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'TaskShared',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      290,                                                                                                                                             
                                      
          case when old."nTSid" is null then '' else '"' || replace(replace(cast(old."nTSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nTSid" is null then '' else '"' || replace(replace(cast(old."nTSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nTaskid" is null then '' else '"' || replace(replace(cast(old."nTaskid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnTSid" is null then '' else '"' || cast(cast(old."ZnTSid" as numeric) as varchar) || '"' end||','||
          case when old."ZnTaskid" is null then '' else '"' || cast(cast(old."ZnTaskid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end||','||
          case when old."bCanComment" is null then '' when old."bCanComment" then '"1"' else '"0"' end||','||
          case when old."bCanCopy" is null then '' when old."bCanCopy" then '"1"' else '"0"' end||','||
          case when old."bCanEdit" is null then '' when old."bCanEdit" then '"1"' else '"0"' end||','||
          case when old."bCanReshare" is null then '' when old."bCanReshare" then '"1"' else '"0"' end,                                                                                                                                                   
                                      'public_taskshared',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
