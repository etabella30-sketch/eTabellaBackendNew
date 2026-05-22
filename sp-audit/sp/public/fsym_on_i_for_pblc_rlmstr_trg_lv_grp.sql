CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_rlmstr_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'RoleMaster',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      272,                                                                                                                                             
                                      
          case when new."nRoleid" is null then '' else '"' || replace(replace(cast(new."nRoleid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cRole" is null then '' else '"' || replace(replace(cast(new."cRole" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cRStatus" is null then '' else '"' || replace(replace(cast(new."cRStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnRoleid" is null then '' else '"' || cast(cast(new."ZnRoleid" as numeric) as varchar) || '"' end||','||
          case when new."nSrno" is null then '' else '"' || cast(cast(new."nSrno" as numeric) as varchar) || '"' end,                                                                                                                                                      
                                      'public_rolemaster',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
