CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_bmprmssn_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'BMPermission',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      281,                                                                                                                                             
                                      
          case when old."nBMPid" is null then '' else '"' || replace(replace(cast(old."nBMPid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nBMPid" is null then '' else '"' || replace(replace(cast(old."nBMPid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nBundleid" is null then '' else '"' || replace(replace(cast(old."nBundleid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nTRid" is null then '' else '"' || replace(replace(cast(old."nTRid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnBMPid" is null then '' else '"' || cast(cast(old."ZnBMPid" as numeric) as varchar) || '"' end||','||
          case when old."ZnBundleid" is null then '' else '"' || cast(cast(old."ZnBundleid" as numeric) as varchar) || '"' end||','||
          case when old."ZnTRid" is null then '' else '"' || cast(cast(old."ZnTRid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end,                                                                                                                                                   
                                      'public_bmpermission',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
