CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_bdsrlnks_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'BDUserlinks',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      256,                                                                                                                                             
                                      
          case when new."nBDULid" is null then '' else '"' || replace(replace(cast(new."nBDULid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."isFact" is null then '' when new."isFact" then '"1"' else '"0"' end||','||
          case when new."isFL" is null then '' when new."isFL" then '"1"' else '"0"' end||','||
          case when new."isDL" is null then '' when new."isDL" then '"1"' else '"0"' end||','||
          case when new."isWL" is null then '' when new."isWL" then '"1"' else '"0"' end||','||
          case when new."nBundledetailid" is null then '' else '"' || replace(replace(cast(new."nBundledetailid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUserid" is null then '' else '"' || replace(replace(cast(new."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnBDULid" is null then '' else '"' || cast(cast(new."ZnBDULid" as numeric) as varchar) || '"' end||','||
          case when new."ZnBundledetailid" is null then '' else '"' || cast(cast(new."ZnBundledetailid" as numeric) as varchar) || '"' end||','||
          case when new."ZnUserid" is null then '' else '"' || cast(cast(new."ZnUserid" as numeric) as varchar) || '"' end,                                                                                                                                                      
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
