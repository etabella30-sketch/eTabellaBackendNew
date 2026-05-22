CREATE OR REPLACE FUNCTION public.fsym_on_u_for_pblc_wmshrd_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nWMSid" is null then '' else '"' || replace(replace(cast(new."nWMSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUserid" is null then '' else '"' || replace(replace(cast(new."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nWebid" is null then '' else '"' || replace(replace(cast(new."nWebid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnUserid" is null then '' else '"' || cast(cast(new."ZnUserid" as numeric) as varchar) || '"' end||','||
          case when new."ZnWMSid" is null then '' else '"' || cast(cast(new."ZnWMSid" as numeric) as varchar) || '"' end||','||
          case when new."ZnWebid" is null then '' else '"' || cast(cast(new."ZnWebid" as numeric) as varchar) || '"' end; 
                                    var_old_data := 
          case when old."nWMSid" is null then '' else '"' || replace(replace(cast(old."nWMSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nWebid" is null then '' else '"' || replace(replace(cast(old."nWebid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end||','||
          case when old."ZnWMSid" is null then '' else '"' || cast(cast(old."ZnWMSid" as numeric) as varchar) || '"' end||','||
          case when old."ZnWebid" is null then '' else '"' || cast(cast(old."ZnWebid" as numeric) as varchar) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'WMShared',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      289,                                                                                                                                             
                                      
          case when old."nWMSid" is null then '' else '"' || replace(replace(cast(old."nWMSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'public_wmshared',                                                                                                                                                
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
