CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_wmshrd_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'WMShared',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      289,                                                                                                                                             
                                      
          case when old."nWMSid" is null then '' else '"' || replace(replace(cast(old."nWMSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nWMSid" is null then '' else '"' || replace(replace(cast(old."nWMSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nWebid" is null then '' else '"' || replace(replace(cast(old."nWebid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end||','||
          case when old."ZnWMSid" is null then '' else '"' || cast(cast(old."ZnWMSid" as numeric) as varchar) || '"' end||','||
          case when old."ZnWebid" is null then '' else '"' || cast(cast(old."ZnWebid" as numeric) as varchar) || '"' end,                                                                                                                                                   
                                      'public_wmshared',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
