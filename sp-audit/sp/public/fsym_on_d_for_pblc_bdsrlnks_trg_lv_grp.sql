CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_bdsrlnks_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'BDUserlinks',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      256,                                                                                                                                             
                                      
          case when old."nBDULid" is null then '' else '"' || replace(replace(cast(old."nBDULid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nBDULid" is null then '' else '"' || replace(replace(cast(old."nBDULid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."isFact" is null then '' when old."isFact" then '"1"' else '"0"' end||','||
          case when old."isFL" is null then '' when old."isFL" then '"1"' else '"0"' end||','||
          case when old."isDL" is null then '' when old."isDL" then '"1"' else '"0"' end||','||
          case when old."isWL" is null then '' when old."isWL" then '"1"' else '"0"' end||','||
          case when old."nBundledetailid" is null then '' else '"' || replace(replace(cast(old."nBundledetailid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnBDULid" is null then '' else '"' || cast(cast(old."ZnBDULid" as numeric) as varchar) || '"' end||','||
          case when old."ZnBundledetailid" is null then '' else '"' || cast(cast(old."ZnBundledetailid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end,                                                                                                                                                   
                                      'public_bduserlinks',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
