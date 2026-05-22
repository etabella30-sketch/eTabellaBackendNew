CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_rlmstr_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'RoleMaster',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      272,                                                                                                                                             
                                      
          case when old."nRoleid" is null then '' else '"' || replace(replace(cast(old."nRoleid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nRoleid" is null then '' else '"' || replace(replace(cast(old."nRoleid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cRole" is null then '' else '"' || replace(replace(cast(old."cRole" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cRStatus" is null then '' else '"' || replace(replace(cast(old."cRStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnRoleid" is null then '' else '"' || cast(cast(old."ZnRoleid" as numeric) as varchar) || '"' end||','||
          case when old."nSrno" is null then '' else '"' || cast(cast(old."nSrno" as numeric) as varchar) || '"' end,                                                                                                                                                   
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
