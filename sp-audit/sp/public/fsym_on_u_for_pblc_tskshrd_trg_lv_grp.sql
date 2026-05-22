CREATE OR REPLACE FUNCTION public.fsym_on_u_for_pblc_tskshrd_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nTSid" is null then '' else '"' || replace(replace(cast(new."nTSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nTaskid" is null then '' else '"' || replace(replace(cast(new."nTaskid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUserid" is null then '' else '"' || replace(replace(cast(new."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnTSid" is null then '' else '"' || cast(cast(new."ZnTSid" as numeric) as varchar) || '"' end||','||
          case when new."ZnTaskid" is null then '' else '"' || cast(cast(new."ZnTaskid" as numeric) as varchar) || '"' end||','||
          case when new."ZnUserid" is null then '' else '"' || cast(cast(new."ZnUserid" as numeric) as varchar) || '"' end||','||
          case when new."bCanComment" is null then '' when new."bCanComment" then '"1"' else '"0"' end||','||
          case when new."bCanCopy" is null then '' when new."bCanCopy" then '"1"' else '"0"' end||','||
          case when new."bCanEdit" is null then '' when new."bCanEdit" then '"1"' else '"0"' end||','||
          case when new."bCanReshare" is null then '' when new."bCanReshare" then '"1"' else '"0"' end; 
                                    var_old_data := 
          case when old."nTSid" is null then '' else '"' || replace(replace(cast(old."nTSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nTaskid" is null then '' else '"' || replace(replace(cast(old."nTaskid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnTSid" is null then '' else '"' || cast(cast(old."ZnTSid" as numeric) as varchar) || '"' end||','||
          case when old."ZnTaskid" is null then '' else '"' || cast(cast(old."ZnTaskid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end||','||
          case when old."bCanComment" is null then '' when old."bCanComment" then '"1"' else '"0"' end||','||
          case when old."bCanCopy" is null then '' when old."bCanCopy" then '"1"' else '"0"' end||','||
          case when old."bCanEdit" is null then '' when old."bCanEdit" then '"1"' else '"0"' end||','||
          case when old."bCanReshare" is null then '' when old."bCanReshare" then '"1"' else '"0"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'TaskShared',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      290,                                                                                                                                             
                                      
          case when old."nTSid" is null then '' else '"' || replace(replace(cast(old."nTSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'public_taskshared',                                                                                                                                                
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
