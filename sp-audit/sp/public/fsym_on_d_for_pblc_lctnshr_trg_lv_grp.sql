CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_lctnshr_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'LocationShare',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      234,                                                                                                                                             
                                      
          case when old."nLSid" is null then '' else '"' || replace(replace(cast(old."nLSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nLSid" is null then '' else '"' || replace(replace(cast(old."nLSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nBundledetailid" is null then '' else '"' || replace(replace(cast(old."nBundledetailid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nShareby" is null then '' else '"' || replace(replace(cast(old."nShareby" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnBundledetailid" is null then '' else '"' || cast(cast(old."ZnBundledetailid" as numeric) as varchar) || '"' end||','||
          case when old."ZnLSid" is null then '' else '"' || cast(cast(old."ZnLSid" as numeric) as varchar) || '"' end||','||
          case when old."ZnShareby" is null then '' else '"' || cast(cast(old."ZnShareby" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end,                                                                                                                                                   
                                      'public_locationshare',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
