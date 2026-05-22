CREATE OR REPLACE FUNCTION sym.fsym_on_d_for_sym_tgng_rrr_srvr()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'sym_outgoing_error',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      214,                                                                                                                                             
                                      
          case when old."batch_id" is null then '' else '"' || cast(cast(old."batch_id" as numeric) as varchar) || '"' end||','||
          case when old."node_id" is null then '' else '"' || replace(replace(cast(old."node_id" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."failed_row_number" is null then '' else '"' || cast(cast(old."failed_row_number" as numeric) as varchar) || '"' end,                                                                                                                                                      
                                      null,                                                                                                                                                   
                                      'system',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
