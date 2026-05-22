CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_bdctgry_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'BDACategory',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      249,                                                                                                                                             
                                      
          case when old."nBDACid" is null then '' else '"' || replace(replace(cast(old."nBDACid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nBDACid" is null then '' else '"' || replace(replace(cast(old."nBDACid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cAttr" is null then '' else '"' || replace(replace(cast(old."cAttr" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnBDACid" is null then '' else '"' || cast(cast(old."ZnBDACid" as numeric) as varchar) || '"' end,                                                                                                                                                   
                                      'public_bdacategory',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
