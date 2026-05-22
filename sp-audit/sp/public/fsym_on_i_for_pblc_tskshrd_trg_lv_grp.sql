CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_tskshrd_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'TaskShared',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      290,                                                                                                                                             
                                      
          case when new."nTSid" is null then '' else '"' || replace(replace(cast(new."nTSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nTaskid" is null then '' else '"' || replace(replace(cast(new."nTaskid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUserid" is null then '' else '"' || replace(replace(cast(new."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnTSid" is null then '' else '"' || cast(cast(new."ZnTSid" as numeric) as varchar) || '"' end||','||
          case when new."ZnTaskid" is null then '' else '"' || cast(cast(new."ZnTaskid" as numeric) as varchar) || '"' end||','||
          case when new."ZnUserid" is null then '' else '"' || cast(cast(new."ZnUserid" as numeric) as varchar) || '"' end||','||
          case when new."bCanComment" is null then '' when new."bCanComment" then '"1"' else '"0"' end||','||
          case when new."bCanCopy" is null then '' when new."bCanCopy" then '"1"' else '"0"' end||','||
          case when new."bCanEdit" is null then '' when new."bCanEdit" then '"1"' else '"0"' end||','||
          case when new."bCanReshare" is null then '' when new."bCanReshare" then '"1"' else '"0"' end,                                                                                                                                                      
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
