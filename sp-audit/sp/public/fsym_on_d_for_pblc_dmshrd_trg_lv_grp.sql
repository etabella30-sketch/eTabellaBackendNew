CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_dmshrd_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'DMShared',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      269,                                                                                                                                             
                                      
          case when old."nDMSid" is null then '' else '"' || replace(replace(cast(old."nDMSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nDMSid" is null then '' else '"' || replace(replace(cast(old."nDMSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nDocid" is null then '' else '"' || replace(replace(cast(old."nDocid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnDMSid" is null then '' else '"' || cast(cast(old."ZnDMSid" as numeric) as varchar) || '"' end||','||
          case when old."ZnDocid" is null then '' else '"' || cast(cast(old."ZnDocid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end||','||
          case when old."bCanComment" is null then '' when old."bCanComment" then '"1"' else '"0"' end||','||
          case when old."bCanCopy" is null then '' when old."bCanCopy" then '"1"' else '"0"' end||','||
          case when old."bCanEdit" is null then '' when old."bCanEdit" then '"1"' else '"0"' end||','||
          case when old."bCanReshare" is null then '' when old."bCanReshare" then '"1"' else '"0"' end,                                                                                                                                                   
                                      'public_dmshared',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
